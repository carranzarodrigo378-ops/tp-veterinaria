from fastapi import APIRouter, Depends, HTTPException, status
from app.esquemas.clinicas import ClinicaCrear, ClinicaActualizar, ClinicaRespuesta
from app.esquemas.laboratorio import LaboratorioCrear, LaboratorioActualizar, LaboratorioRespuesta
from app.esquemas.contenedor import ContenedorCrear, ContenedorActualizar, ContenedorRespuesta
from app.esquemas.tipoanalisis import TipoAnalisisCrear, TipoAnalisisActualizar, TipoAnalisisRespuesta
from app.servicios.infraestructura_servicio import servicio_infraestructura
from app.rutas.dependencias import requerir_rol, obtener_usuario_actual

router = APIRouter(prefix="/api/infraestructura", tags=["Infraestructura y Catálogos"])


# --- CLÍNICAS ---
@router.post(
    "/clinicas",
    response_model=ClinicaRespuesta,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requerir_rol(["admin"]))],
)
def crear_clinica(datos: ClinicaCrear):
    return servicio_infraestructura.crear_clinica(datos)


@router.get(
    "/clinicas",
    response_model=list[ClinicaRespuesta],
    dependencies=[Depends(obtener_usuario_actual)],
)
def listar_clinicas():
    return servicio_infraestructura.listar_clinicas()


@router.patch(
    "/clinicas/{id_clinica}",
    response_model=ClinicaRespuesta,
    dependencies=[Depends(requerir_rol(["admin"]))],
)
def actualizar_clinica(id_clinica: int, datos: ClinicaActualizar):
    try:
        return servicio_infraestructura.actualizar_clinica(id_clinica, datos)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# --- LABORATORIOS ---
@router.post(
    "/laboratorios",
    response_model=LaboratorioRespuesta,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requerir_rol(["admin"]))],
)
def crear_laboratorio(datos: LaboratorioCrear):
    return servicio_infraestructura.crear_laboratorio(datos)


@router.get(
    "/laboratorios",
    response_model=list[LaboratorioRespuesta],
    dependencies=[Depends(obtener_usuario_actual)],
)
def listar_laboratorios():
    return servicio_infraestructura.listar_laboratorios()


@router.patch(
    "/laboratorios/{id_laboratorio}",
    response_model=LaboratorioRespuesta,
    dependencies=[Depends(requerir_rol(["admin"]))],
)
def actualizar_laboratorio(id_laboratorio: int, datos: LaboratorioActualizar):
    try:
        return servicio_infraestructura.actualizar_laboratorio(id_laboratorio, datos)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# --- CONTENEDORES ---
@router.post(
    "/contenedores",
    response_model=ContenedorRespuesta,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requerir_rol(["admin", "veterinario"]))],
)
def crear_contenedor(datos: ContenedorCrear):
    return servicio_infraestructura.crear_contenedor(datos)


@router.get(
    "/contenedores",
    response_model=list[ContenedorRespuesta],
    dependencies=[Depends(obtener_usuario_actual)],
)
def listar_contenedores():
    return servicio_infraestructura.listar_contenedores()


@router.patch(
    "/contenedores/{id_contenedor}",
    response_model=ContenedorRespuesta,
    dependencies=[Depends(requerir_rol(["admin", "veterinario"]))],
)
def actualizar_contenedor(id_contenedor: int, datos: ContenedorActualizar):
    try:
        return servicio_infraestructura.actualizar_contenedor(id_contenedor, datos)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# --- TIPOS DE ANÁLISIS ---
@router.post(
    "/tipos-analisis",
    response_model=TipoAnalisisRespuesta,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requerir_rol(["admin"]))],
)
def crear_tipo_analisis(datos: TipoAnalisisCrear):
    try:
        return servicio_infraestructura.crear_tipo_analisis(datos)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/tipos-analisis",
    response_model=list[TipoAnalisisRespuesta],
    dependencies=[Depends(obtener_usuario_actual)],
)
def listar_tipos_analisis():
    return servicio_infraestructura.listar_tipos_analisis()


@router.patch(
    "/tipos-analisis/{id_tipo_analisis}",
    response_model=TipoAnalisisRespuesta,
    dependencies=[Depends(requerir_rol(["admin"]))],
)
def actualizar_tipo_analisis(id_tipo_analisis: int, datos: TipoAnalisisActualizar):
    try:
        return servicio_infraestructura.actualizar_tipo_analisis(id_tipo_analisis, datos)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))