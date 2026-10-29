from datetime import datetime

from pydantic import BaseModel


class ResumenGeneralRespuesta(BaseModel):
    total_clientes: int
    total_mascotas: int
    total_consultas: int
    total_muestras: int


class DerivacionPorTipoRespuesta(BaseModel):
    tipo_analisis: str
    cantidad: int


class CalidadMuestrasRespuesta(BaseModel):
    total_muestras: int
    analizadas: int
    rechazadas: int
    en_proceso: int
    tasa_rechazo_porcentaje: float


class AlertaVacunaRespuesta(BaseModel):
    id_consulta: int
    fecha_hora: datetime
    mascota: str
    especie: str
    veterinario: str
    vacuna_faltante: str