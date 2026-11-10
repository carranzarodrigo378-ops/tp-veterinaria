from pydantic import BaseModel, Field
from app.esquemas.validadores import Telefono   


class ClinicaBase(BaseModel):
    nombre: str = Field(min_length=1)
    direccion: str = Field(min_length=1)
    telefono: Telefono
    activa: bool = True


class ClinicaCrear(ClinicaBase):
    pass


class ClinicaActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=1)
    direccion: str | None = Field(default=None, min_length=1)
    telefono: Telefono | None = None
    activa: bool | None = None


class ClinicaRespuesta(ClinicaBase):
    id_clinica: int