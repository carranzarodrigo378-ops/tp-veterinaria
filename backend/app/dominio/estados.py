from abc import ABC, abstractmethod
from app.esquemas.enums import EstadoMuestra


class ExcepcionTransicionEstado(Exception):
    """Excepción lanzada cuando se intenta una transición no válida según el patrón State."""
    pass


class EstadoMuestraBase(ABC):
    @property
    @abstractmethod
    def nombre(self) -> str:
        """Devuelve el valor exacto del enum EstadoMuestra."""
        pass

    def empaquetar(self, muestra, id_conservadora: str, nro_precinto: str):
        raise ExcepcionTransicionEstado(
            f"Transición no permitida: no se puede empaquetar una muestra en estado '{self.nombre}'."
        )

    def despachar(self, muestra, transporte_info: str):
        raise ExcepcionTransicionEstado(
            f"Transición no permitida: no se puede despachar una muestra en estado '{self.nombre}'."
        )

    def recibir(self, muestra, precinto_intacto: bool, observaciones: str = ""):
        raise ExcepcionTransicionEstado(
            f"Transición no permitida: no se puede recibir una muestra en estado '{self.nombre}'."
        )

    def analizar(self, muestra, resultado_id: str):
        raise ExcepcionTransicionEstado(
            f"Transición no permitida: no se puede registrar análisis en una muestra en estado '{self.nombre}'."
        )


class EstadoExtraida(EstadoMuestraBase):
    @property
    def nombre(self) -> str:
        return EstadoMuestra.extraida.value

    def empaquetar(self, muestra, id_conservadora: str, nro_precinto: str):
        muestra.id_conservadora = id_conservadora
        muestra.nro_precinto = nro_precinto
        motivo = f"Acondicionada en conservadora {id_conservadora} con precinto {nro_precinto}"
        muestra.cambiar_estado(EstadoEmpaquetada(), motivo)


class EstadoEmpaquetada(EstadoMuestraBase):
    @property
    def nombre(self) -> str:
        return EstadoMuestra.empaquetada.value

    def despachar(self, muestra, transporte_info: str):
        muestra.transporte_info = transporte_info
        motivo = f"Despachada hacia el Laboratorio Central. Transporte: {transporte_info}"
        muestra.cambiar_estado(EstadoEnTransito(), motivo)


class EstadoEnTransito(EstadoMuestraBase):
    @property
    def nombre(self) -> str:
        return EstadoMuestra.en_transito.value

    def recibir(self, muestra, precinto_intacto: bool, observaciones: str = ""):
        # Regla de negocio: Si el precinto llega roto, pasa a rechazada directamente
        if precinto_intacto:
            motivo = f"Muestra recibida en laboratorio. Precinto verificado intacto. {observaciones}".strip()
            muestra.cambiar_estado(EstadoRecibida(), motivo)
        else:
            motivo = f"RECHAZADA: Precinto de seguridad roto o violentado. {observaciones}".strip()
            muestra.cambiar_estado(EstadoRechazada(), motivo)


class EstadoRecibida(EstadoMuestraBase):
    @property
    def nombre(self) -> str:
        return EstadoMuestra.recibida.value

    def analizar(self, muestra, resultado_id: str):
        muestra.id_resultado = resultado_id
        motivo = f"Análisis procesado exitosamente. Informe de resultado ID: {resultado_id}"
        muestra.cambiar_estado(EstadoAnalizada(), motivo)


class EstadoAnalizada(EstadoMuestraBase):
    @property
    def nombre(self) -> str:
        return EstadoMuestra.analizada.value
    # Estado final: ciclo de análisis completado


class EstadoRechazada(EstadoMuestraBase):
    @property
    def nombre(self) -> str:
        return EstadoMuestra.rechazada.value
    # Estado final: la muestra descartada no admite más transiciones