import sqlite3
from app.persistencia.base_dao import BaseDAO
from app.core.seguridad import hashear_password

class UsuarioDAO(BaseDAO):
    TABLA = "usuarios"
    PK = "id_usuario"
    COLUMNAS_EDITABLES = {"activo", "password_hash"}

    def obtener_por_username(self, username: str) -> dict | None:
        cursor = self.db.get_conexion().execute(
            "SELECT * FROM usuarios WHERE username = ? AND activo = 1", (username,)
        )
        fila = cursor.fetchone()
        return dict(fila) if fila else None

    def registrar_cliente_completo(self, datos_usuario: dict, datos_cliente: dict) -> int:
        conn = self.db.get_conexion()
        cursor = conn.cursor()
        try:
            # 1. Crear credencial de acceso
            cursor.execute(
                "INSERT INTO usuarios (username, email, password_hash, rol) VALUES (?, ?, ?, 'cliente')",
                (datos_usuario["usuario"], datos_usuario["email"], hashear_password(datos_usuario["password"]))
            )
            usuario_id = cursor.lastrowid

            # 2. Crear perfil asociado
            cursor.execute(
                """INSERT INTO clientes (nombre, apellido, dni, telefono, email, usuario_id) 
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (datos_cliente["nombre"], datos_cliente["apellido"], datos_cliente["dni"], 
                 datos_cliente["telefono"], datos_usuario["email"], usuario_id)
            )
            conn.commit()
            return usuario_id
        except sqlite3.IntegrityError as e:
            conn.rollback()
            raise ValueError("El usuario, email o DNI ya están registrados.") from e

    def registrar_veterinario_completo(self, datos_usuario: dict, datos_vet: dict) -> int:
        conn = self.db.get_conexion()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO usuarios (username, email, password_hash, rol) VALUES (?, ?, ?, 'veterinario')",
                (datos_usuario["usuario"], datos_usuario["email"], hashear_password(datos_usuario["password"]))
            )
            usuario_id = cursor.lastrowid

            cursor.execute(
                """INSERT INTO veterinarios (nombre, apellido, matricula, clinica_id, usuario_id) 
                   VALUES (?, ?, ?, ?, ?)""",
                (datos_vet["nombre"], datos_vet["apellido"], datos_vet["matricula"], datos_vet["clinica_id"], usuario_id)
            )
            conn.commit()
            return usuario_id
        except sqlite3.IntegrityError as e:
            conn.rollback()
            raise ValueError("El usuario, email o matrícula ya están registrados.") from e