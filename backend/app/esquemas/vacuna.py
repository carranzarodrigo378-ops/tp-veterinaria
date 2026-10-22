from pydantic import BaseModel, Field

class VacunaBase(BaseModel):
    nombre: str = Field(min_length=1)
    descripcion: str = Field(min_length=1)
    precio: float = Field(gt=0)

class VacunaCrear(VacunaBase):
    pass

class VacunaActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=1)
    descripcion: str | None = Field(default=None, min_length=1)
    precio: float | None = Field(default=None, gt=0)
    
class VacunaRespuesta(VacunaBase):
    id_vacuna: int