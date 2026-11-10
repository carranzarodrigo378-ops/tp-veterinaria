from pydantic import BaseModel, EmailStr, Field
from app.esquemas.validadores import Telefono


class ClienteBase(BaseModel):
    nombre: str = Field(min_length=1)
    apellido: str = Field(min_length=1)
    dni: str = Field(min_length=7, max_length=10)
    telefono: Telefono
    email: EmailStr | None = None
    direccion: str | None = None


class ClienteCrear(ClienteBase):
    pass


class ClienteActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=1)
    apellido: str | None = Field(default=None, min_length=1)
    dni: str | None = Field(default=None, min_length=7, max_length=10)
    telefono: Telefono | None = None
    email: EmailStr | None = None
    direccion: str | None = None


class ClienteRespuesta(ClienteBase):
    id_cliente: int