from app.esquemas.esquemaVacunal import EsquemaVacunalActualizar, EsquemaVacunalCrear
from app.persistencia.base_dao import BaseDAO

class EsquemaVacunalDAO(BaseDAO):
    TABLA = "esquemas_vacunales"
    PK = "id_esquema_vacunal"
    COLUMNAS_EDITABLES = {"especie", "edad_minima_semanas", "intervalo_refuerzo_dias", "obligatoria"}

    def crear(self, esquema_vacunal: EsquemaVacunalCrear) -> int:
        return self._insertar(esquema_vacunal.model_dump(mode="json"))

    def actualizar(self, id_esquema_vacunal: int, datos: EsquemaVacunalActualizar) -> bool:
        return self._actualizar(
            id_esquema_vacunal, datos.model_dump(mode="json", exclude_unset=True)
        )