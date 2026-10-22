from app.esquemas.laboratorio import LaboratorioActualizar, LaboratorioCrear
from app.persistencia.base_dao import BaseDAO

class LaboratorioDAO(BaseDAO):
    TABLA = "laboratorios"
    PK = "id_laboratorio"
    COLUMNAS_EDITABLES = {"nombre", "direccion", "telefono"}

    def crear(self, laboratorio: LaboratorioCrear) -> int:
        return self._insertar(laboratorio.model_dump(mode="json"))

    def actualizar(self, id_laboratorio: int, datos: LaboratorioActualizar) -> bool:
        return self._actualizar(
            id_laboratorio, datos.model_dump(mode="json", exclude_unset=True)
        )