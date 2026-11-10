from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from app.esquemas.mascotas import (
    MascotaCrear,
    MascotaActualizar,
    MascotaRespuesta,
)
from app.esquemas.turnos import TurnoPeticion, TurnoEstadoActualizar
from app.esquemas.enums import EstadoTurno
from app.servicios.clinica_servicio import servicio_clinica
from app.servicios.turnos_servicio import servicio_turnos
from app.persistencia.conexion import DatabaseSingleton
from app.rutas.dependencias import obtener_usuario_actual, requerir_rol

router = APIRouter(prefix="/api/clinica", tags=["Clientes, Mascotas y Turnos"])

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
    try:
        cliente = servicio_clinica.dar_baja_cliente(id_cliente)
        return {
            "mensaje": f"Cliente {id_cliente} dado de baja lógicamente (registro conservado en BD).",
            "cliente": cliente,
        }
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# --- ENDPOINTS DE MASCOTAS ---

@router.get(
    "/mascotas",
    response_model=list[MascotaRespuesta],
    dependencies=[Depends(obtener_usuario_actual)],
)
def listar_todas_las_mascotas(
    incluir_inactivos: bool = Query(
        default=False,
        description="Si es True, incluye también las mascotas dadas de baja lógicamente",
    ),
):
    return servicio_clinica.listar_mascotas(incluir_inactivos=incluir_inactivos)

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
    try:
        mascota = servicio_clinica.dar_baja_mascota(id_mascota)
        return {
            "mensaje": f"Mascota {id_mascota} dada de baja lógicamente.",
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


# --- ENDPOINTS DE TURNOS ---

@router.get("/turnos")
def listar_turnos(
    usuario_actual: dict = Depends(obtener_usuario_actual),
):
    """
    Lista los turnos registrados. (Delega en el servicio).
    """
    return servicio_turnos.listar_turnos()

@router.post("/turnos", status_code=status.HTTP_201_CREATED)
def programar_turno(
    datos: TurnoPeticion,
    usuario_actual: dict = Depends(obtener_usuario_actual),
):
    """
    Registra un nuevo turno. Toda la lógica y control de superposición 
    es manejada por el servicio_turnos y TurnoDAO.
    """
    try:
        turno_creado = servicio_turnos.agendar_turno(
            id_veterinario=datos.id_veterinario,
            id_mascota=datos.id_mascota,
            fecha_hora=datos.fecha_hora
        )
        return turno_creado
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

@router.patch("/turnos/{id_turno}/estado")
def cambiar_estado_turno(
    id_turno: int,
    datos: TurnoEstadoActualizar,
    usuario_actual: dict = Depends(obtener_usuario_actual),
):
    # NOTA: Para mantener la limpieza, te sugiero en el futuro mover 
    # este UPDATE de SQL que pasaste en tu versión anterior también al servicio_turnos. 
    # Por ahora se deja interactuando con el DAO o servicio si lo configuraste ahí.
    conn = DatabaseSingleton().get_conexion()
    cursor = conn.execute(
        "UPDATE turnos SET estado = ? WHERE id_turno = ?",
        (datos.estado.value, id_turno),
    )
    conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe el turno con ID {id_turno}",
        )
    return {
        "mensaje": "Estado del turno actualizado",
        "id_turno": id_turno,
        "estado": datos.estado.value,
    }