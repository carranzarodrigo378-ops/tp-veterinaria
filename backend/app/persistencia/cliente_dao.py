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
    COLUMNAS_EDITABLES = {"nombre", "apellido", "dni", "telefono", "email", "direccion"}

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
        try:
            return super().eliminar(id_cliente)
        except ValueError as e:
            raise ClienteConMascotasError(
                "No se puede eliminar: el cliente tiene mascotas o comprobantes asociados"
            ) from e

#  ------ otras consultas ------

    def existe(self, id_cliente: int):
        cursor = self.db.get_conexion().execute(
            "SELECT 1 FROM clientes WHERE id_cliente = ?", (id_cliente,)
        )
        return cursor.fetchone() is not None

    def obtener_por_dni(self, dni:str):
        cursor = self.db.get_conexion().execute(
            "SELECT * FROM clientes WHERE dni = ?", (dni,)
        )
        fila = cursor.fetchone()
        return dict(fila) if fila else None

    def buscar(self, texto:str):
        """Busqueda parcial por nombre apellido o dni"""
        patron  = f"%{texto}%"
        cursor = self.db.get_conexion().execute(
            """
            SELECT * FROM clientes
            WHERE nombre LIKE ? OR apellido LIKE ? or dni LIKE ?
            ORDER BY apellido, nombre
            """,
            (patron, patron, patron),
        )
        return [dict(fila) for fila in cursor.fetchall()]

    def obtener_con_cantidad_mascotas(self):
        """Cada cliente con la cantidad de mascotas a su cargo"""
        cursor = self.db.get_conexion().execute(
            """
            SELECT c.*, COUNT(m.id_cliente) AS cantidad_mascotas
            FROM clientes c
            LEFT JOIN mascotas m ON m.id_cliente = c.id_cliente
            GROUP BY c.id_cliente
            ORDER BY c.apellido, c.nombre
            """
        )
        return [dict(fila) for fila in cursor.fetchall()]

    def obtener_responsable_de_mascota(self, id_mascota:int):
        """El cliente responsable d una mascota"""
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