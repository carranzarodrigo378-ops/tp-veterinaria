from fastapi import APIRouter, Depends, Query
from app.servicios.reportes_servicio import servicio_reportes
from app.rutas.dependencias import requerir_rol

router = APIRouter(prefix="/api/reportes", tags=["Reportes e Informes"])


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