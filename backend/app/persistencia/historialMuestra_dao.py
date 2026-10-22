from app.persistencia.base_dao import BaseDAO
from app.persistencia.excepciones import InmutabilidadError
from app.esquemas.muestras import HistorialEstadoMuestraCrear

class HistorialMuestraDAO(BaseDAO):
    TABLA = "historial_estado_muestras"
    PK = "id_historial_estado_muestra"
    COLUMNAS_EDITABLES = set() # Ninguna columna es editable

    def crear(self, historial: HistorialEstadoMuestraCrear) -> int:
        return self._insertar(historial.model_dump(exclude_unset=True))

    def _actualizar(self, id_: int, datos: dict) -> bool:
        raise InmutabilidadError("El historial de muestras no puede ser modificado.")

    def eliminar(self, id_: int) -> bool:
        raise InmutabilidadError("El historial de muestras no puede ser eliminado.")