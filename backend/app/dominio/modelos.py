from datetime import datetime
from app.dominio.estados import (
    EstadoMuestraBase,
    EstadoExtraida,
    EstadoEmpaquetada,
    EstadoEnTransito,
    EstadoRecibida,
    EstadoAnalizada,
    EstadoRechazada
)
from app.esquemas.enums import EstadoMuestra


class EventoTrazabilidad:
    """Representa una entrada inmutable en la bitácora de auditoría de la muestra."""
    def __init__(self, estado_anterior: str, estado_nuevo: str, motivo: str):
        self.fecha_hora = datetime.now().isoformat()
        self.estado_anterior = estado_anterior
        self.estado_nuevo = estado_nuevo
        self.motivo = motivo

    def a_diccionario(self) -> dict:
        return {
            "fecha_hora": self.fecha_hora,
            "estado_anterior": self.estado_anterior,
            "estado_nuevo": self.estado_nuevo,
            "motivo": self.motivo
        }


class MuestraBiologica:
    """Entidad principal del dominio que gestiona su ciclo de vida mediante el patrón State."""
    def __init__(
        self,
        id_muestra: int,
        codigo_etiqueta: str,
        id_orden_derivacion: int,
        tipo_muestra: str
    ):
        self.id_muestra = id_muestra
        self.codigo_etiqueta = codigo_etiqueta
        self.id_orden_derivacion = id_orden_derivacion
        self.tipo_muestra = tipo_muestra
        
        # Metadatos del envío y resultado
        self.id_conservadora: str | None = None
        self.nro_precinto: str | None = None
        self.transporte_info: str | None = None
        self.id_resultado: str | None = None
        
        # Historial inmutable (solo append)
        self._historial: list[EventoTrazabilidad] = []
        
        # Estado inicial del ciclo de vida
        self.estado: EstadoMuestraBase = EstadoExtraida()
        self._registrar_evento(
            estado_anterior="ninguno",
            estado_nuevo=self.estado.nombre,
            motivo="Extracción biológica y generación de etiqueta inicial"
        )

    def cambiar_estado(self, nuevo_estado: EstadoMuestraBase, motivo: str):
        estado_previo = self.estado.nombre
        self.estado = nuevo_estado
        self._registrar_evento(estado_previo, nuevo_estado.nombre, motivo)

    def _registrar_evento(self, estado_anterior: str, estado_nuevo: str, motivo: str):
        evento = EventoTrazabilidad(
            estado_anterior=estado_anterior,
            estado_nuevo=estado_nuevo,
            motivo=motivo
        )
        self._historial.append(evento)

    # Delegación de operaciones a los estados
    def empaquetar(self, id_conservadora: str, nro_precinto: str):
        self.estado.empaquetar(self, id_conservadora, nro_precinto)

    def despachar(self, transporte_info: str):
        self.estado.despachar(self, transporte_info)

    def recibir_en_laboratorio(self, precinto_intacto: bool, observaciones: str = ""):
        self.estado.recibir(self, precinto_intacto, observaciones)

    def registrar_analisis(self, resultado_id: str):
        self.estado.analizar(self, resultado_id)

    def obtener_trazabilidad_completa(self) -> list[dict]:
        return [evento.a_diccionario() for evento in self._historial]