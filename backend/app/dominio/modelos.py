from datetime import datetime
from app.dominio.estados import EstadoExtraida


class EventoTrazabilidad:
    """Registro inmutable de un cambio de estado en la muestra."""
    def __init__(self, estado_anterior, estado_nuevo, motivo):
        self.fecha_hora = datetime.now()
        self.estado_anterior = estado_anterior
        self.estado_nuevo = estado_nuevo
        self.motivo = motivo

    def a_diccionario(self):
        return {
            "fecha_hora": self.fecha_hora.strftime("%Y-%m-%d %H:%M:%S"),
            "estado_anterior": self.estado_anterior,
            "estado_nuevo": self.estado_nuevo,
            "motivo": self.motivo
        }


class MuestraBiologica:
    """Contexto del Patrón State: gestiona la muestra y su fila cronológica de eventos."""
    def __init__(self, id_muestra, codigo_etiqueta, id_orden_derivacion, tipo_muestra, estado_inicial=None):
        self.id_muestra = id_muestra
        self.codigo_etiqueta = codigo_etiqueta
        self.id_orden_derivacion = id_orden_derivacion
        self.tipo_muestra = tipo_muestra
        
        # Datos logísticos y sanitarios
        self.id_conservadora = None
        self.nro_precinto = None
        self.transporte_info = None
        self.id_resultado = None

        # Fila cronológica de trazabilidad (cada evento se agrega atrás)
        self.historial_trazabilidad = []

        # Estado actual
        self.estado = estado_inicial if estado_inicial is not None else EstadoExtraida()
        
        # Registramos el evento inicial de creación
        evento_inicial = EventoTrazabilidad(
            estado_anterior="Ninguno",
            estado_nuevo=self.estado.nombre,
            motivo="Toma de muestra biológica registrada en clínica"
        )
        self.historial_trazabilidad.append(evento_inicial)

    def cambiar_estado(self, nuevo_estado, motivo=""):
        """Agrega el nuevo evento al final de la fila y actualiza el estado."""
        evento = EventoTrazabilidad(
            estado_anterior=self.estado.nombre,
            estado_nuevo=nuevo_estado.nombre,
            motivo=motivo
        )
        self.historial_trazabilidad.append(evento)
        self.estado = nuevo_estado

    # Métodos para consultar la fila de trazabilidad
    def obtener_ultimo_evento(self):
        """Devuelve el evento más reciente (la cola de la fila)."""
        if self.historial_trazabilidad:
            return self.historial_trazabilidad[-1]
        return None

    def obtener_evento_por_posicion(self, indice):
        """Permite consultar cualquier evento específico según su posición en la fila."""
        if 0 <= indice < len(self.historial_trazabilidad):
            return self.historial_trazabilidad[indice]
        return None

    def obtener_trazabilidad_completa(self):
        """Devuelve toda la fila de eventos convertida en lista de diccionarios."""
        return [evento.a_diccionario() for evento in self.historial_trazabilidad]

    # Operaciones delegadas al estado vigente
    def empaquetar(self, id_conservadora, nro_precinto):
        self.estado.empaquetar(self, id_conservadora, nro_precinto)

    def despachar(self, transporte_info):
        self.estado.despachar(self, transporte_info)

    def recibir_en_laboratorio(self, precinto_intacto, observaciones=""):
        self.estado.recibir_en_laboratorio(self, precinto_intacto, observaciones)

    def registrar_analisis(self, resultado_id):
        self.estado.registrar_analisis(self, resultado_id)