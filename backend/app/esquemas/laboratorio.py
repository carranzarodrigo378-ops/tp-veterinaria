from pydantic import BaseModel, Field
from app.esquemas.validadores import Telefono

class LaboratorioBase(BaseModel):
    nombre: str = Field(min_length=1)
    direccion: str = Field(min_length=1)
    telefono: Telefono

class LaboratorioCrear(LaboratorioBase):
    pass

class LaboratorioActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=1)
    direccion: str | None = Field(default=None, min_length=1)
    telefono: Telefono | None = None

class LaboratorioRespuesta(LaboratorioBase):
    id_laboratorio: int 