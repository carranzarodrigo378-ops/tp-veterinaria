from pydantic import BaseModel
from datetime import datetime
from app.esquemas.enums import Prioridad

class OrdenDerivacionBase(BaseModel):
    id_consulta: int
    tipo_analisis_id: int
    id_laboratorio: int
    fecha_emision: datetime
    indicaciones: str | None = None
    prioridad: Prioridad

class OrdenDerivacionCrear(OrdenDerivacionBase):
    pass

class OrdenDerivacionRespuesta(OrdenDerivacionBase):
    id_orden_derivacion: int