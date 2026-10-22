from app.esquemas.contenedor import ContenedorActualizar, ContenedorCrear
from app.persistencia.base_dao import BaseDAO

class ContenedorDAO(BaseDAO):
    TABLA = "contenedores"
    PK = "id_contenedor"
    COLUMNAS_EDITABLES = {"codigo", "capacidad_muestras", "temperatura_objetivo_c", "estado"}

    def crear(self, contenedor: ContenedorCrear) -> int:
        return self._insertar(contenedor.model_dump(mode="json"))

    def actualizar(self, id_contenedor: int, datos: ContenedorActualizar) -> bool:
        return self._actualizar(
            id_contenedor, datos.model_dump(mode="json", exclude_unset=True)
        )