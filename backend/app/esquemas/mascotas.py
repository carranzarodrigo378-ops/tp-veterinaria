from datetime import date
from pydantic import BaseModel


class MascotaBase(BaseModel):
    nombre: str
    especie: str  # Ej: Canino, Felino
    raza: str
    fecha_nacimiento: date 
    id_cliente: int  # Regla: toda mascota debe tener un responsable asociado


class MascotaCrear(MascotaBase):
    pass


class MascotaRespuesta(MascotaBase):
    id_mascota: int
    historial_clinico: str = ""