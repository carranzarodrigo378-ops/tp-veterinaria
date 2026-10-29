from fastapi import APIRouter, Depends
from datetime import date
from typing import Optional
from app.servicios.reportes_servicio import servicio_reportes
from app.rutas.dependencias import requerir_rol

router = APIRouter(prefix="/api/reportes", tags=["Reportes e Informes"])

@router.get("/resumen-general", dependencies=[Depends(requerir_rol(["admin", "veterinario"]))])
def obtener_resumen_general(desde: Optional[date] = None, hasta: Optional[date] = None):
    return servicio_reportes.reporte_resumen_general(desde, hasta)

@router.get("/calidad-muestras", dependencies=[Depends(requerir_rol(["admin", "veterinario"]))])
def obtener_control_calidad_muestras(desde: Optional[date] = None, hasta: Optional[date] = None):
    return servicio_reportes.reporte_rechazo_muestras(desde, hasta)

@router.get("/derivaciones-tipo", dependencies=[Depends(requerir_rol(["admin", "veterinario"]))])
def obtener_derivaciones_por_tipo(desde: Optional[date] = None, hasta: Optional[date] = None):
    return servicio_reportes.reporte_derivaciones_por_tipo(desde, hasta)

@router.get("/alertas-vacunas", dependencies=[Depends(requerir_rol(["admin", "veterinario"]))])
def obtener_alertas_vacunas(desde: Optional[date] = None, hasta: Optional[date] = None):
    return servicio_reportes.reporte_alertas_vacunacion(desde, hasta)