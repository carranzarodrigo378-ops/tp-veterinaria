from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.seguridad import crear_token_acceso
from app.rutas.dependencias import requerir_rol

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

# Almacenamiento en memoria inicial con el Administrador único precargado
USUARIOS_DB = {
    "admin": {
        "password": "admin123",
        "rol": "admin",
        "nombre": "Administrador General"
    },
    "vet_franco": {
        "password": "vet123",
        "rol": "veterinario",
        "nombre": "Dr. Franco",
        "matricula": "MP-4589"
    }
}


@router.post("/login")
def login(formulario: OAuth2PasswordRequestForm = Depends()):
    usuario_info = USUARIOS_DB.get(formulario.username)
    if not usuario_info or usuario_info["password"] != formulario.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )
    
    token = crear_token_acceso(datos={"sub": formulario.username, "rol": usuario_info["rol"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": formulario.username,
        "rol": usuario_info["rol"]
    }


@router.post("/login-json")
def login_json(credenciales: dict):
    usuario = credenciales.get("usuario")
    password = credenciales.get("password")
    usuario_info = USUARIOS_DB.get(usuario)
    if not usuario_info or usuario_info["password"] != password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )
    
    token = crear_token_acceso(datos={"sub": usuario, "rol": usuario_info["rol"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": usuario,
        "rol": usuario_info["rol"]
    }


# Autoregistro público: cualquiera puede registrarse como cliente
@router.post("/registro-cliente", status_code=status.HTTP_201_CREATED)
def registrar_cliente(datos: dict):
    usuario = datos.get("usuario")
    password = datos.get("password")
    
    if not usuario or not password:
        raise HTTPException(status_code=400, detail="Usuario y password son requeridos.")
    if usuario in USUARIOS_DB:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está registrado.")
    
    USUARIOS_DB[usuario] = {
        "password": password,
        "rol": "cliente",
        "email": datos.get("email", ""),
        "nombre": datos.get("nombre", "")
    }
    return {"mensaje": "Cliente registrado exitosamente."}


# Registro privado: solo el usuario con rol 'admin' puede registrar nuevos veterinarios
@router.post(
    "/registro-veterinario",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requerir_rol(["admin"]))]
)
def registrar_veterinario(datos: dict):
    usuario = datos.get("usuario")
    password = datos.get("password")
    
    if not usuario or not password:
        raise HTTPException(status_code=400, detail="Usuario y password son requeridos.")
    if usuario in USUARIOS_DB:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso.")
    
    USUARIOS_DB[usuario] = {
        "password": password,
        "rol": "veterinario",
        "nombre": datos.get("nombre_completo", ""),
        "matricula": datos.get("matricula", "")
    }
    return {"mensaje": "Veterinario dado de alta exitosamente por el administrador."}