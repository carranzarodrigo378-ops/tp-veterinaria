import sqlite3
from app.persistencia.base_dao import BaseDAO
from app.esquemas.consultas import ConsultaCrear, ConsultaActualizar

class ConsultaDAO(BaseDAO):
    TABLA = "consultas"
    PK = "id_consulta"
    COLUMNAS_EDITABLES = {"motivo", "diagnostico", "tratamiento", "peso_kg"}

    def crear_consulta_medica(self, id_mascota: int, veterinario_id: int, motivo: str, diagnostico: str, clinica_id: int = 1) -> int:
        conn = self.db.get_conexion()
        cursor = conn.cursor()
        
        # 1. Obtener o crear la historia clínica asociada a la mascota
        cursor.execute("SELECT id_historia_clinica FROM historias_clinicas WHERE id_mascota = ?", (id_mascota,))
        hc_fila = cursor.fetchone()
        
        if not hc_fila:
            # Si no tiene historia clínica, se la abrimos automáticamente hoy
            cursor.execute(
                "INSERT INTO historias_clinicas (id_mascota, fecha_apertura) VALUES (?, datetime('now', 'localtime'))",
                (id_mascota,)
            )
            historia_clinica_id = cursor.lastrowid
        else:
            historia_clinica_id = hc_fila["id_historia_clinica"]

        # 2. Insertar la consulta médica
        sql = """
            INSERT INTO consultas (historia_clinica_id, veterinario_id, clinica_id, fecha_hora, tipo, motivo, diagnostico)
            VALUES (?, ?, ?, datetime('now', 'localtime'), 'consulta', ?, ?)
        """
        cursor.execute(sql, (historia_clinica_id, veterinario_id, clinica_id, motivo, diagnostico))
        conn.commit()
        return cursor.lastrowid

    def crear_orden_derivacion(self, id_consulta: int, tipo_analisis_nombre: str, prioridad: str, indicaciones: str, laboratorio_id: int = 1) -> int:
        conn = self.db.get_conexion()
        
        # 1. Buscar el ID del tipo de análisis por su nombre (el front envía el string)
        ta_fila = conn.execute("SELECT id_tipo_analisis FROM tipo_analisis WHERE nombre = ?", (tipo_analisis_nombre,)).fetchone()
        if not ta_fila:
            raise KeyError(f"El análisis '{tipo_analisis_nombre}' no existe en el catálogo.")
        
        # 2. Insertar la orden
        sql = """
            INSERT INTO ordenes_derivacion (id_consulta, tipo_analisis_id, id_laboratorio, fecha_emision, indicaciones, prioridad)
            VALUES (?, ?, ?, datetime('now', 'localtime'), ?, ?)
        """
        cursor = conn.cursor()
        cursor.execute(sql, (id_consulta, ta_fila["id_tipo_analisis"], laboratorio_id, indicaciones, prioridad))
        conn.commit()
        return cursor.lastrowid

    def actualizar(self, id_consulta: int, datos: ConsultaActualizar) -> bool:
        return self._actualizar(id_consulta, datos.model_dump(exclude_unset=True))

    def listar_tipos_analisis(self) -> list[dict]:
        """Devuelve el catálogo de análisis para llenar el <select> en React."""
        sql = "SELECT id_tipo_analisis, nombre, tipo_muestra, precio FROM tipo_analisis ORDER BY nombre ASC"
        cursor = self.db.get_conexion().execute(sql)
        return [dict(fila) for fila in cursor.fetchall()]

consulta_dao = ConsultaDAO()