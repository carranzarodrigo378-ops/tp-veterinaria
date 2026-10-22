from pydantic import BaseModel, EmailStr, Field

class ClienteBase(BaseModel):
    nombre: str = Field(min_length=1)
    apellido: str = Field(min_length=1)
    dni: str = Field(min_length=7, max_length=10)
    telefono: str = Field(min_length=1)
    email: EmailStr | None = None
    direccion: str | None = None

class ClienteActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=1)
    apellido: str | None = Field(default=None, min_length=1)
    dni: str | None = Field(default=None, min_length=7, max_length=10)
    telefono: str | None = Field(default=None, min_length=1)
    email: EmailStr | None = None
    direccion: str | None = None

class ClienteCrear(ClienteSchema):
    pass


class ClienteRespuesta(ClienteSchema):
    id_cliente: int