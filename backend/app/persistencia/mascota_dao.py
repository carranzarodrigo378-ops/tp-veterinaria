import sqlite3

from app.persistencia.conexion import DatabaseSingleton
from app.esquemas.mascotas import MascotaCrear


class MascotaDAO:
    def __init__(self):
        self.db = DatabaseSingleton()

    def crear(self, mascota: MascotaCrear) -> int:
        conn = self.db.get_conexion()
        query = """
            INSERT INTO mascotas
                (nombre, especie, raza, sexo, fecha_nacimiento, id_cliente)
            VALUES (?, ?, ?, ?, ?, ?)
        """
        try:
            cursor = conn.execute(query, (
                mascota.nombre,
                mascota.especie,
                mascota.raza,
                mascota.sexo.value,
                mascota.fecha_nacimiento.isoformat() if mascota.fecha_nacimiento else None,
                mascota.id_cliente,
            ))
            conn.commit()
        except sqlite3.IntegrityError:
            conn.rollback()
            raise ValueError("El cliente responsable no existe")
        return cursor.lastrowid

    def obtener_todas(self) -> list[dict]:
        cursor = self.db.get_conexion().execute("SELECT * FROM mascotas")
        return [dict(fila) for fila in cursor.fetchall()]

    def obtener_por_id(self, id_mascota: int) -> dict | None:
        cursor = self.db.get_conexion().execute(
            "SELECT * FROM mascotas WHERE id_mascota = ?", (id_mascota,)
        )
        fila = cursor.fetchone()
        return dict(fila) if fila else None

    def obtener_por_cliente(self, id_cliente: int) -> list[dict]:
        cursor = self.db.get_conexion().execute(
            "SELECT * FROM mascotas WHERE id_cliente = ?", (id_cliente,)
        )
        return [dict(fila) for fila in cursor.fetchall()]