from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field

from app.core.seguridad import (
    crear_token_acceso,
    hashear_password,
    verificar_password,
)
from app.rutas.dependencias import requerir_rol

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


# --- Esquemas Pydantic para tipado y documentación automática en Swagger ---

class LoginJsonEsquema(BaseModel):
    usuario: str = Field(min_length=1, description="Nombre de usuario")
    password: str = Field(min_length=1, description="Contraseña")


class RegistroClienteEsquema(BaseModel):
    usuario: str = Field(min_length=3, description="Nombre de usuario para iniciar sesión")
    password: str = Field(min_length=4, description="Contraseña de acceso")
    nombre: str = Field(min_length=1, description="Nombre de pila")
    apellido: str = Field(min_length=1, description="Apellido")
    email: EmailStr = Field(description="Correo electrónico válido")
    telefono: str = Field(default="", description="Teléfono de contacto")


class RegistroVeterinarioEsquema(BaseModel):
    usuario: str = Field(min_length=3, description="Nombre de usuario del profesional")
    password: str = Field(min_length=4, description="Contraseña temporal asignada")
    nombre_completo: str = Field(min_length=1, description="Nombre y apellido completos")
    matricula: str = Field(min_length=1, description="Matrícula profesional (ej: MP-4589)")


# --- Almacenamiento en memoria inicial con contraseñas seguras (bcrypt) ---

USUARIOS_DB = {
    "admin": {
        "password": hashear_password("admin123"),
        "rol": "admin",
        "nombre": "Administrador General",
    },
    "vet_franco": {
        "password": hashear_password("vet123"),
        "rol": "veterinario",
        "nombre": "Dr. Franco",
        "matricula": "MP-4589",
    },
}


# --- Endpoints de Autenticación ---

@router.post("/login")
def login(formulario: OAuth2PasswordRequestForm = Depends()):
    """Endpoint estándar OAuth2 para el candado verde de Swagger UI."""
    usuario_info = USUARIOS_DB.get(formulario.username)
    if not usuario_info or not verificar_password(formulario.password, usuario_info["password"]):
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
    usuario_info = USUARIOS_DB.get(credenciales.usuario)
    if not usuario_info or not verificar_password(credenciales.password, usuario_info["password"]):
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


# Autoregistro público: cualquiera puede registrarse como cliente
@router.post("/registro-cliente", status_code=status.HTTP_201_CREATED)
def registrar_cliente(datos: RegistroClienteEsquema):
    if datos.usuario in USUARIOS_DB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está registrado.",
        )

    USUARIOS_DB[datos.usuario] = {
        "password": hashear_password(datos.password),
        "rol": "cliente",
        "email": datos.email,
        "nombre": f"{datos.nombre} {datos.apellido}".strip(),
        "telefono": datos.telefono,
    }
    return {
        "mensaje": "Cliente registrado exitosamente.",
        "usuario": datos.usuario,
        "rol": "cliente",
    }


# Registro privado: solo el usuario con rol 'admin' puede dar de alta veterinarios
@router.post(
    "/registro-veterinario",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requerir_rol(["admin"]))],
)
def registrar_veterinario(datos: RegistroVeterinarioEsquema):
    if datos.usuario in USUARIOS_DB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está en uso.",
        )

    USUARIOS_DB[datos.usuario] = {
        "password": hashear_password(datos.password),
        "rol": "veterinario",
        "nombre": datos.nombre_completo,
        "matricula": datos.matricula,
    }
    return {
        "mensaje": "Veterinario dado de alta exitosamente por el administrador.",
        "usuario": datos.usuario,
        "rol": "veterinario",
    }