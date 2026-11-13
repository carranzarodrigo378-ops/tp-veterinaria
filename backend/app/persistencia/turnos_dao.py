import sqlite3
import threading
from datetime import datetime

from app.esquemas.enums import EstadoTurno
from app.esquemas.turnos import TurnoActualizar, TurnoCrear
from app.persistencia.base_dao import BaseDAO

FORMATO_FECHA = "%Y-%m-%d %H:%M:%S"


def _a_texto(valor) -> str:
    """Un único formato en toda la tabla: indispensable para comparar fechas como texto."""
    if isinstance(valor, datetime):
        return valor.strftime(FORMATO_FECHA)
    return str(valor)


class TurnoDAO(BaseDAO):
    TABLA = "turnos"
    PK = "id_turno"
    COLUMNAS_EDITABLES = {"fecha_hora_inicio", "fecha_hora_fin", "estado"}

    # Evita que dos pedidos simultáneos reserven el mismo horario
    _lock = threading.Lock()

    def _traducir_integridad(self, e: sqlite3.IntegrityError) -> ValueError:
        if "FOREIGN KEY" in str(e):
            return ValueError("El veterinario o la mascota indicados no existen")
        return super()._traducir_integridad(e)

    # ---------- escritura ----------

    def crear(self, turno: TurnoCrear) -> int:
        inicio = _a_texto(turno.fecha_hora_inicio)
        fin = _a_texto(turno.fecha_hora_fin)
        with self._lock:
            if self._hay_superposicion(turno.veterinario_id, inicio, fin):
                raise ValueError("El veterinario ya tiene un turno superpuesto en ese horario.")
            return self._insertar({
                "fecha_hora_inicio": inicio,
                "fecha_hora_fin": fin,
                "veterinario_id": turno.veterinario_id,
                "mascota_id": turno.mascota_id,
                "estado": EstadoTurno.programado.value,
                "motivo": turno.motivo,
                "servicio": turno.servicio,
            })

    def actualizar(self, id_turno: int, datos: TurnoActualizar) -> bool:
        cambios = datos.model_dump(exclude_unset=True)
        if not cambios:
            raise ValueError("No se enviaron campos para actualizar")

        with self._lock:
            actual = self.obtener_por_id(id_turno)
            if actual is None:
                return False

            # Valores finales = los nuevos si vinieron, los actuales si no
            inicio = _a_texto(cambios.get("fecha_hora_inicio", actual["fecha_hora_inicio"]))
            fin = _a_texto(cambios.get("fecha_hora_fin", actual["fecha_hora_fin"]))
            estado = cambios.get("estado", actual["estado"])
            estado = getattr(estado, "value", estado)

            if fin <= inicio:
                raise ValueError("La fecha de fin debe ser posterior a la de inicio")
            if estado != EstadoTurno.cancelado.value and self._hay_superposicion(
                actual["veterinario_id"], inicio, fin, excluir_id=id_turno
            ):
                raise ValueError("El veterinario ya tiene un turno superpuesto en ese horario.")

            normalizados = {}
            for clave, valor in cambios.items():
                normalizados[clave] = getattr(valor, "value", _a_texto(valor))
            return self._actualizar(id_turno, normalizados)

    def cancelar(self, id_turno: int) -> bool:
        return self.actualizar(id_turno, TurnoActualizar(estado=EstadoTurno.cancelado))

    # ---------- validación ----------

    def _hay_superposicion(self, vet_id: int, inicio: str, fin: str,
                           excluir_id: int | None = None) -> bool:
        query = """
            SELECT 1 FROM turnos
            WHERE veterinario_id = ? AND estado != 'cancelado'
              AND fecha_hora_inicio < ? AND fecha_hora_fin > ?
        """
        params = [vet_id, fin, inicio]
        if excluir_id is not None:
            query += " AND id_turno != ?"
            params.append(excluir_id)
        cursor = self.db.get_conexion().execute(query, tuple(params))
        return cursor.fetchone() is not None

    # ---------- consultas para el servicio ----------

    def obtener_todos_con_detalles(self, limite: int = 500, offset: int = 0) -> list[dict]:
        """Lista todos los turnos incluyendo datos de mascota, dueño y veterinario asignado."""
        cursor = self.db.get_conexion().execute(
            """
            SELECT 
                t.*,
                m.id_cliente AS id_cliente,
                COALESCE(m.nombre, 'Sin nombre') AS nombre_mascota,
                COALESCE(c.nombre || ' ' || c.apellido, 'Sin dueño asignado') AS nombre_cliente,
                v.nombre || ' ' || v.apellido AS nombre_veterinario
            FROM turnos t
            LEFT JOIN mascotas m ON m.id_mascota = t.mascota_id
            LEFT JOIN clientes c ON c.id_cliente = m.id_cliente
            LEFT JOIN veterinarios v ON v.id_veterinario = t.veterinario_id
            ORDER BY t.fecha_hora_inicio ASC
            LIMIT ? OFFSET ?
            """,
            (limite, offset),
        )
        return [dict(f) for f in cursor.fetchall()]

    def obtener_por_veterinario(self, veterinario_id: int) -> list[dict]:
        cursor = self.db.get_conexion().execute(
            "SELECT * FROM turnos WHERE veterinario_id = ? ORDER BY fecha_hora_inicio",
            (veterinario_id,),
        )
        return [dict(f) for f in cursor.fetchall()]

    def obtener_por_mascota(self, mascota_id: int) -> list[dict]:
        cursor = self.db.get_conexion().execute(
            "SELECT * FROM turnos WHERE mascota_id = ? ORDER BY fecha_hora_inicio",
            (mascota_id,),
        )
        return [dict(f) for f in cursor.fetchall()]

    def obtener_por_cliente(self, id_cliente: int) -> list[dict]:
        """Turnos de todas las mascotas de un cliente (para 'Mis turnos')."""
        cursor = self.db.get_conexion().execute(
            """
            SELECT t.* FROM turnos t
            JOIN mascotas m ON m.id_mascota = t.mascota_id
            WHERE m.id_cliente = ?
            ORDER BY t.fecha_hora_inicio
            """,
            (id_cliente,),
        )
        return [dict(f) for f in cursor.fetchall()]

    def obtener_agenda_veterinario(self, veterinario_id: int) -> list[dict]:
        """Agenda completa del veterinario con nombre de mascota, cliente y veterinario."""
        cursor = self.db.get_conexion().execute(
            """
            SELECT 
                t.*,
                m.id_cliente AS id_cliente,
                COALESCE(m.nombre, 'Sin nombre') AS nombre_mascota,
                COALESCE(c.nombre || ' ' || c.apellido, 'Sin dueño asignado') AS nombre_cliente,
                v.nombre || ' ' || v.apellido AS nombre_veterinario
            FROM turnos t
            LEFT JOIN mascotas m ON m.id_mascota = t.mascota_id
            LEFT JOIN clientes c ON c.id_cliente = m.id_cliente
            LEFT JOIN veterinarios v ON v.id_veterinario = t.veterinario_id
            WHERE t.veterinario_id = ?
            ORDER BY t.fecha_hora_inicio ASC
            """,
            (veterinario_id,),
        )
        return [dict(f) for f in cursor.fetchall()]

    def pertenece_a_cliente(self, id_turno: int, id_cliente: int) -> bool:
        cursor = self.db.get_conexion().execute(
            """
            SELECT 1 FROM turnos t
            JOIN mascotas m ON m.id_mascota = t.mascota_id
            WHERE t.id_turno = ? AND m.id_cliente = ?
            """,
            (id_turno, id_cliente),
        )
        return cursor.fetchone() is not None

    def obtener_ocupados(self, veterinario_id: int, desde: datetime, hasta: datetime) -> list[dict]:
        """Solo horarios ocupados, sin datos de mascotas: para mostrar disponibilidad al cliente."""
        cursor = self.db.get_conexion().execute(
            """
            SELECT fecha_hora_inicio, fecha_hora_fin FROM turnos
            WHERE veterinario_id = ? AND estado != 'cancelado'
              AND fecha_hora_inicio < ? AND fecha_hora_fin > ?
            ORDER BY fecha_hora_inicio
            """,
            (veterinario_id, _a_texto(hasta), _a_texto(desde)),
        )
        return [dict(f) for f in cursor.fetchall()]