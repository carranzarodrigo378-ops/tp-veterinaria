from app.persistencia.conexion import DatabaseSingleton


class ReportesDAO:
    def __init__(self):
        self.db = DatabaseSingleton()

    def _consultar(self, sql: str, params: tuple = ()) -> list[dict]:
        cursor = self.db.get_conexion().execute(sql, params)
        return [dict(fila) for fila in cursor.fetchall()]

    def obtener_conteos_globales(self) -> dict:
        return self._consultar("""
            SELECT
                (SELECT COUNT(*) FROM clientes)  AS total_clientes,
                (SELECT COUNT(*) FROM mascotas)  AS total_mascotas,
                (SELECT COUNT(*) FROM consultas) AS total_consultas,
                (SELECT COUNT(*) FROM muestras)  AS total_muestras
        """)[0]

    def obtener_derivaciones_agrupadas(self) -> list[dict]:
        return self._consultar("""
            SELECT ta.nombre AS tipo_analisis,
                   COUNT(od.id_orden_derivacion) AS cantidad
            FROM tipo_analisis ta
            LEFT JOIN ordenes_derivacion od
                   ON od.tipo_analisis_id = ta.id_tipo_analisis
            GROUP BY ta.id_tipo_analisis
            ORDER BY cantidad DESC
        """)

    def obtener_metricas_rechazo_muestras(self) -> dict:
        fila = self._consultar("""
            SELECT COUNT(*) AS total_muestras,
                   COALESCE(SUM(estado_actual = 'analizada'), 0) AS analizadas,
                   COALESCE(SUM(estado_actual = 'rechazada'), 0) AS rechazadas,
                   COALESCE(SUM(estado_actual NOT IN ('analizada', 'rechazada')), 0) AS en_proceso
            FROM muestras
        """)[0]
        total = fila["total_muestras"]
        fila["tasa_rechazo_porcentaje"] = (
            round(100 * fila["rechazadas"] / total, 2) if total else 0.0
        )
        return fila

    def obtener_alertas_vacunacion(self) -> list[dict]:
        return self._consultar("""
            SELECT c.id_consulta, c.fecha_hora,
                   m.nombre AS mascota, m.especie,
                   vt.nombre || ' ' || vt.apellido AS veterinario,
                   va.nombre AS vacuna_faltante
            FROM consultas c
            JOIN historias_clinicas h ON h.id_historia_clinica = c.historia_clinica_id
            JOIN mascotas m           ON m.id_mascota = h.id_mascota
            JOIN veterinarios vt      ON vt.id_veterinario = c.veterinario_id
            JOIN esquema_vacunal e    ON LOWER(e.especie) = LOWER(m.especie)
                                     AND e.obligatoria = 1
            JOIN vacunas va           ON va.id_vacuna = e.id_vacuna
            WHERE (m.fecha_nacimiento IS NULL
                   OR (julianday(date(c.fecha_hora)) - julianday(m.fecha_nacimiento)) / 7
                      >= COALESCE(e.edad_minima_semanas, 0))
              AND NOT EXISTS (
                  SELECT 1
                  FROM vacunas_aplicadas a
                  JOIN consultas c2 ON c2.id_consulta = a.id_consulta
                  JOIN historias_clinicas h2
                       ON h2.id_historia_clinica = c2.historia_clinica_id
                  WHERE h2.id_mascota = m.id_mascota
                    AND a.id_vacuna = e.id_vacuna
                    AND date(a.fecha_aplicacion) <= date(c.fecha_hora)
                    AND (a.proxima_dosis IS NULL
                         OR date(a.proxima_dosis) >= date(c.fecha_hora))
              )
            ORDER BY c.fecha_hora DESC
        """)