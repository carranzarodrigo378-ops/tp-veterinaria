from datetime import datetime
from app.dominio.modelos import MuestraBiologica
from app.dominio.estados import ExcepcionTransicionEstado
from app.esquemas.enums import TipoMuestra
from app.persistencia.muestra_dao import MuestraDAO
from app.persistencia.historialMuestra_dao import HistorialMuestraDAO
from app.persistencia.conexion import DatabaseSingleton


class ServicioMuestras:
    def __init__(self, muestra_dao: MuestraDAO = None, historial_dao: HistorialMuestraDAO = None):
        self.muestra_dao = muestra_dao or MuestraDAO()
        self.historial_dao = historial_dao or HistorialMuestraDAO()
        self.db = DatabaseSingleton()

    def _mapear_a_respuesta(self, muestra: dict) -> dict:
        cursor = self.db.get_conexion().execute(
            "SELECT estado, fecha_hora, usuario, observaciones FROM historial_estado_muestras WHERE muestra_id = ? ORDER BY id_historial_estado_muestra ASC",
            (muestra["id_muestra"],)
        )
        trazabilidad = [
            f"[{f['fecha_hora']}] Estado: {f['estado']} | Usuario: {f.get('usuario') or 'Sistema'}"
            for f in cursor.fetchall()
        ]

        return {
            "id_muestra": muestra["id_muestra"],
            "codigo_etiqueta": muestra["codigo"],
            "id_orden_derivacion": muestra["orden_derivacion_id"],
            "tipo_muestra": muestra.get("tipo", "sangre"),
            "estado_actual": muestra["estado_actual"],
            "id_conservadora": muestra.get("remito_id"),
            "nro_precinto": None,
            "transporte_info": None,
            "id_resultado": None,
            "historial_trazabilidad": trazabilidad,
        }

    def registrar_extraccion(self, datos_crear) -> dict:
        datos = datos_crear if isinstance(datos_crear, dict) else datos_crear.model_dump()
        tipo_str = str(datos.get("tipo_muestra", "sangre")).lower()

        conn = self.db.get_conexion()
        cursor = conn.execute(
            """
            INSERT INTO muestras (orden_derivacion_id, codigo, tipo, fecha_extraccion, estado_actual)
            VALUES (?, ?, ?, datetime('now', 'localtime'), 'extraida')
            """,
            (datos["id_orden_derivacion"], datos["codigo_etiqueta"], tipo_str)
        )
        conn.commit()
        id_muestra = cursor.lastrowid

        # Insertar registro inicial en historial inmutable
        conn.execute(
            "INSERT INTO historial_estado_muestras (muestra_id, estado, fecha_hora, usuario) VALUES (?, 'extraida', datetime('now', 'localtime'), 'Sistema')",
            (id_muestra,)
        )
        conn.commit()

        return self.obtener_por_id(id_muestra)

    def empaquetar(self, id_muestra: int, datos_empaquetar) -> dict:
        self.muestra_dao.cambiar_estado(id_muestra, nuevo_estado="empaquetada", usuario="Veterinario")
        return self.obtener_por_id(id_muestra)

    def despachar(self, id_muestra: int, datos_despacho) -> dict:
        self.muestra_dao.cambiar_estado(id_muestra, nuevo_estado="en_transito", usuario="Transportista")
        return self.obtener_por_id(id_muestra)

    def recibir_en_laboratorio(self, id_muestra: int, datos_recepcion) -> dict:
        datos = datos_recepcion if isinstance(datos_recepcion, dict) else datos_recepcion.model_dump()
        estado_precinto = "intacto" if datos.get("precinto_intacto", True) else "roto"

        # Si el precinto está roto, MuestraDAO pasa el estado automáticamente a rechazada
        self.muestra_dao.cambiar_estado(
            id_muestra,
            nuevo_estado="recibida",
            estado_precinto=estado_precinto,
            usuario="Bioquímico"
        )
        return self.obtener_por_id(id_muestra)

    def registrar_analisis(self, id_muestra: int, datos_analisis) -> dict:
        self.muestra_dao.cambiar_estado(id_muestra, nuevo_estado="analizada", usuario="Bioquímico")
        return self.obtener_por_id(id_muestra)

    def obtener_por_id(self, id_muestra: int) -> dict:
        muestra = self.muestra_dao.obtener_por_id(id_muestra)
        if not muestra:
            raise KeyError(f"No existe la muestra con ID {id_muestra}")
        return self._mapear_a_respuesta(muestra)

    def listar_todas(self) -> list[dict]:
        muestras = self.muestra_dao.obtener_todos(limite=500)
        return [self._mapear_a_respuesta(m) for m in muestras]


servicio_muestras = ServicioMuestras()