from pydantic import BaseModel
from datetime import datetime
from app.esquemas.enums import EstadoMuestra, EstadoPrecinto  

class MuestraBase(BaseModel):
    orden_derivacion_id: int
    remito_id: int | None = None
    codigo: str
    tipo: str | None = None
    fecha_extraccion: datetime
    estado_actual: EstadoMuestra = EstadoMuestra.extraida

class MuestraCrear(MuestraBase):
    pass

class MuestraDespachar(BaseModel):
    responsable: str | None = None
    observaciones: str | None = None

class MuestraEmpaquetar(BaseModel):
    remito_id: int

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
    
class MuestraRecepcion(BaseModel):
    estado_precinto: EstadoPrecinto
    temperatura_recepcion_c: float | None = None
    recibido_por: str | None = None
    observaciones: str | None = None

class MuestraAnalizar(BaseModel):
    resultado: str
    validado_por: str | None = None

class MuestraDetalleRespuesta(BaseModel):
    id_muestra: int
    orden_derivacion_id: int
    remito_id: int | None = None
    codigo: str
    tipo: str | None = None
    fecha_extraccion: str
    estado_actual: str