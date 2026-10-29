import sqlite3
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field

from app.core.seguridad import (
    crear_token_acceso,
    hashear_password,
    verificar_password,
)
from app.rutas.dependencias import requerir_rol
from app.persistencia.conexion import DatabaseSingleton

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


# --- Esquemas Pydantic ---

class LoginJsonEsquema(BaseModel):
    usuario: str = Field(min_length=1, description="Nombre de usuario")
    password: str = Field(min_length=1, description="Contraseña")


class RegistroClienteEsquema(BaseModel):
    usuario: str = Field(min_length=3, description="Nombre de usuario para iniciar sesión")
    password: str = Field(min_length=4, description="Contraseña de acceso")
    nombre: str = Field(min_length=1, description="Nombre de pila")
    apellido: str = Field(min_length=1, description="Apellido")
    dni: str = Field(default="", description="DNI del cliente (opcional en formulario rápido)")
    email: EmailStr = Field(description="Correo electrónico válido")
    telefono: str = Field(default="", description="Teléfono de contacto")


class RegistroVeterinarioEsquema(BaseModel):
    usuario: str = Field(min_length=3, description="Nombre de usuario del profesional")
    password: str = Field(min_length=4, description="Contraseña temporal asignada")
    nombre_completo: str = Field(min_length=1, description="Nombre y apellido completos")
    matricula: str = Field(min_length=1, description="Matrícula profesional (ej: MP-4589)")


def _obtener_usuario_db(username: str) -> dict | None:
    conn = DatabaseSingleton().get_conexion()
    cursor = conn.execute("SELECT * FROM usuarios WHERE usuario = ?", (username,))
    fila = cursor.fetchone()
    return dict(fila) if fila else None


# --- Endpoints de Autenticación ---

@router.post("/login")
def login(formulario: OAuth2PasswordRequestForm = Depends()):
    """Endpoint estándar OAuth2 para el candado verde de Swagger UI."""
    usuario_info = _obtener_usuario_db(formulario.username)
    if not usuario_info or not verificar_password(formulario.password, usuario_info["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = crear_token_acceso(datos={"sub": formulario.username, "rol": usuario_info["rol"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": formulario.username,
        "rol": usuario_info["rol"],
    }


@router.post("/login-json")
def login_json(credenciales: LoginJsonEsquema):
    """Endpoint en formato JSON para el formulario de login del frontend en React."""
    usuario_info = _obtener_usuario_db(credenciales.usuario)
    if not usuario_info or not verificar_password(credenciales.password, usuario_info["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )

    token = crear_token_acceso(datos={"sub": credenciales.usuario, "rol": usuario_info["rol"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": credenciales.usuario,
        "rol": usuario_info["rol"],
    }


# Autoregistro público: guarda tanto en 'clientes' como en 'usuarios'
@router.post("/registro-cliente", status_code=status.HTTP_201_CREATED)
def registrar_cliente(datos: RegistroClienteEsquema):
    if _obtener_usuario_db(datos.usuario):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está registrado.",
        )

    conn = DatabaseSingleton().get_conexion()
    cursor = conn.cursor()
    try:
        # Si el frontend no envía DNI, generamos uno único basado en el username para cumplir UNIQUE NOT NULL de clientes
        dni_final = datos.dni.strip() if datos.dni.strip() else f"USR-{datos.usuario}"
        telefono_final = datos.telefono.strip() if datos.telefono.strip() else "Sin especificar"

        cursor.execute(
            """
            INSERT INTO clientes (nombre, apellido, dni, telefono, email)
            VALUES (?, ?, ?, ?, ?)
            """,
            (datos.nombre, datos.apellido, dni_final, telefono_final, datos.email),
        )
        id_cliente = cursor.lastrowid

        cursor.execute(
            """
            INSERT INTO usuarios (usuario, password_hash, rol, nombre, apellido, email, telefono, id_cliente)
            VALUES (?, ?, 'cliente', ?, ?, ?, ?, ?)
            """,
            (
                datos.usuario,
                hashear_password(datos.password),
                datos.nombre,
                datos.apellido,
                datos.email,
                telefono_final,
                id_cliente,
            ),
        )
        conn.commit()
    except sqlite3.IntegrityError as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error de integridad al registrar cliente: {str(e)}",
        )

    return {
        "mensaje": "Cliente registrado exitosamente en la base de datos.",
        "usuario": datos.usuario,
        "rol": "cliente",
        "id_cliente": id_cliente,
    }


# Registro privado: solo el usuario con rol 'admin' puede dar de alta veterinarios
@router.post(
    "/registro-veterinario",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requerir_rol(["admin"]))],
)
def registrar_veterinario(datos: RegistroVeterinarioEsquema):
    if _obtener_usuario_db(datos.usuario):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está en uso.",
        )

    partes = datos.nombre_completo.strip().split(" ", 1)
    nombre = partes[0]
    apellido = partes[1] if len(partes) > 1 else "Profesional"

    conn = DatabaseSingleton().get_conexion()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO veterinarios (nombre, apellido, matricula, clinica_id)
            VALUES (?, ?, ?, 1)
            """,
            (nombre, apellido, datos.matricula),
        )
        id_veterinario = cursor.lastrowid

        cursor.execute(
            """
            INSERT INTO usuarios (usuario, password_hash, rol, nombre, apellido, matricula, id_veterinario)
            VALUES (?, ?, 'veterinario', ?, ?, ?, ?)
            """,
            (
                datos.usuario,
                hashear_password(datos.password),
                nombre,
                apellido,
                datos.matricula,
                id_veterinario,
            ),
        )
        conn.commit()
    except sqlite3.IntegrityError as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se pudo registrar el veterinario (verifique que la matrícula no esté duplicada): {str(e)}",
        )

    return {
        "mensaje": "Veterinario dado de alta exitosamente por el administrador.",
        "usuario": datos.usuario,
        "rol": "veterinario",
        "id_veterinario": id_veterinario,
    }


# Endpoint para verificar qué usuarios están guardados en SQLite
@router.get("/usuarios")
def listar_usuarios_registrados():
    conn = DatabaseSingleton().get_conexion()
    cursor = conn.execute(
        "SELECT id_usuario, usuario, rol, nombre, apellido, email, matricula, id_cliente, id_veterinario FROM usuarios"
    )
    return [dict(fila) for fila in cursor.fetchall()]