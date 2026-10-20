from pydantic import BaseModel


class ConsultaMedicaCrear(BaseModel):
    id_mascota: int
    motivo: str
    diagnostico_preliminar: str
    esquema_vacunas_al_dia: bool = True  # Regla: control de vacunas obligatorias


class OrdenDerivacionCrear(BaseModel):
    id_consulta: int
    tipo_analisis: str  # Ej: Hemograma, Perfil Renal, Urianálisis
    prioridad: str = "Normal"  # Normal, Urgente
    observaciones: str = ""


class OrdenDerivacionRespuesta(BaseModel):
    id_orden: int
    id_consulta: int
    tipo_analisis: str
    prioridad: str
    observaciones: str
    fecha_emision: str