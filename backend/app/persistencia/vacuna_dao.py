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