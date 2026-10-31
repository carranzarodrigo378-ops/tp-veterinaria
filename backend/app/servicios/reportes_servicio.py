from datetime import date

from app.persistencia.reportes_dao import reportes_dao


class ServicioReportes:
    def reporte_resumen_general(self) -> dict:
        return reportes_dao.resumen_general()

    def reporte_rechazo_muestras(self) -> list[dict]:
        return reportes_dao.rechazo_muestras()

    def reporte_derivaciones_por_tipo(self) -> list[dict]:
        return reportes_dao.derivaciones_por_tipo()

    def reporte_alertas_vacunacion(self) -> list[dict]:
        return reportes_dao.alertas_vacunacion()

    def reporte_atenciones_dinamico(
        self,
        fecha_desde: date | str | None = None,
        fecha_hasta: date | str | None = None,
        veterinarios_ids: list[int] | None = None,
        clinica_id: int | None = None,
        especie: str | None = None,
    ) -> dict:
        return reportes_dao.atenciones_dinamico(
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            veterinarios_ids=veterinarios_ids,
            clinica_id=clinica_id,
            especie=especie,
        )


servicio_reportes = ServicioReportes()