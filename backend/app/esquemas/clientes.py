from pydantic import BaseModel, EmailStr


class ClienteBase(BaseModel):
    nombre: str
    apellido: str
    dni: str
    telefono: str
    email: str
    direccion: str = ""


class ClienteCrear(ClienteBase):
    pass


class ClienteRespuesta(ClienteBase):
    id_cliente: int