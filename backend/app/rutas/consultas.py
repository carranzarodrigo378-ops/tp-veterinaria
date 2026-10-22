from fastapi import APIRouter, Depends, HTTPException, status
from app.esquemas.consultas import (
    ConsultaMedicaCrear,
    OrdenDerivacionCrear,
    OrdenDerivacionRespuesta,
)
from app.esquemas.vacuna import VacunaCrear, VacunaRespuesta
from app.esquemas.esquemaVacunal import EsquemaVacunalCrear, EsquemaVacunalRespuesta
from app.servicios.consultas_servicio import servicio_consultas
from app.rutas.dependencias import requerir_rol, obtener_usuario_actual

router = APIRouter(prefix="/api/atencion", tags=["Consultas y Derivaciones"])


# --- ENDPOINTS DE VACUNACIÓN (CONFIGURACIÓN) ---

@router.post(
    "/vacunas",
    response_model=VacunaRespuesta,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requerir_rol(["admin"]))],
)
def crear_vacuna(datos: VacunaCrear):
    return servicio_consultas.registrar_vacuna(datos)


@router.post(
    "/esquemas-vacunales",
    response_model=EsquemaVacunalRespuesta,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requerir_rol(["admin"]))],
)
def crear_esquema_vacunal(datos: EsquemaVacunalCrear):
    try:
        return servicio_consultas.registrar_esquema_vacunal(datos)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# --- ENDPOINTS CLÍNICOS (VETERINARIOS) ---

@router.post(
    "/consultas",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requerir_rol(["veterinario", "admin"]))],
)
def registrar_consulta_clinica(
    datos: ConsultaMedicaCrear,
    usuario_actual: dict = Depends(obtener_usuario_actual),
):
    try:
        return servicio_consultas.registrar_consulta(
            datos, veterinario=usuario_actual["usuario"]
        )
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "/ordenes-derivacion",
    response_model=OrdenDerivacionRespuesta,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requerir_rol(["veterinario", "admin"]))],
)
def emitir_orden_derivacion(datos: OrdenDerivacionCrear):
    try:
        return servicio_consultas.emitir_orden_derivacion(datos)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get(
    "/ordenes-derivacion",
    response_model=list[OrdenDerivacionRespuesta],
    dependencies=[Depends(requerir_rol(["veterinario", "admin"]))],
)
def listar_ordenes_derivacion():
    return servicio_consultas.listar_ordenes()