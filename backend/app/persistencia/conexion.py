import sqlite3

def get_db_connection():
    # Conecta al archivo de base de datos (se creará en la raíz desde donde ejecutes el proyecto)
    conn = sqlite3.connect("veterinaria.db")
    
    # Activa el chequeo de restricciones de claves foráneas
    conn.execute("PRAGMA foreign_keys = ON") 
    
    # Permite acceder a las columnas por nombre en lugar de índice
    conn.row_factory = sqlite3.Row 
    return conn