from app.dominio.modelos import MuestraBiologica
from app.dominio.estados import ExcepcionTransicionEstado
from app.esquemas.enums import TipoMuestra


class ServicioMuestras:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio
        self._almacen_muestras: dict[int, MuestraBiologica] = {}
        self._contador_id = 1

    def _mapear_a_respuesta(self, muestra: MuestraBiologica) -> dict:
        return {
            "id_muestra": muestra.id_muestra,
            "codigo_etiqueta": muestra.codigo_etiqueta,
            "id_orden_derivacion": muestra.id_orden_derivacion,
            "tipo_muestra": muestra.tipo_muestra,
            "estado_actual": muestra.estado.nombre,
            "id_conservadora": muestra.id_conservadora,
            "nro_precinto": muestra.nro_precinto,
            "transporte_info": muestra.transporte_info,
            "id_resultado": muestra.id_resultado,
            "historial_trazabilidad": muestra.obtener_trazabilidad_completa(),
        }

    def registrar_extraccion(self, datos_crear) -> dict:
        # Acepta tanto dict como el esquema MuestraCrear de Pydantic
        datos = datos_crear if isinstance(datos_crear, dict) else datos_crear.model_dump()
        
        tipo_str = str(datos.get("tipo_muestra", "")).lower()
        valores_permitidos = [e.value for e in TipoMuestra]
        if tipo_str not in valores_permitidos:
            raise ValueError(
                f"Tipo de muestra inválido '{tipo_str}'. Opciones válidas: {valores_permitidos}"
            )

        nueva_muestra = MuestraBiologica(
            id_muestra=self._contador_id,
            codigo_etiqueta=datos["codigo_etiqueta"],
            id_orden_derivacion=datos["id_orden_derivacion"],
            tipo_muestra=tipo_str
        )
        self._almacen_muestras[self._contador_id] = nueva_muestra
        self._contador_id += 1
        return self._mapear_a_respuesta(nueva_muestra)

    def empaquetar(self, id_muestra: int, datos_empaquetar) -> dict:
        datos = datos_empaquetar if isinstance(datos_empaquetar, dict) else datos_empaquetar.model_dump()
        muestra = self._obtener_entidad(id_muestra)
        muestra.empaquetar(
            id_conservadora=datos["id_conservadora"],
            nro_precinto=datos["nro_precinto"]
        )
        return self._mapear_a_respuesta(muestra)

    def despachar(self, id_muestra: int, datos_despacho) -> dict:
        datos = datos_despacho if isinstance(datos_despacho, dict) else datos_despacho.model_dump()
        muestra = self._obtener_entidad(id_muestra)
        muestra.despachar(transporte_info=datos["transporte_info"])
        return self._mapear_a_respuesta(muestra)

    def recibir_en_laboratorio(self, id_muestra: int, datos_recepcion) -> dict:
        datos = datos_recepcion if isinstance(datos_recepcion, dict) else datos_recepcion.model_dump()
        muestra = self._obtener_entidad(id_muestra)
        muestra.recibir_en_laboratorio(
            precinto_intacto=datos["precinto_intacto"],
            observaciones=datos.get("observaciones", "")
        )
        return self._mapear_a_respuesta(muestra)

    def registrar_analisis(self, id_muestra: int, datos_analisis) -> dict:
        datos = datos_analisis if isinstance(datos_analisis, dict) else datos_analisis.model_dump()
        muestra = self._obtener_entidad(id_muestra)
        muestra.registrar_analisis(resultado_id=datos["resultado_id"])
        return self._mapear_a_respuesta(muestra)

    def obtener_por_id(self, id_muestra: int) -> dict:
        muestra = self._obtener_entidad(id_muestra)
        return self._mapear_a_respuesta(muestra)

    def listar_todas(self) -> list[dict]:
        return [self._mapear_a_respuesta(m) for m in self._almacen_muestras.values()]

    def _obtener_entidad(self, id_muestra: int) -> MuestraBiologica:
        if id_muestra not in self._almacen_muestras:
            raise KeyError(f"No existe la muestra con ID {id_muestra}")
        return self._almacen_muestras[id_muestra]


servicio_muestras = ServicioMuestras()