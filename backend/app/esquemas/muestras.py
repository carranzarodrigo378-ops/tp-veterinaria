from pydantic import BaseModel
from datetime import datetime
from app.esquemas.enums import EstadoMuestra

class MuestraBase(BaseModel):
    orden_derivacion_id: int
    remito_id: int | None = None
    codigo: str
    tipo: str | None = None
    fecha_extraccion: datetime
    estado_actual: EstadoMuestra = EstadoMuestra.extraida

class MuestraCrear(MuestraBase):
    pass

class MuestraActualizar(BaseModel):
    remito_id: int | None = None
    estado_actual: EstadoMuestra | None = None

class MuestraRespuesta(MuestraBase):
    id_muestra: int

class HistorialEstadoMuestraBase(BaseModel):
    muestra_id: int
    estado: EstadoMuestra
    fecha_hora: datetime
    usuario: str | None = None
    observaciones: str | None = None

class HistorialEstadoMuestraCrear(HistorialEstadoMuestraBase):
    pass

class HistorialEstadoMuestraRespuesta(HistorialEstadoMuestraBase):
    id_historial_estado_muestra: int    