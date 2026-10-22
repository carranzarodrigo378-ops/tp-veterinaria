import sqlite3

class DatabaseSingleton:
    _instancia = None

    def __new__(cls):
        # Si la instancia no existe, la creamos por primera y única vez
        if cls._instancia is None:
            cls._instancia = super(DatabaseSingleton, cls).__new__(cls)
            
            # check_same_thread=False es vital en FastAPI para evitar errores de hilos con SQLite
            cls._instancia.conexion = sqlite3.connect("veterinaria.db", check_same_thread=False)
            cls._instancia.conexion.execute("PRAGMA foreign_keys = ON")
            cls._instancia.conexion.row_factory = sqlite3.Row
            
        return cls._instancia

    def get_conexion(self):
        return self.conexion