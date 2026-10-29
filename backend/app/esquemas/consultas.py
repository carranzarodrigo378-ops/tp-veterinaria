from pydantic import BaseModel


class ConsultaMedicaCrear(BaseModel):
    id_mascota: int
    motivo: str
    diagnostico_preliminar: str
    esquema_vacunas_al_dia: bool = True  # Regla: control de vacunas obligatorias


class ConsultaActualizar(BaseModel):
    motivo: str | None = None
    diagnostico: str | None = None
    tratamiento: str | None = None
    peso_kg: float | None = None


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


# Alias requerido por consulta_dao.py
ConsultaCrear = ConsultaMedicaCrear