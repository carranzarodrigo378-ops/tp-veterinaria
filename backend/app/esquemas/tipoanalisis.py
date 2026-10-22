from pydantic import BaseModel, Field
from app.esquemas.enums import TipoMuestra

class TipoAnalisisBase(BaseModel):
    nombre: str = Field(min_length=1, unique=True)
    tipo_muestra: TipoMuestra
    precio: float = Field(gt=0)
    temperatura_almacenamiento_c: float | None = None
    
class TipoAnalisisCrear(TipoAnalisisBase):
    pass

class TipoAnalisisActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=1)
    tipo_muestra: TipoMuestra | None = None
    precio: float | None = Field(default=None, gt=0)
    temperatura_almacenamiento_c: float | None = None
    
class TipoAnalisisRespuesta(TipoAnalisisBase):
    id_tipo_analisis: int