from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.esquemas.mascotas import (
    MascotaCrear,
    MascotaActualizar,
    MascotaRespuesta,
)
from app.servicios.clinica_servicio import servicio_clinica
from app.rutas.dependencias import obtener_usuario_actual, requerir_rol

router = APIRouter(prefix="/api/clinica", tags=["Clientes y Mascotas"])


# --- ENDPOINTS DE CLIENTES ---

@router.post("/clientes", status_code=status.HTTP_201_CREATED)
def crear_cliente(
    datos: dict,
    usuario_actual: dict = Depends(obtener_usuario_actual),
):
    try:
        return servicio_clinica.registrar_cliente(datos)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/clientes")
def listar_clientes(
    incluir_inactivos: bool = Query(
        default=False,
        description="Si es True, incluye también los clientes dados de baja lógicamente",
    ),
    usuario_actual: dict = Depends(requerir_rol(["veterinario", "admin"])),
):
    return servicio_clinica.listar_clientes(incluir_inactivos=incluir_inactivos)


@router.delete(
    "/clientes/{id_cliente}",
    dependencies=[Depends(requerir_rol(["veterinario", "admin"]))],
)
def dar_baja_logica_cliente(id_cliente: int):
    """
    Realiza la baja lógica del cliente y sus mascotas asociadas (activo = 0)
    sin eliminar los registros físicos de la base de datos.
    """
    try:
        cliente = servicio_clinica.dar_baja_cliente(id_cliente)
        return {
            "mensaje": f"Cliente {id_cliente} dado de baja lógicamente (registro conservado en BD).",
            "cliente": cliente,
        }
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# --- ENDPOINTS DE MASCOTAS ---

@router.post(
    "/mascotas",
    response_model=MascotaRespuesta,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(obtener_usuario_actual)],
)
def registrar_mascota(datos: MascotaCrear):
    try:
        return servicio_clinica.registrar_mascota(datos)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch(
    "/mascotas/{id_mascota}",
    response_model=MascotaRespuesta,
    dependencies=[Depends(requerir_rol(["veterinario", "admin"]))],
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
    dependencies=[Depends(requerir_rol(["veterinario", "admin"]))],
)
def cambiar_duenio_mascota(id_mascota: int, nuevo_id_cliente: int):
    try:
        return servicio_clinica.cambiar_duenio_mascota(id_mascota, nuevo_id_cliente)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/mascotas/{id_mascota}",
    dependencies=[Depends(requerir_rol(["veterinario", "admin"]))],
)
def dar_baja_logica_mascota(id_mascota: int):
    """
    Realiza la baja lógica de la mascota (activo = 0) conservando su historia clínica en la BD.
    """
    try:
        mascota = servicio_clinica.dar_baja_mascota(id_mascota)
        return {
            "mensaje": f"Mascota {id_mascota} dada de baja lógicamente (historia clínica conservada en BD).",
            "mascota": mascota,
        }
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get(
    "/clientes/{id_cliente}/mascotas",
    response_model=list[MascotaRespuesta],
    dependencies=[Depends(obtener_usuario_actual)],
)
def listar_mascotas_por_cliente(
    id_cliente: int,
    incluir_inactivos: bool = Query(default=False),
):
    try:
        return servicio_clinica.listar_mascotas_por_cliente(
            id_cliente, incluir_inactivos=incluir_inactivos
        )
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get(
    "/mascotas/{id_mascota}",
    response_model=MascotaRespuesta,
    dependencies=[Depends(obtener_usuario_actual)],
)
def obtener_mascota(id_mascota: int):
    try:
        return servicio_clinica.obtener_mascota(id_mascota)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))