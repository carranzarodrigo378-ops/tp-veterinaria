from abc import ABC, abstractmethod


class ExcepcionTransicionEstado(Exception):
    """Excepción para transiciones no válidas según las reglas del negocio."""
    pass


# Interfaz base del Patrón State
class EstadoMuestra(ABC):
    @property
    @abstractmethod
    def nombre(self):
        """Nombre descriptivo del estado actual."""
        pass

    def empaquetar(self, muestra, id_conservadora, nro_precinto):
        raise ExcepcionTransicionEstado(f"No se puede empaquetar una muestra en estado '{self.nombre}'.")

    def despachar(self, muestra, transporte_info):
        raise ExcepcionTransicionEstado(f"No se puede despachar una muestra en estado '{self.nombre}'.")

    def recibir_en_laboratorio(self, muestra, precinto_intacto, observaciones=""):
        raise ExcepcionTransicionEstado(f"No se puede recibir en laboratorio una muestra en estado '{self.nombre}'.")

    def registrar_analisis(self, muestra, resultado_id):
        raise ExcepcionTransicionEstado(f"No se puede registrar análisis de una muestra en estado '{self.nombre}'.")


# Estados Concretos

class EstadoExtraida(EstadoMuestra):
    @property
    def nombre(self):
        return "Extraída"

    def empaquetar(self, muestra, id_conservadora, nro_precinto):
        muestra.id_conservadora = id_conservadora
        muestra.nro_precinto = nro_precinto
        muestra.cambiar_estado(EstadoEmpaquetada(), motivo=f"Empaquetada en conservadora {id_conservadora} con precinto {nro_precinto}")


class EstadoEmpaquetada(EstadoMuestra):
    @property
    def nombre(self):
        return "Empaquetada"

    def despachar(self, muestra, transporte_info):
        muestra.transporte_info = transporte_info
        muestra.cambiar_estado(EstadoEnTransito(), motivo=f"Despachada hacia laboratorio central via {transporte_info}")


class EstadoEnTransito(EstadoMuestra):
    @property
    def nombre(self):
        return "En tránsito"

    def recibir_en_laboratorio(self, muestra, precinto_intacto, observaciones=""):
        # Validación obligatoria: si el precinto llega roto, la muestra se rechaza
        if not precinto_intacto:
            detalle = f"RECHAZADA: Precinto violado o roto. {observaciones}".strip()
            muestra.cambiar_estado(EstadoRechazada(), motivo=detalle)
        else:
            detalle = f"Recepción conforme. Precinto íntegro. {observaciones}".strip()
            muestra.cambiar_estado(EstadoRecibida(), motivo=detalle)


class EstadoRecibida(EstadoMuestra):
    @property
    def nombre(self):
        return "Recibida"

    def registrar_analisis(self, muestra, resultado_id):
        muestra.id_resultado = resultado_id
        muestra.cambiar_estado(EstadoAnalizada(), motivo=f"Análisis completado con ID de resultado: {resultado_id}")


class EstadoAnalizada(EstadoMuestra):
    @property
    def nombre(self):
        return "Analizada"


class EstadoRechazada(EstadoMuestra):
    @property
    def nombre(self):
        return "Rechazada"