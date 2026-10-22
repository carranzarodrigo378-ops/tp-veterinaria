from app.dominio.modelos import MuestraBiologica
from app.dominio.estados import ExcepcionTransicionEstado


class MuestrasServicio:
    def __init__(self, repositorio_muestras=None):
        # Cuando tu compañero tenga la persistencia lista, se inyecta su repositorio.
        # Por ahora mantenemos un almacenamiento en memoria temporal.
        self.repositorio = repositorio_muestras
        self._almacen = {}
        self._contador_id = 1

    def registrar_muestra(self, codigo_etiqueta, id_orden_derivacion, tipo_muestra):
        muestra = MuestraBiologica(
            id_muestra=self._contador_id,
            codigo_etiqueta=codigo_etiqueta,
            id_orden_derivacion=id_orden_derivacion,
            tipo_muestra=tipo_muestra
        )
        self._almacen[self._contador_id] = muestra
        self._contador_id += 1
        return muestra

    def empaquetar_muestra(self, id_muestra, id_conservadora, nro_precinto):
        muestra = self._obtener_o_fallar(id_muestra)
        muestra.empaquetar(id_conservadora=id_conservadora, nro_precinto=nro_precinto)
        return muestra

    def despachar_muestra(self, id_muestra, transporte_info):
        muestra = self._obtener_o_fallar(id_muestra)
        muestra.despachar(transporte_info=transporte_info)
        return muestra

    def recibir_muestra_en_laboratorio(self, id_muestra, precinto_intacto, observaciones=""):
        muestra = self._obtener_o_fallar(id_muestra)
        # La regla de negocio de precinto roto la resuelve el patrón State internamente
        muestra.recibir_en_laboratorio(precinto_intacto=precinto_intacto, observaciones=observaciones)
        return muestra

    def registrar_analisis(self, id_muestra, resultado_id):
        muestra = self._obtener_o_fallar(id_muestra)
        muestra.registrar_analisis(resultado_id=resultado_id)
        return muestra

    def obtener_por_id(self, id_muestra):
        return self._obtener_o_fallar(id_muestra)

    def _obtener_o_fallar(self, id_muestra):
        muestra = self._almacen.get(id_muestra)
        if not muestra:
            raise ValueError(f"No se encontró la muestra con ID {id_muestra}")
        return muestra


# Instancia única para usar en los endpoints
servicio_muestras = MuestrasServicio()