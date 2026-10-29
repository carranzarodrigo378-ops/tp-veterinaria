from app.persistencia.conexion import DatabaseSingleton


class ReportesServicio:
    def __init__(self):
        self.db = DatabaseSingleton()

    def reporte_rechazo_muestras(self) -> dict:
        cursor = self.db.get_conexion().execute(
            """
            SELECT 
                COUNT(*) AS total_muestras,
                COUNT(CASE WHEN estado_actual = 'analizada' THEN 1 END) AS analizadas,
                COUNT(CASE WHEN estado_actual = 'rechazada' THEN 1 END) AS rechazadas,
                COUNT(CASE WHEN estado_actual NOT IN ('analizada', 'rechazada') THEN 1 END) AS en_proceso,
                ROUND((COUNT(CASE WHEN estado_actual = 'rechazada' THEN 1.0 END) / MAX(COUNT(*), 1)) * 100, 2) AS tasa_rechazo_porcentaje
            FROM muestras;
            """
        )
        fila = cursor.fetchone()
        return dict(fila) if fila else {
            "total_muestras": 0, "analizadas": 0, "rechazadas": 0, "en_proceso": 0, "tasa_rechazo_porcentaje": 0.0
        }

    def reporte_derivaciones_por_tipo(self) -> list[dict]:
        cursor = self.db.get_conexion().execute(
            """
            SELECT 
                COALESCE(t.nombre, 'Sin especificar') AS tipo_analisis, 
                COUNT(o.id_orden_derivacion) AS cantidad
            FROM ordenes_derivacion o
            LEFT JOIN tipo_analisis t ON o.tipo_analisis_id = t.id_tipo_analisis
            GROUP BY t.nombre
            ORDER BY cantidad DESC;
            """
        )
        return [dict(f) for f in cursor.fetchall()]

    def reporte_alertas_vacunacion(self) -> list[dict]:
        cursor = self.db.get_conexion().execute(
            """
            SELECT 
                c.id_consulta,
                m.nombre AS mascota,
                m.especie,
                v.nombre || ' ' || v.apellido AS veterinario,
                c.fecha_hora AS fecha_atencion
            FROM consultas c
            JOIN historias_clinicas hc ON c.historia_clinica_id = hc.id_historia_clinica
            JOIN mascotas m ON hc.id_mascota = m.id_mascota
            JOIN veterinarios v ON c.veterinario_id = v.id_veterinario
            WHERE c.tratamiento LIKE '%Esquema al día: False%'
            ORDER BY c.fecha_hora DESC;
            """
        )
        return [dict(f) for f in cursor.fetchall()]

    def reporte_resumen_general(self) -> dict:
        conn = self.db.get_conexion()
        clientes = conn.execute("SELECT COUNT(*) AS c FROM clientes").fetchone()["c"]
        mascotas = conn.execute("SELECT COUNT(*) AS c FROM mascotas").fetchone()["c"]
        consultas = conn.execute("SELECT COUNT(*) AS c FROM consultas").fetchone()["c"]
        muestras = conn.execute("SELECT COUNT(*) AS c FROM muestras").fetchone()["c"]

        return {
            "total_clientes": clientes,
            "total_mascotas": mascotas,
            "total_consultas": consultas,
            "total_muestras": muestras
        }


servicio_reportes = ReportesServicio()