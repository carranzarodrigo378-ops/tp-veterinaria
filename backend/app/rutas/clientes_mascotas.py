from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from app.esquemas.mascotas import (
    MascotaCrear,
    MascotaActualizar,
    MascotaRespuesta,
)
from app.esquemas.enums import EstadoTurno
from app.servicios.clinica_servicio import servicio_clinica
from app.persistencia.conexion import DatabaseSingleton
from app.rutas.dependencias import obtener_usuario_actual, requerir_rol

router = APIRouter(prefix="/api/clinica", tags=["Clientes, Mascotas y Turnos"])


# --- ESQUEMAS LOCALES PARA TURNOS ---

class TurnoCrear(BaseModel):
    id_mascota: int
    id_veterinario: int
    id_clinica: int = 1
    fecha_hora: str  # Ej: "2026-11-15 10:30" o "2026-11-15T10:30"
    motivo: str


class TurnoEstadoActualizar(BaseModel):
    estado: EstadoTurno


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


# --- ENDPOINTS DE TURNOS ---

@router.get("/turnos")
def listar_turnos(
    veterinario_id: int | None = Query(
        default=None, description="Filtrar turnos de un veterinario específico"
    ),
    id_mascota: int | None = Query(
        default=None, description="Filtrar turnos de una mascota específica"
    ),
    fecha: str | None = Query(
        default=None, description="Filtrar por día YYYY-MM-DD"
    ),
    estado: str | None = Query(
        default=None, description="programado, atendido o cancelado"
    ),
    usuario_actual: dict = Depends(obtener_usuario_actual),
):
    """
    Lista los turnos registrados con los datos de mascota, dueño, veterinario y clínica.
    """
    conn = DatabaseSingleton().get_conexion()
    query = """
        SELECT 
            t.id_turno,
            t.fecha_hora,
            t.motivo,
            t.estado,
            t.mascota_id AS id_mascota,
            m.nombre AS mascota_nombre,
            m.especie,
            c.id_cliente,
            c.nombre || ' ' || c.apellido AS cliente_nombre,
            t.veterinario_id AS id_veterinario,
            v.nombre || ' ' || v.apellido AS veterinario_nombre,
            t.clinica_id AS id_clinica,
            cl.nombre AS clinica_nombre
        FROM turnos t
        JOIN mascotas m ON t.mascota_id = m.id_mascota
        JOIN clientes c ON m.id_cliente = c.id_cliente
        JOIN veterinarios v ON t.veterinario_id = v.id_veterinario
        JOIN clinicas cl ON t.clinica_id = cl.id_clinica
        WHERE 1=1
    """
    params: list = []

    if veterinario_id is not None:
        query += " AND t.veterinario_id = ?"
        params.append(veterinario_id)

    if id_mascota is not None:
        query += " AND t.mascota_id = ?"
        params.append(id_mascota)

    if fecha:
        query += " AND date(t.fecha_hora) = date(?)"
        params.append(fecha)

    if estado:
        query += " AND t.estado = ?"
        params.append(estado)

    query += " ORDER BY t.fecha_hora ASC"

    cursor = conn.execute(query, tuple(params))
    return [dict(fila) for fila in cursor.fetchall()]


@router.post("/turnos", status_code=status.HTTP_201_CREATED)
def programar_turno(
    datos: TurnoCrear,
    usuario_actual: dict = Depends(obtener_usuario_actual),
):
    """
    Registra un nuevo turno verificando que la mascota esté activa y que el
    veterinario no tenga otro turno superpuesto en el mismo horario.
    """
    conn = DatabaseSingleton().get_conexion()
    cursor = conn.cursor()

    mascota = cursor.execute(
        "SELECT id_mascota FROM mascotas WHERE id_mascota = ? AND activo = 1",
        (datos.id_mascota,),
    ).fetchone()
    if not mascota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La mascota indicada no existe o está dada de baja.",
        )

    superpuesto = cursor.execute(
        """
        SELECT id_turno FROM turnos 
        WHERE veterinario_id = ? 
          AND fecha_hora = ? 
          AND estado = 'programado'
        """,
        (datos.id_veterinario, datos.fecha_hora),
    ).fetchone()

    if superpuesto:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El veterinario seleccionado ya tiene un turno programado en ese horario.",
        )

    cursor.execute(
        """
        INSERT INTO turnos (mascota_id, veterinario_id, clinica_id, fecha_hora, motivo, estado)
        VALUES (?, ?, ?, ?, ?, 'programado')
        """,
        (
            datos.id_mascota,
            datos.id_veterinario,
            datos.id_clinica,
            datos.fecha_hora,
            datos.motivo,
        ),
    )
    conn.commit()
    id_turno = cursor.lastrowid

    return {
        "id_turno": id_turno,
        "id_mascota": datos.id_mascota,
        "id_veterinario": datos.id_veterinario,
        "id_clinica": datos.id_clinica,
        "fecha_hora": datos.fecha_hora,
        "motivo": datos.motivo,
        "estado": "programado",
    }


@router.patch("/turnos/{id_turno}/estado")
def cambiar_estado_turno(
    id_turno: int,
    datos: TurnoEstadoActualizar,
    usuario_actual: dict = Depends(obtener_usuario_actual),
):
    """
    Permite actualizar el estado de un turno a 'programado', 'atendido' o 'cancelado'.
    """
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