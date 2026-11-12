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
from app.servicios.veterinario_servicio import servicio_veterinarios
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


# --- ENDPOINTS DE VETERINARIOS ---

@router.get("/veterinarios")
def listar_veterinarios(
    usuario_actual: dict = Depends(obtener_usuario_actual),
):
    return servicio_veterinarios.listar_veterinarios()


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
    try:
        # El cliente no necesita elegir veterinario; si no viene, pasa como None
        id_vet = getattr(datos, "id_veterinario", None)
        turno_creado = servicio_turnos.agendar_turno(
            id_veterinario=id_vet,
            id_mascota=datos.id_mascota,
            fecha_hora=datos.fecha_hora,
            motivo=datos.motivo,
            servicio=datos.servicio,
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
    """
    Actualiza el estado del turno. Si pasa a 'atendido', asigna automáticamente
    como veterinario actuante al usuario que tiene la sesión iniciada.
    """
    conn = DatabaseSingleton().get_conexion()
    cursor = conn.cursor()

    turno = cursor.execute(
        "SELECT id_turno, veterinario_id FROM turnos WHERE id_turno = ?",
        (id_turno,),
    ).fetchone()
    if not turno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe el turno con ID {id_turno}",
        )

    id_vet_asignado = turno["veterinario_id"]
    nuevo_estado = getattr(datos.estado, "value", str(datos.estado))

    nombre_usuario = (
        usuario_actual.get("usuario")
        or usuario_actual.get("sub")
        or usuario_actual.get("username")
        or usuario_actual.get("nombre_usuario")
    )

    # Si el turno se marca como 'atendido', registramos qué veterinario lo atendió
    if nuevo_estado == "atendido":
        id_vet_sesion = usuario_actual.get("id_veterinario") or usuario_actual.get("veterinario_id")
        if id_vet_sesion:
            id_vet_asignado = id_vet_sesion
        elif nombre_usuario:
            fila_usr = cursor.execute(
                "SELECT id_veterinario, matricula FROM usuarios WHERE usuario = ?",
                (nombre_usuario,),
            ).fetchone()
            if fila_usr and fila_usr["id_veterinario"]:
                id_vet_asignado = fila_usr["id_veterinario"]
            elif fila_usr and fila_usr["matricula"]:
                fila_vet = cursor.execute(
                    "SELECT id_veterinario FROM veterinarios WHERE matricula = ?",
                    (fila_usr["matricula"],),
                ).fetchone()
                if fila_vet:
                    id_vet_asignado = fila_vet["id_veterinario"]

    cursor.execute(
        "UPDATE turnos SET estado = ?, veterinario_id = ? WHERE id_turno = ?",
        (nuevo_estado, id_vet_asignado, id_turno),
    )
    conn.commit()

    vet_nombre = None
    if id_vet_asignado:
        fila_nombre = cursor.execute(
            "SELECT nombre || ' ' || apellido AS nombre_completo FROM veterinarios WHERE id_veterinario = ?",
            (id_vet_asignado,),
        ).fetchone()
        if fila_nombre:
            vet_nombre = fila_nombre["nombre_completo"]

    return {
        "mensaje": "Estado del turno actualizado",
        "id_turno": id_turno,
        "estado": nuevo_estado,
        "id_veterinario": id_vet_asignado,
        "atendido_por": vet_nombre or nombre_usuario,
    }


@router.get("/turnos/agenda")
def obtener_agenda(
    usuario_actual: dict = Depends(obtener_usuario_actual),
):
    try:
        # 1. Si usuario_actual ya tiene el id_veterinario, llamamos directo al DAO
        id_vet = usuario_actual.get("id_veterinario") or usuario_actual.get("veterinario_id")
        if id_vet:
            return servicio_turnos.turno_dao.obtener_agenda_veterinario(id_vet)

        # 2. Si no viene el id_vet directo, buscamos el nombre de usuario
        nombre_usuario = (
            usuario_actual.get("usuario")
            or usuario_actual.get("sub")
            or usuario_actual.get("username")
            or usuario_actual.get("nombre_usuario")
        )

        if not nombre_usuario:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"No se pudo identificar el usuario en la sesión: {usuario_actual}",
            )

        return servicio_turnos.obtener_agenda_veterinario(nombre_usuario=nombre_usuario)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener la agenda: {str(e)}",
        )