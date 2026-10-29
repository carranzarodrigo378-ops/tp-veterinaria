import sqlite3

from app.esquemas.clientes import ClienteActualizar, ClienteCrear
from app.persistencia.base_dao import BaseDAO
from app.persistencia.excepciones import (
    ClienteConMascotasError,
    ClienteDuplicadoError,
)


class ClienteDAO(BaseDAO):
    TABLA = "clientes"
    PK = "id_cliente"
    COLUMNAS_EDITABLES = {
        "nombre",
        "apellido",
        "dni",
        "telefono",
        "email",
        "direccion",
        "activo",
    }

    def __init__(self):
        super().__init__()
        self._asegurar_columna_activo()

    def _asegurar_columna_activo(self):
        """Agrega la columna 'activo' para baja lógica si la tabla ya existía sin ella."""
        conn = self.db.get_conexion()
        try:
            conn.execute("ALTER TABLE clientes ADD COLUMN activo BOOLEAN NOT NULL DEFAULT 1")
            conn.commit()
        except sqlite3.OperationalError:
            pass  # La columna ya existe

    def _traducir_integridad(self, e: sqlite3.IntegrityError) -> ValueError:
        mensaje = str(e)
        if "UNIQUE" in mensaje and "clientes.dni" in mensaje:
            return ClienteDuplicadoError("Ya existe un cliente con ese DNI")
        return super()._traducir_integridad(e)

    def crear(self, cliente: ClienteCrear) -> int:
        return self._insertar(cliente.model_dump(mode="json"))

    def actualizar(self, id_cliente: int, datos: ClienteActualizar) -> bool:
        return self._actualizar(
            id_cliente, datos.model_dump(mode="json", exclude_unset=True)
        )

    def eliminar(self, id_cliente: int) -> bool:
        """
        Baja lógica: no elimina la fila de la BD sino que marca activo = 0
        tanto en el cliente como en sus mascotas asociadas.
        """
        conn = self.db.get_conexion()
        cursor = conn.execute(
            "UPDATE clientes SET activo = 0 WHERE id_cliente = ? AND activo = 1",
            (id_cliente,),
        )
        # También damos de baja lógica a las mascotas a su cargo
        conn.execute(
            "UPDATE mascotas SET activo = 0 WHERE id_cliente = ?",
            (id_cliente,),
        )
        conn.commit()
        return cursor.rowcount > 0

    def reactivar(self, id_cliente: int) -> bool:
        """Permite revertir una baja lógica marcando activo = 1."""
        conn = self.db.get_conexion()
        cursor = conn.execute(
            "UPDATE clientes SET activo = 1 WHERE id_cliente = ?",
            (id_cliente,),
        )
        conn.commit()
        return cursor.rowcount > 0

    # ------ otras consultas ------

    def obtener_todos(
        self, limite: int = 100, offset: int = 0, incluir_inactivos: bool = False
    ) -> list[dict]:
        filtro = "" if incluir_inactivos else "WHERE activo = 1"
        cursor = self.db.get_conexion().execute(
            f"SELECT * FROM clientes {filtro} ORDER BY id_cliente LIMIT ? OFFSET ?",
            (limite, offset),
        )
        return [dict(fila) for fila in cursor.fetchall()]

    def existe(self, id_cliente: int, incluir_inactivos: bool = False) -> bool:
        filtro = "" if incluir_inactivos else "AND activo = 1"
        cursor = self.db.get_conexion().execute(
            f"SELECT 1 FROM clientes WHERE id_cliente = ? {filtro}", (id_cliente,)
        )
        return cursor.fetchone() is not None

    def obtener_por_dni(self, dni: str):
        cursor = self.db.get_conexion().execute(
            "SELECT * FROM clientes WHERE dni = ?", (dni,)
        )
        fila = cursor.fetchone()
        return dict(fila) if fila else None

    def buscar(self, texto: str, incluir_inactivos: bool = False):
        """Búsqueda parcial por nombre, apellido o dni."""
        patron = f"%{texto}%"
        filtro_activo = "" if incluir_inactivos else "AND activo = 1"
        cursor = self.db.get_conexion().execute(
            f"""
            SELECT * FROM clientes
            WHERE (nombre LIKE ? OR apellido LIKE ? OR dni LIKE ?)
            {filtro_activo}
            ORDER BY apellido, nombre
            """,
            (patron, patron, patron),
        )
        return [dict(fila) for fila in cursor.fetchall()]

    def obtener_con_cantidad_mascotas(self, incluir_inactivos: bool = False):
        """Cada cliente con la cantidad de mascotas activas a su cargo."""
        filtro_cliente = "" if incluir_inactivos else "WHERE c.activo = 1"
        cursor = self.db.get_conexion().execute(
            f"""
            SELECT c.*, COUNT(m.id_mascota) AS cantidad_mascotas
            FROM clientes c
            LEFT JOIN mascotas m ON m.id_cliente = c.id_cliente AND m.activo = 1
            {filtro_cliente}
            GROUP BY c.id_cliente
            ORDER BY c.apellido, c.nombre
            """
        )
        return [dict(fila) for fila in cursor.fetchall()]

    def obtener_responsable_de_mascota(self, id_mascota: int):
        """El cliente responsable de una mascota."""
        cursor = self.db.get_conexion().execute(
            """
            SELECT c.* FROM clientes c
            JOIN mascotas m ON m.id_cliente = c.id_cliente
            WHERE m.id_mascota = ?
            """,
            (id_mascota,),
        )
        fila = cursor.fetchone()
        return dict(fila) if fila else None