import csv
from io import BytesIO, StringIO
from datetime import date, datetime

import matplotlib
matplotlib.use("Agg")  # Modo no interactivo para servidores web
import matplotlib.pyplot as plt

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    HRFlowable,
)
from reportlab.platypus.tables import Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.units import inch

from app.persistencia.reportes_dao import reportes_dao

# Paleta corporativa de la clínica (sincronizada con el Frontend)
COLOR_PRIMARIO = colors.HexColor("#0d7373")
COLOR_SECUNDARIO = colors.HexColor("#129b9b")
COLOR_FILA_PAR = colors.HexColor("#f0f9f9")
COLOR_FILA_IMPAR = colors.white
COLOR_BORDE = colors.HexColor("#cbd5e1")
COLOR_TEXTO = colors.HexColor("#1e293b")

PALETA_GRAFICO = [
    "#129b9b",
    "#0d7373",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#8b5cf6",
    "#10b981",
]


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

    def reporte_estado_turnos(self) -> dict:
        return reportes_dao.estado_turnos()

    def reporte_demografia_mascotas(self) -> dict:
        return reportes_dao.demografia_mascotas()

    # ------------------------------------------------------------------
    # Generación de PDF con ReportLab y Matplotlib (Diseño Moderno)
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
        colores = [PALETA_GRAFICO[i % len(PALETA_GRAFICO)] for i in range(len(valores))]

        fig, ax = plt.subplots(figsize=(6.2, 3.0), dpi=130)
        wedges, texts, autotexts = ax.pie(
            valores,
            autopct="%1.1f%%",
            startangle=140,
            colors=colores,
            pctdistance=0.75,
            wedgeprops={"width": 0.45, "edgecolor": "white", "linewidth": 2},
            textprops={"fontsize": 8.5, "color": "#1e293b", "weight": "bold"},
        )
        for autotext in autotexts:
            autotext.set_color("white")
            autotext.set_fontsize(8)

        # Leyenda al costado para evitar que las etiquetas se superpongan
        etiquetas_leyenda = [
            f"{et} ({int(val) if val.is_integer() else val})"
            for et, val in zip(etiquetas, valores)
        ]
        ax.legend(
            wedges,
            etiquetas_leyenda,
            title="Referencias",
            loc="center left",
            bbox_to_anchor=(1.0, 0.5),
            frameon=False,
            fontsize=8.5,
            title_fontsize=9,
        )

        ax.axis("equal")
        ax.set_title(
            titulo_grafico,
            fontsize=11,
            fontweight="bold",
            color="#0d7373",
            pad=12,
        )

        buffer = BytesIO()
        plt.tight_layout()
        plt.savefig(buffer, format="png", dpi=130, bbox_inches="tight")
        plt.close(fig)
        buffer.seek(0)
        return buffer

    def _aplicar_estilo_tabla_catedra(self, tabla: Table, num_filas: int) -> Table:
        comandos = [
            # Encabezado moderno con el color institucional
            ("BACKGROUND", (0, 0), (-1, 0), COLOR_PRIMARIO),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9.5),
            ("TOPPADDING", (0, 0), (-1, 0), 8),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            # Cuerpo de la tabla
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, -1), 8.5),
            ("TEXTCOLOR", (0, 1), (-1, -1), COLOR_TEXTO),
            ("TOPPADDING", (0, 1), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
            # Bordes suaves y limpios
            ("LINEBELOW", (0, 0), (-1, 0), 1.5, COLOR_SECUNDARIO),
            ("INNERGRID", (0, 0), (-1, -1), 0.4, COLOR_BORDE),
            ("BOX", (0, 0), (-1, -1), 0.8, COLOR_PRIMARIO),
        ]

        # Efecto cebra (alternar color de filas pares e impares)
        for fila_idx in range(1, num_filas):
            bg = COLOR_FILA_PAR if fila_idx % 2 == 0 else COLOR_FILA_IMPAR
            comandos.append(("BACKGROUND", (0, fila_idx), (-1, fila_idx), bg))

        tabla.setStyle(TableStyle(comandos))
        return tabla

    @staticmethod
    def _dibujar_pie_pagina(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(COLOR_BORDE)
        canvas.setLineWidth(0.5)
        canvas.line(40, 38, letter[0] - 40, 38)

        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#64748b"))
        canvas.drawString(
            40,
            25,
            "Sistema de Gestión Veterinaria y Trazabilidad de Laboratorio - UTN FRC (Curso 3K5)",
        )
        canvas.drawRightString(letter[0] - 40, 25, f"Página {doc.page}")
        canvas.restoreState()

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
        doc = SimpleDocTemplate(
            buffer_pdf,
            pagesize=letter,
            leftMargin=40,
            rightMargin=40,
            topMargin=42,
            bottomMargin=52,
        )
        elements = []
        styles = getSampleStyleSheet()

        estilo_institucion = ParagraphStyle(
            "Institucion",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            textColor=COLOR_SECUNDARIO,
            alignment=TA_LEFT,
        )
        estilo_titulo = ParagraphStyle(
            "TituloReporte",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=21,
            textColor=COLOR_PRIMARIO,
            alignment=TA_LEFT,
            spaceAfter=4,
        )
        estilo_subtitulo = ParagraphStyle(
            "SubtituloReporte",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            textColor=colors.HexColor("#475569"),
            alignment=TA_LEFT,
        )

        fecha_str = datetime.now().strftime("%d/%m/%Y %H:%M")

        if tipo_reporte == "atenciones":
            datos = self.reporte_atenciones_dinamico(
                fecha_desde, fecha_hasta, veterinarios_ids, clinica_id, especie
            )
            por_vet = datos.get("por_veterinario", [])
            atenciones = datos.get("detalle_atenciones", [])

            titulo = "Informe de Atenciones Clínicas Veterinarias"
            subtitulo = (
                f"<b>Fecha de emisión:</b> {fecha_str} &nbsp;|&nbsp; "
                f"<b>Total consultas:</b> {datos['total_atenciones']} &nbsp;|&nbsp; "
                f"<b>Pacientes únicos:</b> {datos['mascotas_distintas']}"
            )
            grafico = self._crear_grafico_torta(
                [v["veterinario"] for v in por_vet],
                [v["atenciones"] for v in por_vet],
                "Distribución de Atenciones por Profesional",
            )
            filas_tabla = [["N°", "Fecha y Hora", "Paciente", "Especie", "Profesional", "Motivo de Consulta"]]
            for a in atenciones:
                filas_tabla.append([
                    f"#{a['id_consulta']}",
                    str(a["fecha_hora"])[:16],
                    str(a["mascota"])[:15],
                    str(a["especie"]).capitalize(),
                    str(a["veterinario"])[:18],
                    str(a["motivo"])[:24],
                ])
            anchos = [0.55 * inch, 1.25 * inch, 1.1 * inch, 0.85 * inch, 1.55 * inch, 1.8 * inch]

        elif tipo_reporte == "calidad-muestras":
            filas = self.reporte_rechazo_muestras()
            titulo = "Control de Calidad y Rechazo de Muestras Biológicas"
            subtitulo = (
                f"<b>Fecha de emisión:</b> {fecha_str} &nbsp;|&nbsp; "
                f"Auditoría de cadena de frío e integridad de precintos sanitarios"
            )

            total_analizadas = sum(f.get("analizadas", 0) for f in filas)
            total_rechazadas = sum(f.get("rechazadas", 0) for f in filas)
            total_proceso = sum(f.get("en_proceso", 0) for f in filas)

            grafico = self._crear_grafico_torta(
                ["Analizadas", "Rechazadas", "En Proceso"],
                [total_analizadas, total_rechazadas, total_proceso],
                "Proporción Global de Estados de Muestras",
            )
            filas_tabla = [["ID Lab", "Laboratorio Receptor", "Muestras Recibidas", "Rechazadas", "Tasa de Rechazo"]]
            for f in filas:
                filas_tabla.append([
                    f"LAB-{f['id_laboratorio']}",
                    str(f["laboratorio"])[:26],
                    str(f["total_muestras"]),
                    str(f["rechazadas"]),
                    f"{f['porcentaje_rechazo']}%",
                ])
            anchos = [0.8 * inch, 2.5 * inch, 1.35 * inch, 1.2 * inch, 1.25 * inch]

        elif tipo_reporte == "derivaciones":
            filas = self.reporte_derivaciones_por_tipo()
            titulo = "Derivaciones por Tipo de Estudio Clínico"
            subtitulo = (
                f"<b>Fecha de emisión:</b> {fecha_str} &nbsp;|&nbsp; "
                f"Demanda de análisis complejos derivados al Laboratorio Central"
            )
            grafico = self._crear_grafico_torta(
                [f["tipo_analisis"] for f in filas],
                [f["total_derivaciones"] for f in filas],
                "Participación por Tipo de Estudio Clínico",
            )
            filas_tabla = [["Código", "Estudio Clínico Solicitado", "Tipo de Muestra", "Órdenes Emitidas"]]
            for f in filas:
                filas_tabla.append([
                    f"EST-{f['id_tipo_analisis']}",
                    str(f["tipo_analisis"])[:28],
                    str(f["tipo_muestra"]).capitalize(),
                    str(f["total_derivaciones"]),
                ])
            anchos = [0.9 * inch, 2.9 * inch, 1.6 * inch, 1.7 * inch]

        elif tipo_reporte == "alertas-vacunas":
            filas = self.reporte_alertas_vacunacion()
            titulo = "Vigilancia Epidemiológica: Alertas de Vacunación"
            subtitulo = (
                f"<b>Fecha de emisión:</b> {fecha_str} &nbsp;|&nbsp; "
                f"<b>Pacientes con refuerzo vencido o próximo (30 días):</b> {len(filas)}"
            )
            conteo_estado: dict[str, int] = {}
            for f in filas:
                est = str(f.get("estado_alerta", "alerta")).replace("_", " ").capitalize()
                conteo_estado[est] = conteo_estado.get(est, 0) + 1
            grafico = self._crear_grafico_torta(
                list(conteo_estado.keys()),
                list(conteo_estado.values()),
                "Distribución de Alertas Vacunales",
            )
            filas_tabla = [["Paciente", "Especie", "Responsable", "Teléfono", "Vacuna", "Próx. Dosis", "Estado"]]
            for f in filas:
                estado_limpio = str(f["estado_alerta"]).replace("_", " ").upper()
                filas_tabla.append([
                    str(f["mascota"])[:12],
                    str(f["especie"]).capitalize(),
                    str(f["cliente"])[:16],
                    str(f["telefono"])[:13],
                    str(f["vacuna"])[:14],
                    str(f["proxima_dosis"])[:10],
                    estado_limpio,
                ])
            anchos = [0.95 * inch, 0.8 * inch, 1.35 * inch, 1.0 * inch, 1.15 * inch, 0.9 * inch, 0.95 * inch]

        elif tipo_reporte == "productividad-veterinarios":
            filas = self.reporte_productividad_veterinarios()
            titulo = "Productividad y Desempeño del Plantel Veterinario"
            subtitulo = (
                f"<b>Fecha de emisión:</b> {fecha_str} &nbsp;|&nbsp; "
                f"Reporte gerencial de actividad clínica por profesional"
            )
            grafico = self._crear_grafico_torta(
                [f["veterinario"] for f in filas],
                [f["total_consultas"] for f in filas],
                "Participación en Consultas por Profesional",
            )
            filas_tabla = [["Matrícula", "Profesional", "Sucursal", "Consultas", "Pacientes", "Derivaciones"]]
            for f in filas:
                filas_tabla.append([
                    str(f["matricula"]),
                    str(f["veterinario"])[:18],
                    str(f["clinica"])[:18],
                    str(f["total_consultas"]),
                    str(f["mascotas_unicas_atendidas"]),
                    str(f["ordenes_derivadas"]),
                ])
            anchos = [0.95 * inch, 1.65 * inch, 1.65 * inch, 0.95 * inch, 0.95 * inch, 0.95 * inch]

        elif tipo_reporte == "turnos":
            datos = self.reporte_estado_turnos()
            titulo = "Estado de Agenda y Gestión de Turnos"
            subtitulo = (
                f"<b>Fecha de emisión:</b> {fecha_str} &nbsp;|&nbsp; "
                f"<b>Total de turnos registrados en agenda:</b> {len(datos['detalle_turnos'])}"
            )
            grafico = self._crear_grafico_torta(
                [r["estado"].capitalize() for r in datos["resumen_estados"]],
                [r["cantidad"] for r in datos["resumen_estados"]],
                "Proporción de Turnos según Estado",
            )
            filas_tabla = [["N°", "Fecha y Hora", "Estado", "Paciente", "Profesional Asignado", "Motivo"]]
            for t in datos["detalle_turnos"]:
                filas_tabla.append([
                    f"#{t['id_turno']}",
                    str(t["fecha_hora"])[:16],
                    str(t["estado"]).upper(),
                    str(t["mascota"])[:12],
                    str(t["veterinario"])[:19],
                    str(t["motivo"])[:20],
                ])
            anchos = [0.55 * inch, 1.25 * inch, 1.0 * inch, 1.1 * inch, 1.65 * inch, 1.55 * inch]

        else:
            datos = self.reporte_demografia_mascotas()
            titulo = "Padrón Demográfico de Pacientes y Auditoría de Bajas"
            subtitulo = (
                f"<b>Fecha de emisión:</b> {fecha_str} &nbsp;|&nbsp; "
                f"<b>Total histórico de mascotas registradas:</b> {len(datos['padron_mascotas'])}"
            )
            grafico = self._crear_grafico_torta(
                [e["especie"].capitalize() for e in datos["distribucion_especies"]],
                [e["total"] for e in datos["distribucion_especies"]],
                "Distribución Demográfica por Especie",
            )
            filas_tabla = [["ID", "Paciente", "Especie", "Raza", "Sexo", "Responsable", "Estado en Sistema"]]
            for m in datos["padron_mascotas"]:
                filas_tabla.append([
                    f"#{m['id_mascota']}",
                    str(m["mascota"])[:12],
                    str(m["especie"]).capitalize(),
                    str(m["raza"])[:13],
                    str(m["sexo"]).capitalize(),
                    str(m["responsable"])[:16],
                    str(m["estado"]),
                ])
            anchos = [0.55 * inch, 1.0 * inch, 0.85 * inch, 1.1 * inch, 0.8 * inch, 1.6 * inch, 1.2 * inch]

        # Encabezado institucional del PDF
        elements.append(
            Paragraph(
                "RED DE CLÍNICAS VETERINARIAS Y LABORATORIO CENTRAL • UTN FRC",
                estilo_institucion,
            )
        )
        elements.append(Spacer(1, 2))
        elements.append(Paragraph(titulo, estilo_titulo))
        elements.append(Paragraph(subtitulo, estilo_subtitulo))
        elements.append(Spacer(1, 8))
        elements.append(
            HRFlowable(width="100%", thickness=1.5, color=COLOR_SECUNDARIO, spaceAfter=12)
        )

        if grafico:
            elements.append(Image(grafico, width=410, height=198))
            elements.append(Spacer(1, 12))

        if len(filas_tabla) == 1:
            filas_tabla.append(["Sin registros disponibles" if i == 1 else "-" for i in range(len(filas_tabla[0]))])

        tabla = Table(filas_tabla, colWidths=anchos, repeatRows=1)
        self._aplicar_estilo_tabla_catedra(tabla, len(filas_tabla))
        elements.append(tabla)

        doc.build(
            elements,
            onFirstPage=self._dibujar_pie_pagina,
            onLaterPages=self._dibujar_pie_pagina,
        )
        buffer_pdf.seek(0)
        return buffer_pdf

    # ------------------------------------------------------------------
    # Generación de CSV con encabezados amigables
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
        elif tipo_reporte == "turnos":
            datos = self.reporte_estado_turnos()["detalle_turnos"]
        else:
            datos = self.reporte_demografia_mascotas()["padron_mascotas"]

        if datos:
            # Convertir snake_case a títulos amigables (ej. fecha_hora -> Fecha Hora)
            encabezados = [str(k).replace("_", " ").upper() for k in datos[0].keys()]
            writer.writerow(encabezados)
            for fila in datos:
                writer.writerow(list(fila.values()))
        else:
            writer.writerow(["ESTADO DEL REPORTE"])
            writer.writerow(["Sin registros para los criterios seleccionados"])

        output.seek(0)
        return output


servicio_reportes = ServicioReportes()