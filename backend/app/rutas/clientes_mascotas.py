from fastapi import APIRouter, Depends, HTTPException, status
from app.esquemas.mascotas import (
    MascotaCrear,
    MascotaActualizar,
    MascotaRespuesta
)
from app.servicios.clinica_servicio import servicio_clinica
from app.rutas.dependencias import obtener_usuario_actual, requerir_rol

router = APIRouter(prefix="/api/clinica", tags=["Clientes y Mascotas"])


# --- ENDPOINTS DE CLIENTES ---

@router.post("/clientes", status_code=status.HTTP_201_CREATED)
def crear_cliente(
    datos: dict,
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    try:
        return servicio_clinica.registrar_cliente(datos)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/clientes")
def listar_clientes(
    usuario_actual: dict = Depends(requerir_rol(["veterinario", "admin"]))
):
    return servicio_clinica.listar_clientes()


# --- ENDPOINTS DE MASCOTAS ---

@router.post(
    "/mascotas",
    response_model=MascotaRespuesta,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(obtener_usuario_actual)]
)
def registrar_mascota(datos: MascotaCrear):
    try:
        return servicio_clinica.registrar_mascota(datos)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch(
    "/mascotas/{id_mascota}",
    response_model=MascotaRespuesta,
    dependencies=[Depends(requerir_rol(["veterinario", "admin"]))]
)
def actualizar_mascota(id_mascota: int, datos: MascotaActualizar):
    try:
        return servicio_clinica.actualizar_mascota(id_mascota, datos)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put(
    "/mascotas/{id_mascota}/duenio/{nuevo_id_cliente}",
    response_model=MascotaRespuesta,
    dependencies=[Depends(requerir_rol(["veterinario", "admin"]))]
)
def cambiar_duenio_mascota(id_mascota: int, nuevo_id_cliente: int):
    try:
        return servicio_clinica.cambiar_duenio_mascota(id_mascota, nuevo_id_cliente)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/clientes/{id_cliente}/mascotas",
    response_model=list[MascotaRespuesta],
    dependencies=[Depends(obtener_usuario_actual)]
)
def listar_mascotas_por_cliente(id_cliente: int):
    try:
        return servicio_clinica.listar_mascotas_por_cliente(id_cliente)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get(
    "/mascotas/{id_mascota}",
    response_model=MascotaRespuesta,
    dependencies=[Depends(obtener_usuario_actual)]
)
def obtener_mascota(id_mascota: int):
    try:
        return servicio_clinica.obtener_mascota(id_mascota)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))