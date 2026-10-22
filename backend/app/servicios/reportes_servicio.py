class ReportesServicio:
    def __init__(self, repositorio_reportes=None):
        # Cuando tu compañero cree el repositorio de SQLite, se inyecta acá
        self.repositorio = repositorio_reportes

    def reporte_rechazo_muestras(self) -> dict:
        # El SQL del repositorio ya devuelve el diccionario con las sumas y porcentajes calculados
        if self.repositorio:
            return self.repositorio.obtener_metricas_rechazo_muestras()
        return {
            "total_muestras": 0,
            "analizadas": 0,
            "rechazadas": 0,
            "en_proceso": 0,
            "tasa_rechazo_porcentaje": 0.0
        }

    def reporte_derivaciones_por_tipo(self) -> list[dict]:
        # El SQL con GROUP BY ya devuelve la lista con [{"tipo_analisis": "...", "cantidad": X}]
        if self.repositorio:
            return self.repositorio.obtener_derivaciones_agrupadas()
        return []

    def reporte_alertas_vacunacion(self) -> list[dict]:
        # El SQL con JOIN ya devuelve las mascotas con alertas sanitarias
        if self.repositorio:
            return self.repositorio.obtener_alertas_vacunacion()
        return []

    def reporte_resumen_general(self) -> dict:
        # Conteos globales directos desde el motor relacional
        if self.repositorio:
            return self.repositorio.obtener_conteos_globales()
        return {
            "total_clientes": 0,
            "total_mascotas": 0,
            "total_consultas": 0,
            "total_muestras": 0
        }


servicio_reportes = ReportesServicio()