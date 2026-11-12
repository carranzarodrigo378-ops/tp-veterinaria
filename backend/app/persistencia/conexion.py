import sqlite3
import threading
from pathlib import Path
from app.core.seguridad import hashear_password

# backend/veterinaria.db, sin importar desde dónde se lance uvicorn
DB_PATH = Path(__file__).resolve().parents[2] / "veterinaria.db"
SCHEMA_PATH = Path(__file__).with_name("schema.sql")


class DatabaseSingleton:
    _instancia = None
    _lock = threading.Lock()

    def __new__(cls):
        # El lock evita que dos hilos creen dos instancias a la vez
        with cls._lock:
            if cls._instancia is None:
                instancia = super().__new__(cls)

                # check_same_thread=False es vital en FastAPI (los endpoints corren en hilos)
                instancia.conexion = sqlite3.connect(DB_PATH, check_same_thread=False)
                instancia.conexion.row_factory = sqlite3.Row
                # SQLite no valida claves foráneas por defecto: hay que activarlo
                instancia.conexion.execute("PRAGMA foreign_keys = ON")

                cls._instancia = instancia
        return cls._instancia

    def get_conexion(self) -> sqlite3.Connection:
        return self.conexion

    def inicializar_esquema(self):
        """Crea las tablas e inserta los datos semilla leyendo schema.sql."""
        self.conexion.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))

        # Convierte las contraseñas en texto plano del seed ('Labo123', '1234')
        # a hashes reales de bcrypt usando app.core.seguridad.hashear_password
        filas = self.conexion.execute(
            "SELECT id_usuario, password_hash FROM usuarios"
        ).fetchall()

        for fila in filas:
            pwd = fila["password_hash"] or ""
            # Un hash real de bcrypt siempre mide 60 caracteres y empieza con $2b$ o $2a$
            if not (pwd.startswith("$2") and len(pwd) == 60):
                hash_real = hashear_password(pwd)
                self.conexion.execute(
                    "UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?",
                    (hash_real, fila["id_usuario"]),
                )

        self.conexion.commit()