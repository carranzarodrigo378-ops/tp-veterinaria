from app.persistencia.reportes_dao import ReportesDAO


class ReportesServicio:
    def __init__(self, repositorio: ReportesDAO | None = None):
        self.repositorio = repositorio or ReportesDAO()

    def reporte_rechazo_muestras(self) -> dict:
        return self.repositorio.obtener_metricas_rechazo_muestras()

    def reporte_derivaciones_por_tipo(self) -> list[dict]:
        return self.repositorio.obtener_derivaciones_agrupadas()

    def reporte_alertas_vacunacion(self) -> list[dict]:
        return self.repositorio.obtener_alertas_vacunacion()

    def reporte_resumen_general(self) -> dict:
        return self.repositorio.obtener_conteos_globales()


servicio_reportes = ReportesServicio()