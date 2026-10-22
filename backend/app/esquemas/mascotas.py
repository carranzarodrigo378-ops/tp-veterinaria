from datetime import date
from pydantic import BaseModel
from app.esquemas.enums import Sexo

class MascotaBase(BaseModel):
    nombre: str
    especie: str
    raza: str | None = None
    sexo: Sexo
    fecha_nacimiento: date | None = None
    id_cliente: int

class MascotaCrear(MascotaBase):
    pass


class MascotaRespuesta(MascotaBase):
    id_mascota: int
    historial_clinico: str = ""