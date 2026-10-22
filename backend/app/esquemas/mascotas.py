from datetime import date

from pydantic import BaseModel, Field

from app.esquemas.enums import Sexo


class MascotaBase(BaseModel):
    nombre: str = Field(min_length=1)
    especie: str = Field(min_length=1)
    raza: str | None = None
    sexo: Sexo
    fecha_nacimiento: date | None = None
    id_cliente: int  # Regla: toda mascota debe tener un responsable


class MascotaCrear(MascotaBase):
    pass


class MascotaActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=1)
    especie: str | None = Field(default=None, min_length=1)
    raza: str | None = None
    sexo: Sexo | None = None
    fecha_nacimiento: date | None = None
    id_cliente: int | None = None


class MascotaRespuesta(MascotaBase):
    id_mascota: int