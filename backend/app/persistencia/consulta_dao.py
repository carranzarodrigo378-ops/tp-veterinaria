import sqlite3
from app.persistencia.base_dao import BaseDAO
from app.esquemas.consultas import ConsultaCrear, ConsultaActualizar


class ConsultaDAO(BaseDAO):
    TABLA = "consultas"
    PK = "id_consulta"
    COLUMNAS_EDITABLES = {"motivo", "diagnostico", "tratamiento", "peso_kg"}

    def obtener_turno_por_id(self, id_turno: int) -> dict | None:
        cursor = self.db.get_conexion().execute(
            "SELECT * FROM turnos WHERE id_turno = ?", (id_turno,)
        )
        fila = cursor.fetchone()
        return dict(fila) if fila else None

    def crear_consulta_medica(
        self,
        id_mascota: int,
        veterinario_id: int,
        motivo: str,
        diagnostico: str,
        clinica_id: int = 1,
        turno_id: int | None = None,
        vacunas_aplicadas: list[dict] | None = None,
    ) -> int:
        conn = self.db.get_conexion()
        cursor = conn.cursor()

        try:
            # 1. Obtener o crear la historia clínica asociada a la mascota
            cursor.execute(
                "SELECT id_historia_clinica FROM historias_clinicas WHERE id_mascota = ?",
                (id_mascota,),
            )
            hc_fila = cursor.fetchone()

            if not hc_fila:
                cursor.execute(
                    "INSERT INTO historias_clinicas (id_mascota, fecha_apertura) VALUES (?, datetime('now', 'localtime'))",
                    (id_mascota,),
                )
                historia_clinica_id = cursor.lastrowid
            else:
                historia_clinica_id = hc_fila["id_historia_clinica"]

            # 2. Insertar la consulta médica vinculando turno_id si fue provisto
            sql = """
                INSERT INTO consultas (
                    historia_clinica_id, veterinario_id, clinica_id, turno_id,
                    fecha_hora, tipo, motivo, diagnostico
                )
                VALUES (?, ?, ?, ?, datetime('now', 'localtime'), 'consulta', ?, ?)
            """
            cursor.execute(
                sql,
                (
                    historia_clinica_id,
                    veterinario_id,
                    clinica_id,
                    turno_id,
                    motivo,
                    diagnostico,
                ),
            )
            id_consulta = cursor.lastrowid

            # 3. Si hay vacunas aplicadas, insertarlas dentro de la misma transacción
            if vacunas_aplicadas:
                self._insertar_vacunas_en_cursor(cursor, id_consulta, vacunas_aplicadas)

            conn.commit()
            return id_consulta
        except Exception as e:
            conn.rollback()
            if isinstance(e, sqlite3.IntegrityError):
                raise self._traducir_integridad(e) from e
            raise

    def _insertar_vacunas_en_cursor(
        self, cursor: sqlite3.Cursor, id_consulta: int, vacunas_aplicadas: list[dict]
    ) -> list[int]:
        ids_creados = []
        sql_vacuna = """
            INSERT INTO vacunas_aplicadas (
                id_consulta, id_vacuna, fecha_aplicacion, lote, proxima_dosis
            )
            VALUES (?, ?, ?, ?, ?)
        """
        for item in vacunas_aplicadas:
            cursor.execute(
                sql_vacuna,
                (
                    id_consulta,
                    item["id_vacuna"],
                    item["fecha_aplicacion"],
                    item.get("lote"),
                    item.get("proxima_dosis"),
                ),
            )
            ids_creados.append(cursor.lastrowid)
        return ids_creados

    def registrar_vacunas_aplicadas(
        self, id_consulta: int, vacunas_aplicadas: list[dict]
    ) -> list[int]:
        """Inserta un lote de vacunas aplicadas de manera atómica para una consulta existente."""
        conn = self.db.get_conexion()
        cursor = conn.cursor()
        try:
            ids = self._insertar_vacunas_en_cursor(cursor, id_consulta, vacunas_aplicadas)
            conn.commit()
            return ids
        except Exception as e:
            conn.rollback()
            if isinstance(e, sqlite3.IntegrityError):
                raise self._traducir_integridad(e) from e
            raise

    def crear_orden_derivacion(
        self,
        id_consulta: int,
        tipo_analisis_nombre: str,
        prioridad: str,
        indicaciones: str,
        laboratorio_id: int = 1,
    ) -> int:
        conn = self.db.get_conexion()

        # 1. Buscar el ID del tipo de análisis por su nombre (el front envía el string)
        ta_fila = conn.execute(
            "SELECT id_tipo_analisis FROM tipo_analisis WHERE nombre = ?",
            (tipo_analisis_nombre,),
        ).fetchone()
        if not ta_fila:
            raise KeyError(f"El análisis '{tipo_analisis_nombre}' no existe en el catálogo.")

        # 2. Insertar la orden
        sql = """
            INSERT INTO ordenes_derivacion (id_consulta, tipo_analisis_id, id_laboratorio, fecha_emision, indicaciones, prioridad)
            VALUES (?, ?, ?, datetime('now', 'localtime'), ?, ?)
        """
        cursor = conn.cursor()
        cursor.execute(
            sql,
            (
                id_consulta,
                ta_fila["id_tipo_analisis"],
                laboratorio_id,
                indicaciones,
                prioridad,
            ),
        )
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