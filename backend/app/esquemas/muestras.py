from pydantic import BaseModel


# --- Esquema para registrar una nueva muestra en clínica ---
class MuestraCrear(BaseModel):
    codigo_etiqueta: str
    id_orden_derivacion: int
    tipo_muestra: str  # Ej: Sangre, Orina, Biopsia


# --- Esquema para empaquetar en conservadora isotérmica ---
class MuestraEmpaquetar(BaseModel):
    id_conservadora: str
    nro_precinto: str


# --- Esquema para despacho hacia el laboratorio central ---
class MuestraDespachar(BaseModel):
    transporte_info: str  # Ej: "Vehículo refrigerado - Chofer Gómez"


# --- Esquema para recepción en el laboratorio central ---
class MuestraRecepcion(BaseModel):
    precinto_intacto: bool  # Si es False, pasa inmediatamente a Rechazada
    observaciones: str = ""


# --- Esquema para registrar el resultado final ---
class MuestraAnalizar(BaseModel):
    resultado_id: str


# --- Esquemas de lectura / respuesta ---
class EventoTrazabilidadRespuesta(BaseModel):
    fecha_hora: str
    estado_anterior: str
    estado_nuevo: str
    motivo: str


class MuestraDetalleRespuesta(BaseModel):
    id_muestra: int | None = None
    codigo_etiqueta: str
    id_orden_derivacion: int
    tipo_muestra: str
    estado_actual: str
    id_conservadora: str | None = None
    nro_precinto: str | None = None
    transporte_info: str | None = None
    id_resultado: str | None = None
    historial_trazabilidad: list[EventoTrazabilidadRespuesta] = []