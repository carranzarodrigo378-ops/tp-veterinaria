from app.esquemas.veterinario import VeterinarioActualizar, VeterinarioCrear
from app.persistencia.base_dao import BaseDAO

class VeterinarioDAO(BaseDAO):
    TABLA = "veterinarios"
    PK = "id_veterinario"
    COLUMNAS_EDITABLES = {"nombre", "apellido", "matricula", "clinica_id"}

    def crear(self, veterinario: VeterinarioCrear) -> int:
        return self._insertar(veterinario.model_dump(mode="json"))

    def actualizar(self, id_veterinario: int, datos: VeterinarioActualizar) -> bool:
        return self._actualizar(
            id_veterinario, datos.model_dump(mode="json", exclude_unset=True)
        )