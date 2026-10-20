# app/persistencia/mascota_dao.py
from app.persistencia.conexion import get_db_connection
from app.esquemas.mascotas import MascotaSchema

class MascotaDAO:
    def crear(self, mascota: MascotaSchema):
        conn= get_db_connection()
        cursor = conn.cursor()
        
        query = """
                    INSERT INTO mascotas (nombre, especie, raza, fechanacimiento, id_cliente)
                    values (?, ?, ?, ?, ?)    
                """
        
        #ejecutamos la query con los datos de la mascota
        cursor.execute(query, (mascota.nombre, mascota.especie, mascota.raza, mascota.fechanacimiento, mascota.id_cliente))
        conn.commit()  # Guardamos los cambios en la base de datos
        
        nuevo_id = cursor.lastrowid  # Obtenemos el ID de la mascota recién creada
        conn.close()  # Cerramos la conexión a la base de datos
        return nuevo_id  # Retornamos el ID de la nueva mascota
    
    def obtener_todas(self):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = "SELECT * FROM mascotas"
        cursor.execute(query)
        
        mascotas = cursor.fetchall()  # Obtenemos todas las mascotas
        conn.close()  # Cerramos la conexión a la base de datos
        return mascotas  # Retornamos la lista de mascotas
    
    def obtener_por_id(self, id_mascota: int):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = "SELECT * FROM mascotas WHERE id_mascota = ?"
        cursor.execute(query, (id_mascota,))
        
        mascota = cursor.fetchone()  # Obtenemos la mascota con el ID especificado
        conn.close()  # Cerramos la conexión a la base de datos
        return mascota  # Retornamos la mascota encontrada (o None si no existe)
    
    def obtener_mascotas_por_cliente(self, id_cliente: int):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = "SELECT * FROM mascotas WHERE id_cliente = ?"
        cursor.execute(query, (id_cliente,))
        
        mascotas = cursor.fetchall()  # Obtenemos todas las mascotas del cliente
        conn.close()  # Cerramos la conexión a la base de datos
        return mascotas  # Retornamos la lista de mascotas del cliente