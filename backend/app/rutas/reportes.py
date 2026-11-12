from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from app.servicios.reportes_servicio import servicio_reportes
from app.rutas.dependencias import requerir_rol

router = APIRouter(prefix="/api/reportes", tags=["Reportes e Informes"])

REPORTES_EXCLUSIVOS_ADMIN = {
    "productividad-veterinarios",
    "demografia-mascotas",
}


# =========================================================================
# 1. REPORTES CLÍNICOS Y OPERATIVOS (ACCESO: ADMIN Y VETERINARIO)
# =========================================================================

@router.get(
    "/resumen-general",
    dependencies=[Depends(requerir_rol(["admin", "veterinario"]))],
)
def obtener_resumen_general():
    return servicio_reportes.reporte_resumen_general()


@router.get(
    "/calidad-muestras",
    dependencies=[Depends(requerir_rol(["admin", "veterinario"]))],
)
def obtener_control_calidad_muestras():
    return servicio_reportes.reporte_rechazo_muestras()


@router.get(
    "/derivaciones-tipo",
    dependencies=[Depends(requerir_rol(["admin", "veterinario"]))],
)
def obtener_derivaciones_por_tipo():
    return servicio_reportes.reporte_derivaciones_por_tipo()


@router.get(
    "/alertas-vacunas",
    dependencies=[Depends(requerir_rol(["admin", "veterinario"]))],
)
def obtener_alertas_vacunas():
    return servicio_reportes.reporte_alertas_vacunacion()


@router.get(
    "/atenciones",
    dependencies=[Depends(requerir_rol(["admin", "veterinario"]))],
)
def obtener_reporte_atenciones_variable(
    fecha_desde: str | None = Query(
        default=None,
        description="Fecha inicio YYYY-MM-DD (ej. pasar la fecha de hoy para ver las de hoy)",
    ),
    fecha_hasta: str | None = Query(
        default=None,
        description="Fecha fin YYYY-MM-DD",
    ),
    veterinarios_ids: list[int] | None = Query(
        default=None,
        description="ID de un veterinario o lista de IDs de varios veterinarios",
    ),
    clinica_id: int | None = Query(
        default=None,
        description="ID de la clínica para filtrar por sucursal",
    ),
    especie: str | None = Query(
        default=None,
        description="Especie de la mascota (ej. perro, gato)",
    ),
):
    return servicio_reportes.reporte_atenciones_dinamico(
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        veterinarios_ids=veterinarios_ids,
        clinica_id=clinica_id,
        especie=especie,
    )


@router.get(
    "/turnos",
    dependencies=[Depends(requerir_rol(["admin", "veterinario"]))],
)
def obtener_reporte_turnos():
    return servicio_reportes.reporte_estado_turnos()


# =========================================================================
# 2. REPORTES GERENCIALES Y AUDITORÍA (ACCESO EXCLUSIVO: ADMIN)
# =========================================================================

@router.get(
    "/productividad-veterinarios",
    dependencies=[Depends(requerir_rol(["admin"]))],
)
def obtener_productividad_veterinarios():
    return servicio_reportes.reporte_productividad_veterinarios()


@router.get(
    "/demografia-mascotas",
    dependencies=[Depends(requerir_rol(["admin"]))],
)
def obtener_demografia_mascotas():
    return servicio_reportes.reporte_demografia_mascotas()


# =========================================================================
# 3. EXPORTACIÓN EN PDF (REPORTLAB + MATPLOTLIB) Y CSV SEGÚN ROL
# =========================================================================

@router.get("/exportar/pdf/{tipo_reporte}")
def descargar_reporte_pdf(
    tipo_reporte: str,
    fecha_desde: str | None = Query(default=None),
    fecha_hasta: str | None = Query(default=None),
    veterinarios_ids: list[int] | None = Query(default=None),
    clinica_id: int | None = Query(default=None),
    especie: str | None = Query(default=None),
    usuario_actual: dict = Depends(requerir_rol(["admin", "veterinario"])),
):
    if (
        tipo_reporte in REPORTES_EXCLUSIVOS_ADMIN
        and usuario_actual.get("rol") != "admin"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: este reporte gerencial es exclusivo para administradores.",
        )

    buffer_pdf = servicio_reportes.construir_pdf_reporte(
        tipo_reporte=tipo_reporte,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        veterinarios_ids=veterinarios_ids,
        clinica_id=clinica_id,
        especie=especie,
    )
    nombre_archivo = f"reporte_{tipo_reporte}.pdf"
    return StreamingResponse(
        buffer_pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={nombre_archivo}"},
    )


@router.get("/exportar/csv/{tipo_reporte}")
def descargar_reporte_csv(
    tipo_reporte: str,
    fecha_desde: str | None = Query(default=None),
    fecha_hasta: str | None = Query(default=None),
    veterinarios_ids: list[int] | None = Query(default=None),
    clinica_id: int | None = Query(default=None),
    especie: str | None = Query(default=None),
    usuario_actual: dict = Depends(requerir_rol(["admin", "veterinario"])),
):
    if (
        tipo_reporte in REPORTES_EXCLUSIVOS_ADMIN
        and usuario_actual.get("rol") != "admin"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: este reporte gerencial es exclusivo para administradores.",
        )

    buffer_csv = servicio_reportes.construir_csv_reporte(
        tipo_reporte=tipo_reporte,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        veterinarios_ids=veterinarios_ids,
        clinica_id=clinica_id,
        especie=especie,
    )
    nombre_archivo = f"reporte_{tipo_reporte}.csv"
    return StreamingResponse(
        iter([buffer_csv.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={nombre_archivo}"},
    )