from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import configuracion

# Contexto para encriptar contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hashear_password(password: str) -> str:
    """Genera el hash seguro de la contraseña."""
    return pwd_context.hash(password)


def verificar_password(password_plano: str, password_hasheado: str) -> bool:
    """Verifica si la contraseña ingresada coincide con el hash almacenado."""
    return pwd_context.verify(password_plano, password_hasheado)


def crear_token_acceso(datos: dict, tiempo_expiracion: Optional[timedelta] = None) -> str:
    """
    Genera un token JWT firmado.
    Guarda en el payload los datos de usuario (sub, rol, etc.) y la fecha de expiración.
    """
    datos_a_codificar = datos.copy()
    
    if tiempo_expiracion:
        expira = datetime.utcnow() + tiempo_expiracion
    else:
        expira = datetime.utcnow() + timedelta(minutes=configuracion.EXPIRACION_MINUTOS)
        
    datos_a_codificar.update({"exp": expira})
    
    token_jwt = jwt.encode(
        datos_a_codificar, 
        configuracion.SECRET_KEY, 
        algorithm=configuracion.ALGORITMO
    )
    return token_jwt


def decodificar_token(token: str) -> Optional[dict]:
    """
    Decodifica y valida la firma y expiración del token JWT.
    Devuelve el payload si es válido o None si expiró/es inválido.
    """
    try:
        payload = jwt.decode(
            token, 
            configuracion.SECRET_KEY, 
            algorithms=[configuracion.ALGORITMO]
        )
        return payload
    except JWTError:
        return None