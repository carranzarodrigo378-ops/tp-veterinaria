from fastapi import APIRouter, Depends
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