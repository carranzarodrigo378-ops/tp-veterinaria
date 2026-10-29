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
        return (
            dict(fila)
            if fila
            else {
                "total_muestras": 0,
                "analizadas": 0,
                "rechazadas": 0,
                "en_proceso": 0,
                "tasa_rechazo_porcentaje": 0.0,
            }
        )

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
        clientes = conn.execute("SELECT COUNT(*) AS c FROM clientes WHERE activo = 1").fetchone()["c"]
        mascotas = conn.execute("SELECT COUNT(*) AS c FROM mascotas WHERE activo = 1").fetchone()["c"]
        consultas = conn.execute("SELECT COUNT(*) AS c FROM consultas").fetchone()["c"]
        muestras = conn.execute("SELECT COUNT(*) AS c FROM muestras").fetchone()["c"]

        return {
            "total_clientes": clientes,
            "total_mascotas": mascotas,
            "total_consultas": consultas,
            "total_muestras": muestras,
        }

    def reporte_atenciones_dinamico(
        self,
        fecha_desde: str | None = None,
        fecha_hasta: str | None = None,
        veterinarios_ids: list[int] | None = None,
        clinica_id: int | None = None,
        especie: str | None = None,
    ) -> dict:
        """
        Consulta única parametrizada con filtros variables:
        Permite saber en 1 sola consulta cuántas mascotas se atendieron hoy,
        en un rango de fechas, por un veterinario específico o por un conjunto de veterinarios.
        """
        query = """
            SELECT 
                c.id_consulta,
                c.fecha_hora,
                c.tipo AS tipo_atencion,
                c.motivo,
                c.diagnostico,
                m.id_mascota,
                m.nombre AS mascota,
                m.especie,
                cli.nombre || ' ' || cli.apellido AS duenio,
                v.id_veterinario,
                v.nombre || ' ' || v.apellido AS veterinario,
                v.matricula,
                cl.nombre AS clinica
            FROM consultas c
            JOIN historias_clinicas hc ON c.historia_clinica_id = hc.id_historia_clinica
            JOIN mascotas m ON hc.id_mascota = m.id_mascota
            JOIN clientes cli ON m.id_cliente = cli.id_cliente
            JOIN veterinarios v ON c.veterinario_id = v.id_veterinario
            JOIN clinicas cl ON c.clinica_id = cl.id_clinica
            WHERE 1=1
        """
        params: list = []

        if fecha_desde:
            query += " AND date(c.fecha_hora) >= date(?)"
            params.append(fecha_desde)

        if fecha_hasta:
            query += " AND date(c.fecha_hora) <= date(?)"
            params.append(fecha_hasta)

        if veterinarios_ids:
            marcadores = ", ".join("?" for _ in veterinarios_ids)
            query += f" AND c.veterinario_id IN ({marcadores})"
            params.extend(veterinarios_ids)

        if clinica_id is not None:
            query += " AND c.clinica_id = ?"
            params.append(clinica_id)

        if especie:
            query += " AND LOWER(m.especie) = LOWER(?)"
            params.append(especie)

        query += " ORDER BY c.fecha_hora DESC"

        cursor = self.db.get_conexion().execute(query, tuple(params))
        atenciones = [dict(fila) for fila in cursor.fetchall()]

        mascotas_unicas = len({a["id_mascota"] for a in atenciones})

        return {
            "filtros_aplicados": {
                "fecha_desde": fecha_desde,
                "fecha_hasta": fecha_hasta,
                "veterinarios_ids": veterinarios_ids,
                "clinica_id": clinica_id,
                "especie": especie,
            },
            "total_consultas": len(atenciones),
            "total_mascotas_atendidas": mascotas_unicas,
            "detalle_atenciones": atenciones,
        }


servicio_reportes = ReportesServicio()