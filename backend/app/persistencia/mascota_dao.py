import sqlite3

from app.esquemas.mascotas import MascotaActualizar, MascotaCrear
from app.persistencia.base_dao import BaseDAO
from app.persistencia.excepciones import ResponsableInexistenteError


class MascotaDAO(BaseDAO):
    TABLA = "mascotas"
    PK = "id_mascota"
    COLUMNAS_EDITABLES = {
        "nombre",
        "especie",
        "raza",
        "sexo",
        "fecha_nacimiento",
        "id_cliente",
        "activo",
    }

    def __init__(self):
        super().__init__()
        self._asegurar_columna_activo()

    def _asegurar_columna_activo(self):
        """Agrega la columna 'activo' para baja lógica si la tabla ya existía sin ella."""
        conn = self.db.get_conexion()
        try:
            conn.execute("ALTER TABLE mascotas ADD COLUMN activo BOOLEAN NOT NULL DEFAULT 1")
            conn.commit()
        except sqlite3.OperationalError:
            pass  # La columna ya existe

    def _traducir_integridad(self, e: sqlite3.IntegrityError) -> ValueError:
        if "FOREIGN KEY" in str(e):
            return ResponsableInexistenteError("El cliente responsable no existe")
        return super()._traducir_integridad(e)

    def crear(self, mascota: MascotaCrear) -> int:
        return self._insertar(mascota.model_dump(mode="json"))

    def actualizar(self, id_mascota: int, datos: MascotaActualizar) -> bool:
        return self._actualizar(
            id_mascota, datos.model_dump(mode="json", exclude_unset=True)
        )

    def eliminar(self, id_mascota: int) -> bool:
        """
        Baja lógica: no borra la mascota ni su historia clínica de la BD,
        solo actualiza activo = 0.
        """
        conn = self.db.get_conexion()
        cursor = conn.execute(
            "UPDATE mascotas SET activo = 0 WHERE id_mascota = ? AND activo = 1",
            (id_mascota,),
        )
        conn.commit()
        return cursor.rowcount > 0

    def reactivar(self, id_mascota: int) -> bool:
        """Permite dar de alta nuevamente una mascota dada de baja lógicamente."""
        conn = self.db.get_conexion()
        cursor = conn.execute(
            "UPDATE mascotas SET activo = 1 WHERE id_mascota = ?",
            (id_mascota,),
        )
        conn.commit()
        return cursor.rowcount > 0

    def existe(self, id_mascota: int, incluir_inactivos: bool = False) -> bool:
        filtro = "" if incluir_inactivos else "AND activo = 1"
        cursor = self.db.get_conexion().execute(
            f"SELECT 1 FROM mascotas WHERE id_mascota = ? {filtro}", (id_mascota,)
        )
        return cursor.fetchone() is not None

    def obtener_todos(
        self, limite: int = 100, offset: int = 0, incluir_inactivos: bool = False
    ) -> list[dict]:
        filtro = "" if incluir_inactivos else "WHERE activo = 1"
        cursor = self.db.get_conexion().execute(
            f"SELECT * FROM mascotas {filtro} ORDER BY id_mascota LIMIT ? OFFSET ?",
            (limite, offset),
        )
        return [dict(fila) for fila in cursor.fetchall()]

    def obtener_por_cliente(
        self, id_cliente: int, incluir_inactivos: bool = False
    ) -> list[dict]:
        filtro = "" if incluir_inactivos else "AND activo = 1"
        cursor = self.db.get_conexion().execute(
            f"SELECT * FROM mascotas WHERE id_cliente = ? {filtro}", (id_cliente,)
        )
        return [dict(fila) for fila in cursor.fetchall()]