import sqlite3
from app.persistencia.base_dao import BaseDAO
from app.persistencia.excepciones import EntidadDuplicadaError


class UsuarioDAO(BaseDAO):
    TABLA = "usuarios"
    PK = "id_usuario"
    COLUMNAS_EDITABLES = {"nombre", "apellido", "email", "telefono", "rol", "password_hash"}

    def _traducir_integridad(self, e: sqlite3.IntegrityError) -> ValueError:
        mensaje = str(e)
        if "UNIQUE" in mensaje and "usuarios.usuario" in mensaje:
            return EntidadDuplicadaError("El nombre de usuario ya está registrado.")
        return super()._traducir_integridad(e)

    def crear_usuario(self, datos: dict) -> int:
        return self._insertar(datos)

    def obtener_por_username(self, username: str) -> dict | None:
        cursor = self.db.get_conexion().execute(
            "SELECT * FROM usuarios WHERE usuario = ?", (username,)
        )
        fila = cursor.fetchone()
        return dict(fila) if fila else None