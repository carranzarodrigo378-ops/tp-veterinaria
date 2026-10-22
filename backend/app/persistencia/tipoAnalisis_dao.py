from app.esquemas.tipoanalisis import TipoAnalisisActualizar, TipoAnalisisCrear
from app.persistencia.base_dao import BaseDAO

class TipoAnalisisDAO(BaseDAO):
    TABLA = "tipo_analisis"
    PK = "id_tipo_analisis"
    COLUMNAS_EDITABLES = {"nombre", "tipo_muestra", "precio", "temperatura_almacenamiento_c"}

    def crear(self, tipo_analisis: TipoAnalisisCrear) -> int:
        return self._insertar(tipo_analisis.model_dump(mode="json"))

    def actualizar(self, id_tipo_analisis: int, datos: TipoAnalisisActualizar) -> bool:
        return self._actualizar(
            id_tipo_analisis, datos.model_dump(mode="json", exclude_unset=True)
        )