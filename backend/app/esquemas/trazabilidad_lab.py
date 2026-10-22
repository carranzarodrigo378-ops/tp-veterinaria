from pydantic import BaseModel
from datetime import datetime
from app.esquemas.enums import TipoEventoEnvio, EstadoPrecinto

class EventoEnvioBase(BaseModel):
    remito_biologico_id: int
    tipo: TipoEventoEnvio
    fecha_hora: datetime
    responsable: str | None = None
    observaciones: str | None = None

class EventoEnvioCrear(EventoEnvioBase):
    pass

class EventoEnvioRespuesta(EventoEnvioBase):
    id_evento_envio: int

class RecepcionLabBase(BaseModel):
    remito_biologico_id: int
    fecha_hora: datetime
    recibido_por: str | None = None
    estado_precinto: EstadoPrecinto
    temperatura_recepcion_c: float | None = None
    observaciones: str | None = None

class RecepcionLabCrear(RecepcionLabBase):
    pass

class RecepcionLabRespuesta(RecepcionLabBase):
    id_recepcion_lab: int

class ResultadoAnalisisBase(BaseModel):
    muestra_id: int
    fecha_resultado: datetime
    resultado: str
    validado_por: str | None = None

class ResultadoAnalisisCrear(ResultadoAnalisisBase):
    pass

class ResultadoAnalisisRespuesta(ResultadoAnalisisBase):
    id_resultado_analisis: int