import os

class Configuracion:
    # Clave secreta para la firma del token JWT
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", 
        "boquita_el_mas_grande"
    )
    ALGORITMO: str = "HS256"
    EXPIRACION_MINUTOS: int = 60 * 8  # Sesión válida por 8 horas
    
    # Nombre del archivo SQLite (coordinar con tu compañero cómo lo llamó)
    RUTA_BD: str = os.getenv("RUTA_BD", "red_veterinaria.db")

configuracion = Configuracion()