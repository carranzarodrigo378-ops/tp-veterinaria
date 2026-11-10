import csv
from io import BytesIO, StringIO
from datetime import date, datetime

import matplotlib
matplotlib.use("Agg")  # Modo no interactivo para servidores web
import matplotlib.pyplot as plt

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.platypus.tables import Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch

from app.persistencia.reportes_dao import reportes_dao


class ServicioReportes:
    # ------------------------------------------------------------------
    # Consultas de negocio delegadas 100% en ReportesDAO
    # ------------------------------------------------------------------
    def reporte_resumen_general(self) -> dict:
        return reportes_dao.resumen_general()

    def reporte_rechazo_muestras(self) -> list[dict]:
        return reportes_dao.rechazo_muestras()

    def reporte_derivaciones_por_tipo(self) -> list[dict]:
        return reportes_dao.derivaciones_por_tipo()

    def reporte_alertas_vacunacion(self, dias: int = 30) -> list[dict]:
        return reportes_dao.alertas_vacunacion(dias=dias)

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

    def reporte_productividad_veterinarios(self) -> list[dict]:
        return reportes_dao.productividad_veterinarios()

    def reporte_facturacion_detallada(self) -> dict:
        return reportes_dao.facturacion_detallada()

    def reporte_estado_turnos(self) -> dict:
        return reportes_dao.estado_turnos()

    def reporte_demografia_mascotas(self) -> dict:
        return reportes_dao.demografia_mascotas()

    # ------------------------------------------------------------------
    # Generación de PDF con ReportLab y Matplotlib (Estilo Cátedra DAO)
    # ------------------------------------------------------------------
    def _crear_grafico_torta(
        self, labels: list[str], sizes: list[float], titulo_grafico: str
    ) -> BytesIO | None:
        datos_filtrados = [
            (str(l), float(s)) for l, s in zip(labels, sizes) if s and float(s) > 0
        ]
        if not datos_filtrados:
            return None

        etiquetas = [d[0] for d in datos_filtrados]
        valores = [d[1] for d in datos_filtrados]

        fig, ax = plt.subplots(figsize=(4.5, 4.5))
        ax.pie(valores, labels=etiquetas, autopct="%1.1f%%", startangle=90)
        ax.axis("equal")  # Aspecto igual para que sea un círculo
        ax.set_title(titulo_grafico, fontsize=11, fontweight="bold")

        buffer = BytesIO()
        plt.tight_layout()
        plt.savefig(buffer, format="png", dpi=110)
        plt.close(fig)
        buffer.seek(0)
        return buffer

    def _aplicar_estilo_tabla_catedra(self, tabla: Table) -> Table:
        tabla.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 10),
                    ("FONTSIZE", (0, 1), (-1, -1), 9),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )
        return tabla

    def construir_pdf_reporte(
        self,
        tipo_reporte: str,
        fecha_desde: date | str | None = None,
        fecha_hasta: date | str | None = None,
        veterinarios_ids: list[int] | None = None,
        clinica_id: int | None = None,
        especie: str | None = None,
    ) -> BytesIO:
        buffer_pdf = BytesIO()
        doc = SimpleDocTemplate(buffer_pdf, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        fecha_str = datetime.now().strftime("%d/%m/%Y %H:%M")

        if tipo_reporte == "atenciones":
            datos = self.reporte_atenciones_dinamico(
                fecha_desde, fecha_hasta, veterinarios_ids, clinica_id, especie
            )
            por_vet = datos.get("por_veterinario", [])
            atenciones = datos.get("detalle_atenciones", [])

            titulo = "Informe de Atenciones Clínicas Veterinarias"
            subtitulo = (
                f"Emitido: {fecha_str} | Total atenciones: {datos['total_atenciones']} | "
                f"Mascotas distintas: {datos['mascotas_distintas']}"
            )
            grafico = self._crear_grafico_torta(
                [v["veterinario"] for v in por_vet],
                [v["atenciones"] for v in por_vet],
                "Distribución de Atenciones por Veterinario",
            )
            filas_tabla = [["ID", "Fecha", "Mascota", "Especie", "Veterinario", "Motivo"]]
            for a in atenciones:
                filas_tabla.append([
                    str(a["id_consulta"]),
                    str(a["fecha_hora"])[:16],
                    str(a["mascota"])[:15],
                    str(a["especie"]).capitalize(),
                    str(a["veterinario"])[:18],
                    str(a["motivo"])[:22],
                ])
            anchos = [0.5 * inch, 1.3 * inch, 1.1 * inch, 0.9 * inch, 1.5 * inch, 1.7 * inch]

        elif tipo_reporte == "calidad-muestras":
            filas = self.reporte_rechazo_muestras()
            titulo = "Informe de Control de Calidad de Muestras por Laboratorio"
            subtitulo = f"Emitido: {fecha_str} | Tasa de rechazo y procesamiento de muestras"

            total_analizadas = sum(f.get("analizadas", 0) for f in filas)
            total_rechazadas = sum(f.get("rechazadas", 0) for f in filas)
            total_proceso = sum(f.get("en_proceso", 0) for f in filas)

            grafico = self._crear_grafico_torta(
                ["Analizadas", "Rechazadas", "En Proceso"],
                [total_analizadas, total_rechazadas, total_proceso],
                "Proporción Global de Estados de Muestras",
            )
            filas_tabla = [["ID Lab", "Laboratorio", "Total Muestras", "Rechazadas", "% Rechazo"]]
            for f in filas:
                filas_tabla.append([
                    str(f["id_laboratorio"]),
                    str(f["laboratorio"])[:24],
                    str(f["total_muestras"]),
                    str(f["rechazadas"]),
                    f"{f['porcentaje_rechazo']}%",
                ])
            anchos = [0.7 * inch, 2.5 * inch, 1.3 * inch, 1.2 * inch, 1.2 * inch]

        elif tipo_reporte == "derivaciones":
            filas = self.reporte_derivaciones_por_tipo()
            titulo = "Informe de Derivaciones por Tipo de Análisis"
            subtitulo = f"Emitido: {fecha_str} | Estudios clínicos derivados al Laboratorio Central"
            grafico = self._crear_grafico_torta(
                [f["tipo_analisis"] for f in filas],
                [f["total_derivaciones"] for f in filas],
                "Demanda por Tipo de Estudio Clínico",
            )
            filas_tabla = [["ID", "Estudio Clínico", "Muestra", "Derivaciones", "Subtotal Est."]]
            for f in filas:
                filas_tabla.append([
                    str(f["id_tipo_analisis"]),
                    str(f["tipo_analisis"])[:22],
                    str(f["tipo_muestra"]).capitalize(),
                    str(f["total_derivaciones"]),
                    f"${f.get('monto_estimado', 0):,.2f}",
                ])
            anchos = [0.6 * inch, 2.3 * inch, 1.2 * inch, 1.3 * inch, 1.5 * inch]

        elif tipo_reporte == "alertas-vacunas":
            filas = self.reporte_alertas_vacunacion()
            titulo = "Informe Epidemiológico: Alertas de Vacunación"
            subtitulo = f"Emitido: {fecha_str} | Dosis vencidas o próximas a vencer (30 días): {len(filas)}"
            conteo_estado: dict[str, int] = {}
            for f in filas:
                est = str(f.get("estado_alerta", "alerta")).replace("_", " ").capitalize()
                conteo_estado[est] = conteo_estado.get(est, 0) + 1
            grafico = self._crear_grafico_torta(
                list(conteo_estado.keys()),
                list(conteo_estado.values()),
                "Estado de Alertas Vacunales",
            )
            filas_tabla = [["Mascota", "Especie", "Cliente", "Teléfono", "Vacuna", "Próx. Dosis", "Estado"]]
            for f in filas:
                filas_tabla.append([
                    str(f["mascota"])[:12],
                    str(f["especie"]).capitalize(),
                    str(f["cliente"])[:16],
                    str(f["telefono"])[:13],
                    str(f["vacuna"])[:14],
                    str(f["proxima_dosis"])[:10],
                    str(f["estado_alerta"]).upper(),
                ])
            anchos = [0.9 * inch, 0.8 * inch, 1.3 * inch, 1.0 * inch, 1.1 * inch, 0.9 * inch, 0.9 * inch]

        elif tipo_reporte == "productividad-veterinarios":
            filas = self.reporte_productividad_veterinarios()
            titulo = "Informe de Productividad por Veterinario"
            subtitulo = f"Emitido: {fecha_str} | Desempeño operativo del plantel médico"
            grafico = self._crear_grafico_torta(
                [f["veterinario"] for f in filas],
                [f["total_consultas"] for f in filas],
                "Participación en Consultas por Profesional",
            )
            filas_tabla = [["Matrícula", "Veterinario", "Clínica", "Consultas", "Mascotas", "Derivaciones"]]
            for f in filas:
                filas_tabla.append([
                    str(f["matricula"]),
                    str(f["veterinario"])[:18],
                    str(f["clinica"])[:18],
                    str(f["total_consultas"]),
                    str(f["mascotas_unicas_atendidas"]),
                    str(f["ordenes_derivadas"]),
                ])
            anchos = [0.9 * inch, 1.6 * inch, 1.6 * inch, 0.9 * inch, 0.9 * inch, 1.0 * inch]

        elif tipo_reporte == "facturacion":
            datos = self.reporte_facturacion_detallada()
            titulo = "Informe Financiero de Facturación y Comprobantes"
            subtitulo = (
                f"Emitido: {fecha_str} | Comprobantes: {datos['cantidad_comprobantes']} | "
                f"Recaudación Total: ${datos['recaudacion_total']:,.2f}"
            )
            grafico = self._crear_grafico_torta(
                [r["rubro"].capitalize() for r in datos["desglose_por_rubro"]],
                [r["recaudacion"] for r in datos["desglose_por_rubro"]],
                "Ingresos por Rubro Facturado",
            )
            filas_tabla = [["N° Comp.", "Fecha Emisión", "Sucursal", "Cliente", "Total"]]
            for c in datos["comprobantes_emitidos"]:
                filas_tabla.append([
                    f"COMP-{c['numero']}",
                    str(c["fecha_emision"])[:16],
                    str(c["clinica"])[:18],
                    str(c["cliente"])[:20],
                    f"${c['total']:,.2f}",
                ])
            anchos = [1.1 * inch, 1.4 * inch, 1.6 * inch, 1.6 * inch, 1.2 * inch]

        elif tipo_reporte == "turnos":
            datos = self.reporte_estado_turnos()
            titulo = "Informe de Gestión de Turnos y Asistencia"
            subtitulo = f"Emitido: {fecha_str} | Total de turnos: {len(datos['detalle_turnos'])}"
            grafico = self._crear_grafico_torta(
                [r["estado"].capitalize() for r in datos["resumen_estados"]],
                [r["cantidad"] for r in datos["resumen_estados"]],
                "Distribución de Estados de Turnos",
            )
            filas_tabla = [["ID", "Fecha y Hora", "Estado", "Mascota", "Veterinario", "Motivo"]]
            for t in datos["detalle_turnos"]:
                filas_tabla.append([
                    str(t["id_turno"]),
                    str(t["fecha_hora"])[:16],
                    str(t["estado"]).upper(),
                    str(t["mascota"])[:12],
                    str(t["veterinario"])[:18],
                    str(t["motivo"])[:20],
                ])
            anchos = [0.5 * inch, 1.3 * inch, 1.0 * inch, 1.1 * inch, 1.5 * inch, 1.5 * inch]

        else:
            datos = self.reporte_demografia_mascotas()
            titulo = "Informe de Padrón de Mascotas y Bajas Lógicas"
            subtitulo = f"Emitido: {fecha_str} | Total histórico de pacientes: {len(datos['padron_mascotas'])}"
            grafico = self._crear_grafico_torta(
                [e["especie"].capitalize() for e in datos["distribucion_especies"]],
                [e["total"] for e in datos["distribucion_especies"]],
                "Distribución Demográfica por Especie",
            )
            filas_tabla = [["ID", "Mascota", "Especie", "Raza", "Sexo", "Responsable", "Estado BD"]]
            for m in datos["padron_mascotas"]:
                filas_tabla.append([
                    str(m["id_mascota"]),
                    str(m["mascota"])[:12],
                    str(m["especie"]).capitalize(),
                    str(m["raza"])[:13],
                    str(m["sexo"]).capitalize(),
                    str(m["responsable"])[:16],
                    str(m["estado"]),
                ])
            anchos = [0.5 * inch, 1.0 * inch, 0.9 * inch, 1.1 * inch, 0.8 * inch, 1.5 * inch, 1.1 * inch]

        elements.append(
            Paragraph("Red de Clínicas Veterinarias y Laboratorio Central - UTN FRC", styles["Normal"])
        )
        elements.append(Spacer(1, 6))
        elements.append(Paragraph(titulo, styles["Title"]))
        elements.append(Spacer(1, 8))
        elements.append(Paragraph(subtitulo, styles["Normal"]))
        elements.append(Spacer(1, 14))

        if grafico:
            elements.append(Image(grafico, width=260, height=260))
            elements.append(Spacer(1, 14))

        if len(filas_tabla) == 1:
            filas_tabla.append(["-" for _ in filas_tabla[0]])

        tabla = Table(filas_tabla, colWidths=anchos)
        self._aplicar_estilo_tabla_catedra(tabla)
        elements.append(tabla)

        doc.build(elements)
        buffer_pdf.seek(0)
        return buffer_pdf

    # ------------------------------------------------------------------
    # Generación de CSV con la biblioteca estándar csv de Python
    # ------------------------------------------------------------------
    def construir_csv_reporte(
        self,
        tipo_reporte: str,
        fecha_desde: date | str | None = None,
        fecha_hasta: date | str | None = None,
        veterinarios_ids: list[int] | None = None,
        clinica_id: int | None = None,
        especie: str | None = None,
    ) -> StringIO:
        output = StringIO()
        writer = csv.writer(output, delimiter=",")

        if tipo_reporte == "atenciones":
            res = self.reporte_atenciones_dinamico(
                fecha_desde, fecha_hasta, veterinarios_ids, clinica_id, especie
            )
            datos = res.get("detalle_atenciones", res.get("por_veterinario", []))
        elif tipo_reporte == "calidad-muestras":
            datos = self.reporte_rechazo_muestras()
        elif tipo_reporte == "derivaciones":
            datos = self.reporte_derivaciones_por_tipo()
        elif tipo_reporte == "alertas-vacunas":
            datos = self.reporte_alertas_vacunacion()
        elif tipo_reporte == "productividad-veterinarios":
            datos = self.reporte_productividad_veterinarios()
        elif tipo_reporte == "facturacion":
            datos = self.reporte_facturacion_detallada()["comprobantes_emitidos"]
        elif tipo_reporte == "turnos":
            datos = self.reporte_estado_turnos()["detalle_turnos"]
        else:
            datos = self.reporte_demografia_mascotas()["padron_mascotas"]

        if datos:
            writer.writerow(list(datos[0].keys()))
            for fila in datos:
                writer.writerow(list(fila.values()))
        else:
            writer.writerow(["mensaje"])
            writer.writerow(["Sin registros para los criterios seleccionados"])

        output.seek(0)
        return output


servicio_reportes = ServicioReportes()