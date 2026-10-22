from app.esquemas.clinicas import ClinicaActualizar, ClinicaCrear
from app.persistencia.base_dao import BaseDAO


class ClinicaDAO(BaseDAO):
    TABLA = "clinicas"
    PK = "id_clinica"
    COLUMNAS_EDITABLES = {"nombre", "direccion", "telefono", "activa"}

    def crear(self, clinica: ClinicaCrear) -> int:
        return self._insertar(clinica.model_dump(mode="json"))

    def actualizar(self, id_clinica: int, datos: ClinicaActualizar) -> bool:
        return self._actualizar(
            id_clinica, datos.model_dump(mode="json", exclude_unset=True)
        )