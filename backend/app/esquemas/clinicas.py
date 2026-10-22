from pydantic import BaseModel, Field


class ClinicaBase(BaseModel):
    nombre: str = Field(min_length=1)
    direccion: str = Field(min_length=1)
    telefono: str = Field(min_length=1)
    activa: bool = True


class ClinicaCrear(ClinicaBase):
    pass


class ClinicaActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=1)
    direccion: str | None = Field(default=None, min_length=1)
    telefono: str | None = Field(default=None, min_length=1)
    activa: bool | None = None


class ClinicaRespuesta(ClinicaBase):
    id_clinica: int