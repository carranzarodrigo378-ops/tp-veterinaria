from fastapi import APIRouter, Depends, HTTPException, status
from app.rutas.dependencias import obtener_usuario_actual
from app.esquemas.muestras import (
    MuestraCrear,
    MuestraEmpaquetar,
    MuestraDespachar,
    MuestraRecepcion,
    MuestraAnalizar,
    MuestraDetalleRespuesta
)
from app.servicios.muestras_servicio import servicio_muestras
from app.dominio.estados import ExcepcionTransicionEstado

router = APIRouter(prefix="/api/muestras", tags=["Muestras y Laboratorio"])


def _serializar_muestra(muestra):
    """Convierte el objeto del modelo de dominio a la estructura que espera Pydantic."""
    return {
        "id_muestra": muestra.id_muestra,
        "codigo_etiqueta": muestra.codigo_etiqueta,
        "id_orden_derivacion": muestra.id_orden_derivacion,
        "tipo_muestra": muestra.tipo_muestra,
        "estado_actual": muestra.estado.nombre,
        "id_conservadora": muestra.id_conservadora,
        "nro_precinto": muestra.nro_precinto,
        "transporte_info": muestra.transporte_info,
        "id_resultado": muestra.id_resultado,
        "historial_trazabilidad": muestra.obtener_trazabilidad_completa()
    }


@router.post("/", response_model=MuestraDetalleRespuesta, status_code=status.HTTP_201_CREATED)
def registrar_toma_muestra(
    datos: MuestraCrear,
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    try:
        muestra = servicio_muestras.registrar_muestra(
            codigo_etiqueta=datos.codigo_etiqueta,
            id_orden_derivacion=datos.id_orden_derivacion,
            tipo_muestra=datos.tipo_muestra
        )
        return _serializar_muestra(muestra)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{id_muestra}/empaquetar", response_model=MuestraDetalleRespuesta)
def empaquetar_muestra(
    id_muestra: int,
    datos: MuestraEmpaquetar,
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    try:
        muestra = servicio_muestras.empaquetar_muestra(
            id_muestra=id_muestra,
            id_conservadora=datos.id_conservadora,
            nro_precinto=datos.nro_precinto
        )
        return _serializar_muestra(muestra)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ExcepcionTransicionEstado as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{id_muestra}/despachar", response_model=MuestraDetalleRespuesta)
def despachar_muestra(
    id_muestra: int,
    datos: MuestraDespachar,
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    try:
        muestra = servicio_muestras.despachar_muestra(
            id_muestra=id_muestra,
            transporte_info=datos.transporte_info
        )
        return _serializar_muestra(muestra)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ExcepcionTransicionEstado as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{id_muestra}/recibir", response_model=MuestraDetalleRespuesta)
def recibir_muestra_en_laboratorio(
    id_muestra: int,
    datos: MuestraRecepcion,
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    try:
        # Si el precinto no está intacto, el State la rechaza automáticamente
        muestra = servicio_muestras.recibir_muestra_en_laboratorio(
            id_muestra=id_muestra,
            precinto_intacto=datos.precinto_intacto,
            observaciones=datos.observaciones
        )
        return _serializar_muestra(muestra)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ExcepcionTransicionEstado as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{id_muestra}/analizar", response_model=MuestraDetalleRespuesta)
def registrar_analisis_muestra(
    id_muestra: int,
    datos: MuestraAnalizar,
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    try:
        muestra = servicio_muestras.registrar_analisis(
            id_muestra=id_muestra,
            resultado_id=datos.resultado_id
        )
        return _serializar_muestra(muestra)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ExcepcionTransicionEstado as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{id_muestra}", response_model=MuestraDetalleRespuesta)
def obtener_muestra_con_trazabilidad(
    id_muestra: int,
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    try:
        muestra = servicio_muestras.obtener_por_id(id_muestra)
        return _serializar_muestra(muestra)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))