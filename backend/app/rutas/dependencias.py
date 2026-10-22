from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.seguridad import decodificar_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def obtener_usuario_actual(token: str = Depends(oauth2_scheme)):
    payload = decodificar_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    usuario = payload.get("sub")
    rol = payload.get("rol")
    if usuario is None or rol is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de usuario no válidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"usuario": usuario, "rol": rol}


def requerir_rol(roles_permitidos: list):
    """Dependencia para restringir accesos según los roles autorizados."""
    def verificador(usuario_actual: dict = Depends(obtener_usuario_actual)):
        if usuario_actual["rol"] not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requiere uno de los siguientes roles: {roles_permitidos}"
            )
        return usuario_actual
    return verificador