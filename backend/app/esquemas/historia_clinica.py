from pydantic import BaseModel
from datetime import datetime
 
class HistoriaClinicaBase(BaseModel):
    id_mascota: int
    fecha_apertura: datetime  # Formato ISO 8601: YYYY-MM-DD
    fecha_cierre: datetime | None = None  # Formato ISO 8601: YYYY-MM-DD
    observaciones: str | None = None

class HistoriaClinicaCrear(HistoriaClinicaBase):
    pass

class HistoriaClinicaActualizar(BaseModel):
    fecha_cierre: datetime | None = None  # Formato ISO 8601: YYYY-MM-DD
    observaciones: str | None = None

class HistoriaClinicaRespuesta(HistoriaClinicaBase):
    id_historia_clinica: int