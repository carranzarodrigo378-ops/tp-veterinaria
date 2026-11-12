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


# =========================================================================
# 1. ETAPA CLÍNICA: EXTRACCIÓN, EMPAQUETADO Y ENVÍO (VETERINARIO Y ADMIN)
# =========================================================================

@router.post(
    "/",
    response_model=MuestraDetalleRespuesta,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requerir_rol(["veterinario", "admin"]))],
)
def crear_muestra(
    datos: MuestraCrear,
    usuario_actual: dict = Depends(obtener_usuario_actual),
):
    try:
        username = usuario_actual.get("sub") or usuario_actual.get("usuario")
        return servicio_muestras.registrar_extraccion(datos, usuario=username)
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
    usuario_actual: dict = Depends(obtener_usuario_actual),
):
    try:
        username = usuario_actual.get("sub") or usuario_actual.get("usuario")
        return servicio_muestras.empaquetar(id_muestra, datos, usuario=username)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ExcepcionTransicionEstado as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post(
    "/{id_muestra}/despachar",
    response_model=MuestraDetalleRespuesta,
    dependencies=[Depends(requerir_rol(["veterinario", "admin"]))],
)
def despachar_muestra(
    id_muestra: int,
    datos: MuestraDespachar,
    usuario_actual: dict = Depends(obtener_usuario_actual),
):
    try:
        username = usuario_actual.get("sub") or usuario_actual.get("usuario")
        return servicio_muestras.despachar(id_muestra, datos, usuario=username)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ExcepcionTransicionEstado as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


# =========================================================================
# 2. ETAPA LABORATORIO CENTRAL: RECEPCIÓN, CONTROL DE PRECINTO Y ANÁLISIS
# =========================================================================

@router.post(
    "/{id_muestra}/recibir",
    response_model=MuestraDetalleRespuesta,
    dependencies=[Depends(requerir_rol(["laboratorio"]))],
)
def recibir_muestra_en_laboratorio(
    id_muestra: int,
    datos: MuestraRecepcion,
    usuario_actual: dict = Depends(obtener_usuario_actual),
):
    """
    El usuario con rol 'laboratorio' recibe la muestra que estaba 'en_transito'.
    Si marca estado_precinto = 'roto', el sistema la rechaza automáticamente.
    """
    try:
        username = usuario_actual.get("sub") or usuario_actual.get("usuario")
        return servicio_muestras.recibir_en_laboratorio(id_muestra, datos, usuario=username)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ExcepcionTransicionEstado as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post(
    "/{id_muestra}/analizar",
    response_model=MuestraDetalleRespuesta,
    dependencies=[Depends(requerir_rol(["laboratorio"]))],
)
def registrar_analisis_muestra(
    id_muestra: int,
    datos: MuestraAnalizar,
    usuario_actual: dict = Depends(obtener_usuario_actual),
):
    """
    El usuario con rol 'laboratorio' carga el resultado del estudio y lo envía
    de vuelta a la clínica, pasando la muestra a estado 'analizada'.
    """
    try:
        username = usuario_actual.get("sub") or usuario_actual.get("usuario")
        return servicio_muestras.registrar_analisis(id_muestra, datos, usuario=username)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ExcepcionTransicionEstado as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


# =========================================================================
# 3. CONSULTAS Y SEGUIMIENTO DE TRAZABILIDAD (CLÍNICA Y LABORATORIO)
# =========================================================================

@router.get(
    "/remitos/listado",
    dependencies=[Depends(obtener_usuario_actual)],
)
def listar_remitos_biologicos():
    """
    Lista todos los remitos biológicos emitidos con su conservadora,
    precinto sanitario, estado de envío y cantidad de muestras.
    """
    return servicio_muestras.listar_remitos_biologicos()


@router.get(
    "/{id_muestra}/trazabilidad",
    dependencies=[Depends(obtener_usuario_actual)],
)
def obtener_trazabilidad_muestra(id_muestra: int):
    """
    Devuelve la cadena de custodia y trazabilidad histórica inmutable de una muestra.
    """
    try:
        return servicio_muestras.obtener_trazabilidad_detallada(id_muestra)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


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
)
def listar_muestras(usuario_actual: dict = Depends(obtener_usuario_actual)):
    rol = usuario_actual.get("rol")
    return servicio_muestras.listar_todas(rol=rol)