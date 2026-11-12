from datetime import datetime
from app.dominio.modelos import MuestraBiologica
from app.dominio.estados import ExcepcionTransicionEstado
from app.esquemas.enums import TipoMuestra
from app.persistencia.muestra_dao import MuestraDAO
from app.persistencia.historialMuestra_dao import HistorialMuestraDAO
from app.persistencia.conexion import DatabaseSingleton


class ServicioMuestras:
    def __init__(
        self,
        muestra_dao: MuestraDAO = None,
        historial_dao: HistorialMuestraDAO = None,
    ):
        self.muestra_dao = muestra_dao or MuestraDAO()
        self.historial_dao = historial_dao or HistorialMuestraDAO()
        self.db = DatabaseSingleton()

    def _asegurar_contenedor_por_defecto(self, conn, id_contenedor: int = 1) -> int:
        """
        Garantiza que exista al menos un contenedor isotérmico en la tabla 'contenedores'
        para cumplir la Foreign Key de remitos_biologicos.
        """
        fila = conn.execute(
            "SELECT id_contenedor FROM contenedores WHERE id_contenedor = ?",
            (id_contenedor,),
        ).fetchone()
        if fila:
            return fila["id_contenedor"]

        primera = conn.execute(
            "SELECT id_contenedor FROM contenedores LIMIT 1"
        ).fetchone()
        if primera:
            return primera["id_contenedor"]

        cursor = conn.execute(
            """
            INSERT INTO contenedores (codigo, capacidad_muestras, temperatura_objetivo_c, estado)
            VALUES ('CONT-ISO-01', 20, 4.0, 'disponible')
            """
        )
        conn.commit()
        return cursor.lastrowid

    def _mapear_a_respuesta(self, muestra: dict) -> dict:
        conn = self.db.get_conexion()

        # 1. Historial de estados inmutable
        cursor_hist = conn.execute(
            """
            SELECT id_historial_estado_muestra, estado, fecha_hora, usuario, observaciones
            FROM historial_estado_muestras
            WHERE muestra_id = ?
            ORDER BY id_historial_estado_muestra ASC
            """,
            (muestra["id_muestra"],),
        )
        filas_hist = cursor_hist.fetchall()

        trazabilidad = [
            f"[{f['fecha_hora']}] Estado: {f['estado']} | Usuario: {f['usuario'] or 'Sistema'}"
            + (f" | Obs: {f['observaciones']}" if f["observaciones"] else "")
            for f in filas_hist
        ]

        # 2. Datos cruzados con remitos_biologicos, precintos y resultados_analisis
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
            (muestra["id_muestra"],),
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

    # ------------------------------------------------------------------
    # Proceso 3/4: Extracción inicial de muestra biológica
    # ------------------------------------------------------------------
    def registrar_extraccion(
        self, datos_crear, usuario: str | None = None
    ) -> dict:
        datos = (
            datos_crear
            if isinstance(datos_crear, dict)
            else datos_crear.model_dump()
        )
        tipo_raw = datos.get("tipo") or "sangre"
        tipo_str = getattr(tipo_raw, "value", str(tipo_raw)).lower()
        usuario_registro = usuario or datos.get("usuario") or "Veterinario"

        conn = self.db.get_conexion()

        orden = conn.execute(
            "SELECT id_orden_derivacion FROM ordenes_derivacion WHERE id_orden_derivacion = ?",
            (datos["orden_derivacion_id"],),
        ).fetchone()
        if not orden:
            raise ValueError(
                f"No existe la orden de derivación con ID {datos['orden_derivacion_id']}"
            )

        cursor = conn.execute(
            """
            INSERT INTO muestras (orden_derivacion_id, codigo, tipo, fecha_extraccion, estado_actual)
            VALUES (?, ?, ?, datetime('now', 'localtime'), 'extraida')
            """,
            (datos["orden_derivacion_id"], datos["codigo"], tipo_str),
        )
        conn.commit()
        id_muestra = cursor.lastrowid

        conn.execute(
            """
            INSERT INTO historial_estado_muestras (muestra_id, estado, fecha_hora, usuario, observaciones)
            VALUES (?, 'extraida', datetime('now', 'localtime'), ?, 'Extracción inicial de muestra biológica')
            """,
            (id_muestra, usuario_registro),
        )
        conn.commit()

        return self.obtener_por_id(id_muestra)

    # ------------------------------------------------------------------
    # Proceso 4: Empaquetar en contenedor generando Remito y Precinto
    # ------------------------------------------------------------------
    def empaquetar(
        self, id_muestra: int, datos_empaquetar=None, usuario: str | None = None
    ) -> dict:
        datos = (
            datos_empaquetar
            if isinstance(datos_empaquetar, dict)
            else (datos_empaquetar.model_dump() if datos_empaquetar else {})
        )
        usuario_registro = usuario or datos.get("usuario") or "Veterinario"

        # 1. Cambiar estado ('extraida' -> 'empaquetada')
        self.muestra_dao.cambiar_estado(
            id_muestra, nuevo_estado="empaquetada", usuario=usuario_registro
        )

        conn = self.db.get_conexion()
        muestra = self.muestra_dao.obtener_por_id(id_muestra)

        # 2. Crear Precinto + Contenedor + Remito Biológico según schema.sql
        remito_id = datos.get("remito_id") or muestra.get("remito_id")
        if not remito_id:
            ts = datetime.now().strftime("%Y%m%d%H%M%S")
            codigo_precinto = (
                datos.get("codigo_precinto")
                or datos.get("nro_precinto")
                or f"PREC-{id_muestra:04d}-{ts[-4:]}"
            )
            numero_remito = (
                datos.get("numero_remito")
                or datos.get("nro_remito")
                or f"REM-{id_muestra:04d}-{ts[-4:]}"
            )

            info_orden = conn.execute(
                """
                SELECT c.clinica_id, od.id_laboratorio
                FROM muestras m
                JOIN ordenes_derivacion od ON od.id_orden_derivacion = m.orden_derivacion_id
                JOIN consultas c ON c.id_consulta = od.id_consulta
                WHERE m.id_muestra = ?
                """,
                (id_muestra,),
            ).fetchone()

            clinica_origen_id = info_orden["clinica_id"] if info_orden else 1
            laboratorio_id = info_orden["id_laboratorio"] if info_orden else 1
            contenedor_id = self._asegurar_contenedor_por_defecto(
                conn, int(datos.get("contenedor_id") or datos.get("conservadora_id") or 1)
            )

            # Insertar Precinto Sanitario intacto
            cur_prec = conn.execute(
                """
                INSERT INTO precintos (codigo, estado, fecha_colocacion)
                VALUES (?, 'intacto', datetime('now', 'localtime'))
                """,
                (codigo_precinto,),
            )
            precinto_id = cur_prec.lastrowid

            # Insertar Remito Biológico (usando contenedor_id y fecha_emision de schema.sql)
            cur_rem = conn.execute(
                """
                INSERT INTO remitos_biologicos (
                    numero_remito, clinica_origen_id, laboratorio_destino_id,
                    contenedor_id, precinto_id, fecha_emision, estado
                )
                VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'), 'precintado')
                """,
                (
                    numero_remito,
                    clinica_origen_id,
                    laboratorio_id,
                    contenedor_id,
                    precinto_id,
                ),
            )
            remito_id = cur_rem.lastrowid

            # Marcar contenedor como en_uso
            conn.execute(
                "UPDATE contenedores SET estado = 'en_uso' WHERE id_contenedor = ?",
                (contenedor_id,),
            )

        conn.execute(
            "UPDATE muestras SET remito_id = ? WHERE id_muestra = ?",
            (remito_id, id_muestra),
        )
        conn.commit()

        return self.obtener_por_id(id_muestra)

    # ------------------------------------------------------------------
    # Proceso 5: Registrar cadena de envío hacia el laboratorio central
    # ------------------------------------------------------------------
    def despachar(
        self, id_muestra: int, datos_despacho=None, usuario: str | None = None
    ) -> dict:
        datos = (
            datos_despacho
            if isinstance(datos_despacho, dict)
            else (datos_despacho.model_dump() if datos_despacho else {})
        )
        responsable = (
            datos.get("responsable_transporte")
            or usuario
            or "Transportista"
        )

        # 1. Cambiar estado ('empaquetada' -> 'en_transito')
        self.muestra_dao.cambiar_estado(
            id_muestra, nuevo_estado="en_transito", usuario=responsable
        )

        # 2. Actualizar remito a 'en_transito' y registrar en 'eventos_envio'
        conn = self.db.get_conexion()
        muestra = self.muestra_dao.obtener_por_id(id_muestra)
        if muestra and muestra.get("remito_id"):
            conn.execute(
                """
                UPDATE remitos_biologicos
                SET estado = 'en_transito'
                WHERE id_remito_biologico = ?
                """,
                (muestra["remito_id"],),
            )
            conn.execute(
                """
                INSERT INTO eventos_envio (remito_biologico_id, tipo, fecha_hora, responsable, observaciones)
                VALUES (?, 'despachado', datetime('now', 'localtime'), ?, 'Despacho hacia Laboratorio Central')
                """,
                (muestra["remito_id"], responsable),
            )
            conn.commit()

        return self.obtener_por_id(id_muestra)

    # ------------------------------------------------------------------
    # Proceso 6 y Validación 2: Recepción verificando estado del precinto
    # ------------------------------------------------------------------
    def recibir_en_laboratorio(
        self, id_muestra: int, datos_recepcion, usuario: str | None = None
    ) -> dict:
        datos = (
            datos_recepcion
            if isinstance(datos_recepcion, dict)
            else datos_recepcion.model_dump()
        )
        estado_precinto = str(
            getattr(datos["estado_precinto"], "value", datos["estado_precinto"])
        ).lower()
        if estado_precinto not in ("intacto", "roto"):
            estado_precinto = "roto"

        recibido_por = datos.get("recibido_por") or usuario or "Laboratorio Central"
        temperatura = datos.get("temperatura_recepcion_c") or 4.0

        # 1. MuestraDAO verifica el precinto: si está 'roto', pasa la muestra a 'rechazada'
        self.muestra_dao.cambiar_estado(
            id_muestra,
            nuevo_estado="recibida",
            estado_precinto=estado_precinto,
            usuario=recibido_por,
        )

        # 2. Actualizar remitos_biologicos, precintos y recepciones_lab
        conn = self.db.get_conexion()
        muestra = self.muestra_dao.obtener_por_id(id_muestra)
        if muestra and muestra.get("remito_id"):
            remito = conn.execute(
                "SELECT precinto_id, contenedor_id FROM remitos_biologicos WHERE id_remito_biologico = ?",
                (muestra["remito_id"],),
            ).fetchone()

            estado_remito = "rechazado" if estado_precinto == "roto" else "recibido"
            conn.execute(
                "UPDATE remitos_biologicos SET estado = ? WHERE id_remito_biologico = ?",
                (estado_remito, muestra["remito_id"]),
            )

            if remito and remito["precinto_id"]:
                conn.execute(
                    "UPDATE precintos SET estado = ? WHERE id_precinto = ?",
                    (estado_precinto, remito["precinto_id"]),
                )

            if remito and remito["contenedor_id"]:
                conn.execute(
                    "UPDATE contenedores SET estado = 'disponible' WHERE id_contenedor = ?",
                    (remito["contenedor_id"],),
                )

            # Registrar la recepción en recepciones_lab (IGNORE por si el remito tenía varias muestras)
            conn.execute(
                """
                INSERT OR REPLACE INTO recepciones_lab (
                    remito_biologico_id, fecha_hora, recibido_por,
                    estado_precinto, temperatura_recepcion_c, observaciones
                )
                VALUES (?, datetime('now', 'localtime'), ?, ?, ?, ?)
                """,
                (
                    muestra["remito_id"],
                    recibido_por,
                    estado_precinto,
                    temperatura,
                    datos.get("observaciones") or f"Precinto verificado: {estado_precinto}",
                ),
            )
            conn.commit()

        return self.obtener_por_id(id_muestra)

    # ------------------------------------------------------------------
    # Proceso 7: Registrar resultados de análisis clínicos
    # ------------------------------------------------------------------
    def registrar_analisis(
        self, id_muestra: int, datos_analisis, usuario: str | None = None
    ) -> dict:
        datos = (
            datos_analisis
            if isinstance(datos_analisis, dict)
            else datos_analisis.model_dump()
        )
        validado_por = datos.get("validado_por") or usuario or "Laboratorio Central"

        self.muestra_dao.cambiar_estado(
            id_muestra,
            nuevo_estado="analizada",
            usuario=validado_por,
        )

        conn = self.db.get_conexion()
        conn.execute(
            """
            INSERT OR REPLACE INTO resultados_analisis (muestra_id, fecha_resultado, resultado, validado_por)
            VALUES (?, datetime('now', 'localtime'), ?, ?)
            """,
            (id_muestra, datos["resultado"], validado_por),
        )
        conn.commit()
        return self.obtener_por_id(id_muestra)

    # ------------------------------------------------------------------
    # Consultas y Trazabilidad Inmutable
    # ------------------------------------------------------------------
    def obtener_por_id(self, id_muestra: int) -> dict:
        muestra = self.muestra_dao.obtener_por_id(id_muestra)
        if not muestra:
            raise KeyError(f"No existe la muestra con ID {id_muestra}")
        return self._mapear_a_respuesta(muestra)

    def listar_todas(self, rol: str | None = None) -> list[dict]:
        muestras = self.muestra_dao.obtener_todos(limite=500)
        mapeadas = [self._mapear_a_respuesta(m) for m in muestras]
        if rol == "laboratorio":
            estados_visibles_lab = {"en_transito", "recibida", "analizada", "rechazada"}
            return [
                m for m in mapeadas if m["estado_actual"] in estados_visibles_lab
            ]
        return mapeadas

    def obtener_trazabilidad_detallada(self, id_muestra: int) -> dict:
        detalle = self.obtener_por_id(id_muestra)
        conn = self.db.get_conexion()
        pasos = conn.execute(
            """
            SELECT
                id_historial_estado_muestra AS id_evento,
                estado,
                fecha_hora,
                COALESCE(usuario, 'Sistema') AS usuario,
                COALESCE(observaciones, '') AS observaciones
            FROM historial_estado_muestras
            WHERE muestra_id = ?
            ORDER BY id_historial_estado_muestra ASC
            """,
            (id_muestra,),
        ).fetchall()

        return {
            "id_muestra": detalle["id_muestra"],
            "codigo": detalle["codigo"],
            "paciente": detalle.get("paciente"),
            "analisis": detalle.get("analisis"),
            "clinica_origen": detalle.get("clinica_origen"),
            "estado_actual": detalle["estado_actual"],
            "nro_remito": detalle.get("nro_remito"),
            "nro_precinto": detalle.get("nro_precinto"),
            "estado_precinto": detalle.get("estado_precinto"),
            "resultado": detalle.get("resultado"),
            "eventos_trazabilidad": [dict(p) for p in pasos],
            "historial_trazabilidad": detalle["historial_trazabilidad"],
        }

    def listar_remitos_biologicos(self) -> list[dict]:
        conn = self.db.get_conexion()
        cursor = conn.execute(
            """
            SELECT
                r.id_remito_biologico,
                r.numero_remito,
                r.estado AS estado_remito,
                r.fecha_emision,
                rl.fecha_hora AS fecha_recepcion,
                rl.recibido_por,
                cl.nombre AS clinica_origen,
                l.nombre AS laboratorio_destino,
                p.codigo AS codigo_precinto,
                p.estado AS estado_precinto,
                c.codigo AS codigo_conservadora,
                COUNT(m.id_muestra) AS cantidad_muestras
            FROM remitos_biologicos r
            LEFT JOIN clinicas cl ON cl.id_clinica = r.clinica_origen_id
            LEFT JOIN laboratorios l ON l.id_laboratorio = r.laboratorio_destino_id
            LEFT JOIN precintos p ON p.id_precinto = r.precinto_id
            LEFT JOIN contenedores c ON c.id_contenedor = r.contenedor_id
            LEFT JOIN recepciones_lab rl ON rl.remito_biologico_id = r.id_remito_biologico
            LEFT JOIN muestras m ON m.remito_id = r.id_remito_biologico
            GROUP BY r.id_remito_biologico
            ORDER BY r.id_remito_biologico DESC
            """
        )
        return [dict(fila) for fila in cursor.fetchall()]


servicio_muestras = ServicioMuestras()