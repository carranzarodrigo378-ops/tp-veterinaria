from app.esquemas.historia_clinica import HistoriaClinicaActualizar, HistoriaClinicaCrear
from app.persistencia.base_dao import BaseDAO   

class HistoriaClinicaDAO(BaseDAO):
    TABLA = "historias_clinicas"
    PK = "id_historia_clinica"
    COLUMNAS_EDITABLES = {"fecha_cierre", "observaciones"}

    def crear(self, historia_clinica: HistoriaClinicaCrear) -> int:
        return self._insertar(historia_clinica.model_dump(mode="json"))

    def actualizar(self, id_historia_clinica: int, datos: HistoriaClinicaActualizar) -> bool:
        return self._actualizar(
            id_historia_clinica, datos.model_dump(mode="json", exclude_unset=True)
        )