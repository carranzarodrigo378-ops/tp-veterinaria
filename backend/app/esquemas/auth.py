from pydantic import BaseModel


class LoginEsquema(BaseModel):
    usuario: str
    password: str


class TokenRespuesta(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: str
    rol: str