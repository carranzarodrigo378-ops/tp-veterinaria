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
        conn = self.db.get_conexion()

        # Historial de estados (trazabilidad)
        cursor = conn.execute(
            "SELECT estado, fecha_hora, usuario, observaciones FROM historial_estado_muestras WHERE muestra_id = ? ORDER BY id_historial_estado_muestra ASC",
            (muestra["id_muestra"],)
        )
        trazabilidad = [
            f"[{f['fecha_hora']}] Estado: {f['estado']} | Usuario: {f['usuario'] or 'Sistema'}"
            for f in cursor.fetchall()
        ]

        # Datos de la tarjeta: muestra → orden → consulta → historia → mascota
        cursor = conn.execute(
            """
            SELECT ma.nombre AS paciente,
                   ma.id_cliente AS id_cliente,
                   cli.nombre || ' ' || cli.apellido AS nombre_cliente,
                   ta.nombre AS analisis,
                   cl.nombre AS clinica_origen,
                   r.numero_remito AS nro_remito,
                   p.codigo AS nro_precinto,
                   p.estado AS estado_precinto,
                   ra.resultado AS resultado
            FROM muestras m
            JOIN ordenes_derivacion od ON od.id_orden_derivacion = m.orden_derivacion_id
            JOIN consultas c ON c.id_consulta = od.id_consulta
            JOIN historias_clinicas h ON h.id_historia_clinica = c.historia_clinica_id
            JOIN mascotas ma ON ma.id_mascota = h.id_mascota
            JOIN clientes cli ON cli.id_cliente = ma.id_cliente
            JOIN tipo_analisis ta ON ta.id_tipo_analisis = od.tipo_analisis_id
            JOIN clinicas cl ON cl.id_clinica = c.clinica_id
            LEFT JOIN remitos_biologicos r ON r.id_remito_biologico = m.remito_id
            LEFT JOIN precintos p ON p.id_precinto = r.precinto_id
            LEFT JOIN resultados_analisis ra ON ra.muestra_id = m.id_muestra
            WHERE m.id_muestra = ?
            """,
            (muestra["id_muestra"],)
        )
        fila = cursor.fetchone()
        extra = dict(fila) if fila else {}

        return {
            "id_muestra": muestra["id_muestra"],
            "orden_derivacion_id": muestra["orden_derivacion_id"],
            "remito_id": muestra["remito_id"],
            "codigo": muestra["codigo"],
            "tipo": muestra["tipo"],
            "fecha_extraccion": muestra["fecha_extraccion"],
            "estado_actual": muestra["estado_actual"],
            "historial_trazabilidad": trazabilidad,
            **extra,
        }

    def registrar_extraccion(self, datos_crear) -> dict:
        datos = datos_crear if isinstance(datos_crear, dict) else datos_crear.model_dump()
        tipo_str = str(datos.get("tipo") or "sangre").lower()

        conn = self.db.get_conexion()
        cursor = conn.execute(
            """
            INSERT INTO muestras (orden_derivacion_id, codigo, tipo, fecha_extraccion, estado_actual)
            VALUES (?, ?, ?, datetime('now', 'localtime'), 'extraida')
            """,
            (datos["orden_derivacion_id"], datos["codigo"], tipo_str)
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
        estado_precinto = getattr(datos["estado_precinto"], "value", datos["estado_precinto"])

        # Si el precinto está roto, MuestraDAO pasa el estado automáticamente a rechazada
        self.muestra_dao.cambiar_estado(
            id_muestra,
            nuevo_estado="recibida",
            estado_precinto=estado_precinto,
            usuario=datos.get("recibido_por") or "Bioquímico"
        )
        return self.obtener_por_id(id_muestra)

    def registrar_analisis(self, id_muestra: int, datos_analisis) -> dict:
        datos = datos_analisis if isinstance(datos_analisis, dict) else datos_analisis.model_dump()

        self.muestra_dao.cambiar_estado(
            id_muestra,
            nuevo_estado="analizada",
            usuario=datos.get("validado_por") or "Bioquímico"
        )

        conn = self.db.get_conexion()
        conn.execute(
            """
            INSERT INTO resultados_analisis (muestra_id, fecha_resultado, resultado, validado_por)
            VALUES (?, datetime('now', 'localtime'), ?, ?)
            """,
            (id_muestra, datos["resultado"], datos.get("validado_por")),
        )
        conn.commit()
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