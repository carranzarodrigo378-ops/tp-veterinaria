from fastapi import APIRouter, Depends, HTTPException, status
from app.esquemas.muestras import (
    MuestraCrear,
    MuestraEmpaquetar,
    MuestraDespachar,
    MuestraRecepcion,
    MuestraAnalizar,
    MuestraDetalleRespuesta,
)
from app.dominio.estados import ExcepcionTransicionEstado
from app.servicios.muestras_servicio import servicio_muestras
from app.rutas.dependencias import requerir_rol, obtener_usuario_actual

router = APIRouter(prefix="/api/muestras", tags=["Muestras y Laboratorio"])


@router.post(
    "/",
    response_model=MuestraDetalleRespuesta,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requerir_rol(["veterinario", "admin"]))],
)
def crear_muestra(
    datos: MuestraCrear,
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    try:
        return servicio_muestras.registrar_extraccion(datos)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/{id_muestra}/empaquetar",
    response_model=MuestraDetalleRespuesta,
    dependencies=[Depends(requerir_rol(["veterinario", "admin"]))],
)
def empaquetar_muestra(
    id_muestra: int,
    datos: MuestraEmpaquetar,
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    try:
        return servicio_muestras.empaquetar(id_muestra, datos)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ExcepcionTransicionEstado as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post(
    "/{id_muestra}/despachar",
    response_model=MuestraDetalleRespuesta,
    dependencies=[Depends(requerir_rol(["veterinario", "admin"]))],
)
def despachar_muestra(
    id_muestra: int,
    datos: MuestraDespachar,
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    try:
        return servicio_muestras.despachar(id_muestra, datos)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ExcepcionTransicionEstado as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post(
    "/{id_muestra}/recibir",
    response_model=MuestraDetalleRespuesta,
    dependencies=[Depends(requerir_rol(["veterinario", "admin"]))],
)
def recibir_muestra_en_laboratorio(
    id_muestra: int,
    datos: MuestraRecepcion,
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    try:
        return servicio_muestras.recibir_en_laboratorio(id_muestra, datos)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ExcepcionTransicionEstado as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post(
    "/{id_muestra}/analizar",
    response_model=MuestraDetalleRespuesta,
    dependencies=[Depends(requerir_rol(["veterinario", "admin"]))],
)
def registrar_analisis_muestra(
    id_muestra: int,
    datos: MuestraAnalizar,
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    try:
        return servicio_muestras.registrar_analisis(id_muestra, datos)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ExcepcionTransicionEstado as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.get(
    "/{id_muestra}",
    response_model=MuestraDetalleRespuesta,
    dependencies=[Depends(obtener_usuario_actual)],
)
def obtener_muestra(id_muestra: int):
    try:
        return servicio_muestras.obtener_por_id(id_muestra)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get(
    "/",
    response_model=list[MuestraDetalleRespuesta],
    dependencies=[Depends(obtener_usuario_actual)],
)
def listar_muestras():
    return servicio_muestras.listar_todas()