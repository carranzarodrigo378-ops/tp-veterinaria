from pydantic import BaseModel
from app.esquemas.enums import EstadoContenedor

class ContenedorBase(BaseModel):
    codigo: str
    capacidad_muestras: int
    temperatura_objetivo_c: float
    estado: EstadoContenedor
    
class ContenedorActualizar(BaseModel):
    codigo: str | None = None
    capacidad_muestras: int | None = None
    temperatura_objetivo_c: float | None = None
    estado: EstadoContenedor | None = None

class ContenedorCrear(ContenedorBase):
    pass

class ContenedorRespuesta(ContenedorBase):
    id_contenedor: int