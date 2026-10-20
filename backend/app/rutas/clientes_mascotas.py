from fastapi import APIRouter, Depends, HTTPException, status
from app.rutas.dependencias import obtener_usuario_actual, requerir_rol
from app.servicios.clinica_servicio import servicio_clinica

router = APIRouter(prefix="/api/clinica", tags=["Clientes y Mascotas"])


@router.post("/clientes", status_code=status.HTTP_201_CREATED)
def crear_cliente(
    datos: dict,
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    try:
        nuevo_cliente = servicio_clinica.registrar_cliente(datos)
        return nuevo_cliente
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/clientes")
def listar_clientes(
    usuario_actual: dict = Depends(requerir_rol(["veterinario", "admin"]))
):
    return servicio_clinica.listar_clientes()


# Tanto el cliente como el veterinario pueden registrar una mascota
@router.post("/mascotas", status_code=status.HTTP_201_CREATED)
def registrar_mascota(
    datos: dict,
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    try:
        nueva_mascota = servicio_clinica.registrar_mascota(datos)
        return nueva_mascota
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# Solo el veterinario o el admin pueden completar/modificar datos clínicos de la mascota
@router.patch("/mascotas/{id_mascota}/ficha-clinica")
def actualizar_ficha_clinica(
    id_mascota: int,
    datos: dict,
    usuario_actual: dict = Depends(requerir_rol(["veterinario", "admin"]))
):
    try:
        mascota_actualizada = servicio_clinica.actualizar_ficha_medica(id_mascota, datos)
        return mascota_actualizada
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/mascotas/{id_mascota}/duenio/{nuevo_id_cliente}")
def cambiar_duenio_mascota(
    id_mascota: int,
    nuevo_id_cliente: int,
    usuario_actual: dict = Depends(requerir_rol(["veterinario", "admin"]))
):
    try:
        mascota_actualizada = servicio_clinica.cambiar_duenio_mascota(id_mascota, nuevo_id_cliente)
        return mascota_actualizada
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/clientes/{id_cliente}/mascotas")
def listar_mascotas_por_cliente(
    id_cliente: int,
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    return servicio_clinica.listar_mascotas_por_cliente(id_cliente)