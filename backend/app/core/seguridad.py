from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from app.core.config import configuracion


def hashear_password(password: str) -> str:
    """Genera el hash seguro en bcrypt usando directamente la librería nativa."""
    password_bytes = password.encode("utf-8")[:72]
    sal = bcrypt.gensalt()
    hash_bytes = bcrypt.hashpw(password_bytes, sal)
    return hash_bytes.decode("utf-8")


def verificar_password(password_plano: str, password_hasheado: str) -> bool:
    """Verifica si la contraseña ingresada coincide con el hash almacenado."""
    try:
        password_bytes = password_plano.encode("utf-8")[:72]
        hash_bytes = password_hasheado.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception:
        return False


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