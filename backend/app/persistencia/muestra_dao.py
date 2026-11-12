import sqlite3
from app.persistencia.base_dao import BaseDAO
from app.persistencia.excepciones import EntidadDuplicadaError
from app.esquemas.muestras import MuestraCrear, MuestraActualizar

class MuestraDAO(BaseDAO):
    TABLA = "muestras"
    PK = "id_muestra"
    COLUMNAS_EDITABLES = {"remito_id", "estado_actual"}

    def _traducir_integridad(self, e: sqlite3.IntegrityError) -> ValueError:
        mensaje = str(e)
        if "UNIQUE" in mensaje and "muestras.codigo" in mensaje:
            return EntidadDuplicadaError("Ya existe una muestra con ese código de barras.")
        return super()._traducir_integridad(e)

    def crear(self, muestra: MuestraCrear, usuario: str = "sistema") -> int:
        conn = self.db.get_conexion()
        cursor = conn.cursor()
        datos = muestra.model_dump(exclude_unset=True)

        try:
            # 1. Insertar la muestra física
            columnas = ", ".join(datos.keys())
            placeholders = ", ".join("?" for _ in datos)
            sql_muestra = f"INSERT INTO {self.TABLA} ({columnas}) VALUES ({placeholders})"
            cursor.execute(sql_muestra, tuple(datos.values()))
            id_muestra_creada = cursor.lastrowid

            # 2. Registrar el paso 1 de la trazabilidad (Doble escritura obligatoria)
            sql_historial = """
                INSERT INTO historial_estado_muestras (muestra_id, estado, fecha_hora, usuario, observaciones)
                VALUES (?, 'extraida', ?, ?, 'Extracción inicial en clínica')
            """
            cursor.execute(sql_historial, (id_muestra_creada, datos["fecha_extraccion"], usuario))
            
            conn.commit()
            return id_muestra_creada
        except sqlite3.IntegrityError as e:
            conn.rollback()
            raise self._traducir_integridad(e)
        except sqlite3.Error as e:
            conn.rollback()
            raise ValueError("Error al registrar la muestra y su trazabilidad.") from e

    def actualizar(self, id_muestra: int, datos: MuestraActualizar) -> bool:
        return self._actualizar(id_muestra, datos.model_dump(exclude_unset=True))

    def cambiar_estado(self, id_muestra: int, nuevo_estado: str, estado_precinto: str = None, usuario: str = None):
        conn = self.db.get_conexion()
        cursor = conn.cursor()

        # 1. Obtener estado actual
        cursor.execute("SELECT estado_actual FROM muestras WHERE id_muestra = ?", (id_muestra,))
        fila = cursor.fetchone()
        if not fila:
            raise ValueError("Muestra no encontrada.")
        estado_actual = fila["estado_actual"]

        # 2. Validación secuencial (Máquina de estados)
        transiciones = {
            "extraida": ["empaquetada"],
            "empaquetada": ["en_transito"],
            "en_transito": ["recibida"],
            "recibida": ["analizada", "rechazada"],
            "analizada": [],
            "rechazada": []
        }
        
        if nuevo_estado not in transiciones.get(estado_actual, []):
            raise ValueError(f"Transición inválida de '{estado_actual}' a '{nuevo_estado}'.")

        # 3. Bifurcación condicional
        if nuevo_estado == "recibida" and estado_precinto == "roto":
            nuevo_estado = "rechazada"

        # 4. Doble escritura transaccional
        try:
            cursor.execute("UPDATE muestras SET estado_actual = ? WHERE id_muestra = ?", (nuevo_estado, id_muestra))
            cursor.execute("""
                INSERT INTO historial_estado_muestras (muestra_id, estado, fecha_hora, usuario)
                VALUES (?, ?, datetime('now', 'localtime'), ?)
            """, (id_muestra, nuevo_estado, usuario))
            
            conn.commit()
        except sqlite3.Error as e:
            conn.rollback()
            raise ValueError("Error al registrar el cambio de estado.") from e