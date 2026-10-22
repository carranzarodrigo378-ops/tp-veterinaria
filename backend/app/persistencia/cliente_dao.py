# app/persistencia/cliente_dao.py
import sqlite3

from app.persistencia.conexion import DatabaseSingleton
from app.esquemas.clientes import ClienteBase, ClienteActualizar
from app.persistencia.excepciones import ( ClienteConMascotasError, ClienteDuplicadoError)

# Lista blanca: solo estas columnas se pueden modificar
COLUMNAS_EDITABLES = {"nombre", "apellido", "dni", "telefono", "email", "direccion"}



class ClienteDao(): 
    def __init__(self):
        self.db= DatabaseSingleton()

    #----convertir errores usando el archivo de excepeciones----
    @staticmethod
    def _traducir_integridad(e: sqlite3.IntegrityError):
        mensaje = str(e)
        if "UNIQUE" in mensaje and "clientes.dni" in mensaje:
            return ClienteDuplicadoError("Ya existe un cliente cpon ese DNI")
        if "NOT NULL" in mensaje:
            columna = mensaje.split(".")[-1]
            return ValueError(f"El campo '{columna}' es obligatorio")
        return ValueError("Los datos del cliente violan una restriccion")

    #------ CRUD -----

    def crear (self, cliente: ClienteBase):
        conn = self.db.get_conexion()

        query = """
                    INSERT INTO clientes(nombre, apellido, dni, telefono, email, direccion)
                    values (?, ?, ?, ?, ?, ?)
                """
        try:
            cursor= conn.execute(query, (
                cliente.nombre,
                cliente.apellido,
                cliente.dni,
                cliente.telefono,
                cliente.email,
                cliente.direccion
            ))
            conn.commit()
        except sqlite3.IntegrityError as e:
            conn.rollback()
            raise self._traducir_integridad(e) from e
        return cursor.lastrowid

    def obtener_todos(self, limite: int=100, offset: int = 0):
        cursor = self.db.get_conexion().execute(
            "SELECT * FROM clientes ORDER BY apellido, nombre LIMIT ? OFFSET ?",
            (limite, offset)
        )
        return[dict(fila) for fila in cursor.fetchall()]
    
    def obtener_por_id(self, id_cliente:int):
        cursor = self.db.get_conexion().execute(
            "SELECT * FROM clientes WHERE id_cliente = ?", (id_cliente,)
        )
        fila = cursor.fetchone()
        return dict(fila) if fila else None

    def actualizar(self, id_cliente:int, datos: ClienteActualizar):
        """Devuelve true si se modifico, false si el cliente no existe"""
        conn = self.db.get_conexion()

        #solo los campos q el usuario envio realmente
        campos = {
            k: v
            for k, v in datos.model_dump(exclude_unset=True).items()
            if k in COLUMNAS_EDITABLES
        }
        if not campos:
            raise ValueError("No se enviaron campos para actualizar")

        #seguro contra inyeccion: los nombres de columna salen de la lista blanca
        asignaciones= ", ".join(f"{col} = ?" for col in campos)
        valores = [*campos.values(), id_cliente]

        try:
            cursor = conn.execute(
                f"UPDATE clientes SET {asignaciones} WHERE id_cliente = ?", valores
            )
            conn.commit()
        except sqlite3.IntegrityError as e:
            conn.rollback()
            raise self._traducir_integridad(e) from e
        return cursor.rowcount > 0

    def eliminar(self, id_cliente:int):
        """Devuelve true si se elimina false si no existia"""
        conn = self.db.get_conexion()
        try:
            cursor = conn.execute(
                "DELETE FROM clientes WHERE id_cliente = ?", (id_cliente,)
            )
            conn.commit()
        except sqlite3.IntegrityError as e:
            conn.rollback()
            raise ClienteConMascotasError(
                "No se puede eliminar: El cliente es responsable de una o mas mascotas"
            ) from e
        return cursor.rowcount > 0

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