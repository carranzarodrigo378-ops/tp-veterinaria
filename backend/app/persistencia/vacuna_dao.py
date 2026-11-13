from app.esquemas.vacuna import VacunaActualizar, VacunaCrear
from app.persistencia.base_dao import BaseDAO


class VacunaDAO(BaseDAO):
    TABLA = "vacunas"
    PK = "id_vacuna"
    COLUMNAS_EDITABLES = {"nombre", "descripcion", "precio"}

    def crear(self, vacuna: VacunaCrear) -> int:
        return self._insertar(vacuna.model_dump(mode="json"))

    def actualizar(self, id_vacuna: int, datos: VacunaActualizar) -> bool:
        return self._actualizar(
            id_vacuna, datos.model_dump(mode="json", exclude_unset=True)
        )

    def listar_catalogo(self) -> list[dict]:
        cursor = self.db.get_conexion().execute(
            "SELECT id_vacuna, nombre, descripcion, precio FROM vacunas ORDER BY nombre ASC"
        )
        return [dict(fila) for fila in cursor.fetchall()]

    def obtener_aplicadas_por_consulta(self, id_consulta: int) -> list[dict]:
        cursor = self.db.get_conexion().execute(
            """
            SELECT 
                va.id_vacuna_aplicada,
                va.id_consulta,
                va.id_vacuna,
                v.nombre AS nombre_vacuna,
                va.fecha_aplicacion,
                va.lote,
                va.proxima_dosis
            FROM vacunas_aplicadas va
            JOIN vacunas v ON v.id_vacuna = va.id_vacuna
            WHERE va.id_consulta = ?
            ORDER BY va.id_vacuna_aplicada ASC
            """,
            (id_consulta,),
        )
        return [dict(fila) for fila in cursor.fetchall()]