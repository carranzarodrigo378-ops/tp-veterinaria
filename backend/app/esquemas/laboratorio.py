from pydantic import BaseModel, Field

class LaboratorioBase(BaseModel):
    nombre: str = Field(min_length=1)
    direccion: str = Field(min_length=1)
    telefono: str = Field(min_length=1)

class LaboratorioCrear(LaboratorioBase):
    pass

class LaboratorioActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=1)
    direccion: str | None = Field(default=None, min_length=1)
    telefono: str | None = Field(default=None, min_length=1)
    
class LaboratorioRespuesta(LaboratorioBase):
    id_laboratorio: int 