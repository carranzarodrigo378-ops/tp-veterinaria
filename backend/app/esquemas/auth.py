from pydantic import BaseModel, EmailStr, Field
from app.esquemas.validadores import Telefono


class RegistroCliente(BaseModel):
    usuario: str = Field(min_length=3, description="Nombre de usuario para iniciar sesión")
    email: EmailStr = Field(description="Correo electrónico del cliente")
    password: str = Field(min_length=6, description="Contraseña de acceso")
    nombre: str = Field(min_length=1, description="Nombre de pila")
    apellido: str = Field(min_length=1, description="Apellido")
    telefono: Telefono = Field(default="", description="Teléfono de contacto")