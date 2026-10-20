from pydantic import BaseModel, EmailStr


class ClienteSchema(BaseModel):
    nombre: str
    apellido: str
    dni: str
    telefono: str
    email: EmailStr     
    direccion: str = ""


class ClienteCrear(ClienteSchema):
    pass


class ClienteRespuesta(ClienteSchema):
    id_cliente: int