from datetime import date

from app.persistencia.base_dao import BaseDAO


class ReportesDAO(BaseDAO):
    """Consultas de solo lectura para los reportes.

    No usa TABLA / PK / COLUMNAS_EDITABLES porque no hace altas ni bajas.
    """

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _iso(valor: date | str | None) -> str | None:
        if valor is None:
            return None
        return valor.isoformat() if isinstance(valor, date) else valor

    def _consultar(self, sql: str, params: list | tuple = ()) -> list[dict]:
        cursor = self.db.get_conexion().execute(sql, params)
        return [dict(fila) for fila in cursor.fetchall()]

    # ------------------------------------------------------------------
    # 1. GET /resumen-general
    # ------------------------------------------------------------------
    def resumen_general(self) -> dict:
        sql = """
            SELECT
                (SELECT COUNT(*) FROM clientes WHERE activo = 1)      AS clientes_activos,
                (SELECT COUNT(*) FROM clientes WHERE activo = 0)      AS clientes_baja_logica,
                (SELECT COUNT(*) FROM mascotas WHERE activo = 1)      AS mascotas_activas,
                (SELECT COUNT(*) FROM mascotas WHERE activo = 0)      AS mascotas_baja_logica,
                (SELECT COUNT(*) FROM clinicas WHERE activa = 1)      AS clinicas_activas,
                (SELECT COUNT(*) FROM veterinarios)                   AS total_veterinarios,
                (SELECT COUNT(*) FROM consultas)                      AS total_consultas,
                (SELECT COUNT(*) FROM consultas
                  WHERE date(fecha_hora) = date('now', 'localtime'))  AS consultas_hoy,
                (SELECT COUNT(*) FROM ordenes_derivacion)             AS total_derivaciones,
                (SELECT COUNT(*) FROM muestras)                       AS total_muestras,
                (SELECT COUNT(*) FROM remitos_biologicos
                  WHERE estado = 'en_transito')                       AS remitos_en_transito
        """
        return self._consultar(sql)[0]

    # ------------------------------------------------------------------
    # 2. GET /calidad-muestras
    # ------------------------------------------------------------------
    def rechazo_muestras(self) -> list[dict]:
        sql = """
            SELECT
                l.id_laboratorio,
                l.nombre AS laboratorio,
                COUNT(*) AS total_muestras,
                SUM(CASE WHEN mu.estado_actual = 'analizada' THEN 1 ELSE 0 END) AS analizadas,
                SUM(CASE WHEN mu.estado_actual = 'rechazada' THEN 1 ELSE 0 END) AS rechazadas,
                SUM(CASE WHEN mu.estado_actual NOT IN ('analizada', 'rechazada') THEN 1 ELSE 0 END) AS en_proceso,
                ROUND(100.0 * SUM(CASE WHEN mu.estado_actual = 'rechazada' THEN 1 ELSE 0 END)
                      / COUNT(*), 2) AS porcentaje_rechazo
            FROM muestras mu
            JOIN ordenes_derivacion od ON od.id_orden_derivacion = mu.orden_derivacion_id
            JOIN laboratorios l        ON l.id_laboratorio = od.id_laboratorio
            GROUP BY l.id_laboratorio, l.nombre
            ORDER BY porcentaje_rechazo DESC
        """
        return self._consultar(sql)

    # ------------------------------------------------------------------
    # 3. GET /derivaciones-tipo
    # ------------------------------------------------------------------
    def derivaciones_por_tipo(self) -> list[dict]:
        sql = """
            SELECT
                t.id_tipo_analisis,
                t.nombre AS tipo_analisis,
                t.tipo_muestra,
                COUNT(od.id_orden_derivacion) AS total_derivaciones
            FROM ordenes_derivacion od
            JOIN tipo_analisis t ON t.id_tipo_analisis = od.tipo_analisis_id
            GROUP BY t.id_tipo_analisis, t.nombre, t.tipo_muestra
            ORDER BY total_derivaciones DESC
        """
        return self._consultar(sql)

    # ------------------------------------------------------------------
    # 4. GET /alertas-vacunas
    # ------------------------------------------------------------------
    def alertas_vacunacion(self, dias: int = 30) -> list[dict]:
        sql = """
            SELECT *,
                   CASE WHEN date(proxima_dosis) < date('now', 'localtime')
                        THEN 'vencida' ELSE 'por_vencer' END AS estado_alerta
            FROM (
                SELECT
                    m.id_mascota,
                    m.nombre  AS mascota,
                    m.especie,
                    cl.id_cliente,
                    cl.nombre || ' ' || cl.apellido AS cliente,
                    cl.telefono,
                    vc.id_vacuna,
                    vc.nombre AS vacuna,
                    MAX(va.fecha_aplicacion) AS ultima_aplicacion,
                    COALESCE(
                        va.proxima_dosis,
                        date(va.fecha_aplicacion, '+' || ev.intervalo_refuerzo_dias || ' days')
                    ) AS proxima_dosis
                FROM vacunas_aplicadas va
                JOIN consultas c          ON c.id_consulta = va.id_consulta
                JOIN historias_clinicas h ON h.id_historia_clinica = c.historia_clinica_id
                JOIN mascotas m           ON m.id_mascota = h.id_mascota
                JOIN clientes cl          ON cl.id_cliente = m.id_cliente
                JOIN vacunas vc           ON vc.id_vacuna = va.id_vacuna
                LEFT JOIN esquema_vacunal ev
                       ON ev.id_vacuna = va.id_vacuna
                      AND LOWER(ev.especie) = LOWER(m.especie)
                WHERE m.activo = 1
                GROUP BY m.id_mascota, va.id_vacuna
            )
            WHERE proxima_dosis IS NOT NULL
              AND date(proxima_dosis) <= date('now', 'localtime', ?)
            ORDER BY proxima_dosis ASC
        """
        return self._consultar(sql, [f"+{int(dias)} days"])

    # ------------------------------------------------------------------
    # 5. GET /atenciones  (consulta variable con filtros dinámicos)
    # ------------------------------------------------------------------
    def atenciones_dinamico(
        self,
        fecha_desde: date | str | None = None,
        fecha_hasta: date | str | None = None,
        veterinarios_ids: list[int] | None = None,
        clinica_id: int | None = None,
        especie: str | None = None,
    ) -> dict:
        condiciones: list[str] = []
        params: list = []

        if fecha_desde:
            condiciones.append("date(c.fecha_hora) >= date(?)")
            params.append(self._iso(fecha_desde))
        if fecha_hasta:
            condiciones.append("date(c.fecha_hora) <= date(?)")
            params.append(self._iso(fecha_hasta))
        if veterinarios_ids:
            placeholders = ",".join("?" * len(veterinarios_ids))
            condiciones.append(f"c.veterinario_id IN ({placeholders})")
            params.extend(veterinarios_ids)
        if clinica_id is not None:
            condiciones.append("c.clinica_id = ?")
            params.append(clinica_id)
        if especie:
            condiciones.append("LOWER(m.especie) = LOWER(?)")
            params.append(especie)

        where = ("WHERE " + " AND ".join(condiciones)) if condiciones else ""

        desde = """
            FROM consultas c
            JOIN historias_clinicas h ON h.id_historia_clinica = c.historia_clinica_id
            JOIN mascotas m           ON m.id_mascota = h.id_mascota
            JOIN clientes cli         ON cli.id_cliente = m.id_cliente
            JOIN veterinarios v       ON v.id_veterinario = c.veterinario_id
            JOIN clinicas cl          ON cl.id_clinica = c.clinica_id
        """

        totales = self._consultar(
            f"""
            SELECT COUNT(*)                     AS total_atenciones,
                   COUNT(DISTINCT m.id_mascota) AS mascotas_distintas
            {desde} {where}
            """,
            params,
        )[0]

        por_veterinario = self._consultar(
            f"""
            SELECT v.id_veterinario,
                   v.nombre || ' ' || v.apellido AS veterinario,
                   v.matricula,
                   COUNT(*)                       AS atenciones,
                   COUNT(DISTINCT m.id_mascota)   AS mascotas_distintas
            {desde} {where}
            GROUP BY v.id_veterinario, v.nombre, v.apellido, v.matricula
            ORDER BY atenciones DESC
            """,
            params,
        )

        detalle_atenciones = self._consultar(
            f"""
            SELECT c.id_consulta,
                   c.fecha_hora,
                   c.tipo AS tipo_atencion,
                   c.motivo,
                   COALESCE(c.diagnostico, 'Sin diagnóstico') AS diagnostico,
                   m.id_mascota,
                   m.nombre AS mascota,
                   m.especie,
                   cli.nombre || ' ' || cli.apellido AS duenio,
                   v.id_veterinario,
                   v.nombre || ' ' || v.apellido AS veterinario,
                   cl.nombre AS clinica
            {desde} {where}
            ORDER BY c.fecha_hora DESC
            """,
            params,
        )

        return {
            "total_atenciones": totales["total_atenciones"],
            "mascotas_distintas": totales["mascotas_distintas"],
            "por_veterinario": por_veterinario,
            "detalle_atenciones": detalle_atenciones,
            "filtros_aplicados": {
                "fecha_desde": self._iso(fecha_desde),
                "fecha_hasta": self._iso(fecha_hasta),
                "veterinarios_ids": veterinarios_ids,
                "clinica_id": clinica_id,
                "especie": especie,
            },
        }

    # ------------------------------------------------------------------
    # 6. GET /productividad-veterinarios
    # ------------------------------------------------------------------
    def productividad_veterinarios(self) -> list[dict]:
        sql = """
            SELECT
                v.id_veterinario,
                v.nombre || ' ' || v.apellido AS veterinario,
                v.matricula,
                cl.nombre AS clinica,
                COUNT(DISTINCT c.id_consulta)          AS total_consultas,
                COUNT(DISTINCT h.id_mascota)           AS mascotas_unicas_atendidas,
                COUNT(DISTINCT o.id_orden_derivacion)  AS ordenes_derivadas
            FROM veterinarios v
            LEFT JOIN clinicas cl          ON v.clinica_id = cl.id_clinica
            LEFT JOIN consultas c          ON c.veterinario_id = v.id_veterinario
            LEFT JOIN historias_clinicas h ON c.historia_clinica_id = h.id_historia_clinica
            LEFT JOIN ordenes_derivacion o ON o.id_consulta = c.id_consulta
            GROUP BY v.id_veterinario, v.nombre, v.apellido, v.matricula, cl.nombre
            ORDER BY total_consultas DESC
        """
        return self._consultar(sql)

    # ------------------------------------------------------------------
    # 7. GET /turnos
    # ------------------------------------------------------------------
    def estado_turnos(self) -> dict:
        resumen = self._consultar(
            """
            SELECT estado, COUNT(*) AS cantidad
            FROM turnos
            GROUP BY estado
            """
        )

        detalle = self._consultar(
            """
            SELECT
                t.id_turno,
                t.fecha_hora,
                t.estado,
                t.motivo,
                m.nombre AS mascota,
                COALESCE(v.nombre || ' ' || v.apellido, 'Sin asignar (Guardia)') AS veterinario,
                cl.nombre AS clinica
            FROM turnos t
            JOIN mascotas m          ON t.mascota_id = m.id_mascota
            LEFT JOIN veterinarios v ON t.veterinario_id = v.id_veterinario
            JOIN clinicas cl         ON t.clinica_id = cl.id_clinica
            ORDER BY t.fecha_hora DESC
            """
        )

        return {
            "resumen_estados": resumen,
            "detalle_turnos": detalle,
        }

    # ------------------------------------------------------------------
    # 8. GET /demografia-mascotas
    # ------------------------------------------------------------------
    def demografia_mascotas(self) -> dict:
        por_especie = self._consultar(
            """
            SELECT
                LOWER(especie) AS especie,
                COUNT(*) AS total,
                SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS activas,
                SUM(CASE WHEN activo = 0 THEN 1 ELSE 0 END) AS bajas_logicas
            FROM mascotas
            GROUP BY LOWER(especie)
            ORDER BY total DESC
            """
        )

        listado = self._consultar(
            """
            SELECT
                m.id_mascota,
                m.nombre AS mascota,
                m.especie,
                COALESCE(m.raza, 'Mestizo') AS raza,
                m.sexo,
                cli.nombre || ' ' || cli.apellido AS responsable,
                CASE WHEN m.activo = 1 THEN 'Activo' ELSE 'Baja lógica' END AS estado
            FROM mascotas m
            JOIN clientes cli ON m.id_cliente = cli.id_cliente
            ORDER BY m.id_mascota DESC
            """
        )

        return {
            "distribucion_especies": por_especie,
            "padron_mascotas": listado,
        }


reportes_dao = ReportesDAO()