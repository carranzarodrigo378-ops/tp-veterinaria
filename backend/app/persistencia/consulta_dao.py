import sqlite3
from app.persistencia.base_dao import BaseDAO
from app.esquemas.consultas import ConsultaCrear, ConsultaActualizar

class ConsultaDAO(BaseDAO):
    TABLA = "consultas"
    PK = "id_consulta"
    COLUMNAS_EDITABLES = {"motivo", "diagnostico", "tratamiento", "peso_kg"}

    def crear(self, consulta: ConsultaCrear) -> int:
        return self._insertar(consulta.model_dump(exclude_unset=True))

    def actualizar(self, id_consulta: int, datos: ConsultaActualizar) -> bool:
        return self._actualizar(id_consulta, datos.model_dump(exclude_unset=True))