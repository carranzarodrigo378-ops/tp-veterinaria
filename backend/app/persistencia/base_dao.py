import sqlite3

from app.persistencia.conexion import DatabaseSingleton
from app.persistencia.excepciones import CampoObligatorioError


class BaseDAO:
    TABLA: str = ""                      # nombre de la tabla
    PK: str = ""                         # nombre de la clave primaria
    COLUMNAS_EDITABLES: set[str] = set() # lista blanca para actualizar

    def __init__(self):
        self.db = DatabaseSingleton()

    # ---------- traducción de errores ----------

    def _traducir_integridad(self, e: sqlite3.IntegrityError) -> ValueError:
        """Cada DAO puede sobrescribirlo para sumar sus casos (UNIQUE, FK)."""
        mensaje = str(e)
        if "NOT NULL" in mensaje:
            columna = mensaje.split(".")[-1]
            return CampoObligatorioError(f"El campo '{columna}' es obligatorio")
        if "FOREIGN KEY" in mensaje:
            return ValueError("Referencia a un registro inexistente o con dependencias")
        return ValueError("Los datos violan una restricción")

    # ---------- operaciones genéricas ----------

    def _insertar(self, datos: dict) -> int:
        conn = self.db.get_conexion()
        columnas = ", ".join(datos)
        marcadores = ", ".join("?" for _ in datos)
        try:
            cursor = conn.execute(
                f"INSERT INTO {self.TABLA} ({columnas}) VALUES ({marcadores})",
                tuple(datos.values()),
            )
            conn.commit()
        except sqlite3.IntegrityError as e:
            conn.rollback()
            raise self._traducir_integridad(e) from e
        return cursor.lastrowid

    def _actualizar(self, id_: int, datos: dict) -> bool:
        campos = {k: v for k, v in datos.items() if k in self.COLUMNAS_EDITABLES}
        if not campos:
            raise ValueError("No se enviaron campos para actualizar")
        conn = self.db.get_conexion()
        asignaciones = ", ".join(f"{col} = ?" for col in campos)
        try:
            cursor = conn.execute(
                f"UPDATE {self.TABLA} SET {asignaciones} WHERE {self.PK} = ?",
                [*campos.values(), id_],
            )
            conn.commit()
        except sqlite3.IntegrityError as e:
            conn.rollback()
            raise self._traducir_integridad(e) from e
        return cursor.rowcount > 0

    def obtener_todos(self, limite: int = 100, offset: int = 0) -> list[dict]:
        cursor = self.db.get_conexion().execute(
            f"SELECT * FROM {self.TABLA} ORDER BY {self.PK} LIMIT ? OFFSET ?",
            (limite, offset),
        )
        return [dict(fila) for fila in cursor.fetchall()]

    def obtener_por_id(self, id_: int) -> dict | None:
        cursor = self.db.get_conexion().execute(
            f"SELECT * FROM {self.TABLA} WHERE {self.PK} = ?", (id_,)
        )
        fila = cursor.fetchone()
        return dict(fila) if fila else None

    def existe(self, id_: int) -> bool:
        cursor = self.db.get_conexion().execute(
            f"SELECT 1 FROM {self.TABLA} WHERE {self.PK} = ?", (id_,)
        )
        return cursor.fetchone() is not None

    def eliminar(self, id_: int) -> bool:
        conn = self.db.get_conexion()
        try:
            cursor = conn.execute(
                f"DELETE FROM {self.TABLA} WHERE {self.PK} = ?", (id_,)
            )
            conn.commit()
        except sqlite3.IntegrityError as e:
            conn.rollback()
            raise ValueError("No se puede eliminar: tiene registros asociados") from e
        return cursor.rowcount > 0