import sqlite3

from app.esquemas.mascotas import MascotaActualizar, MascotaCrear
from app.persistencia.base_dao import BaseDAO
from app.persistencia.excepciones import ResponsableInexistenteError


class MascotaDAO(BaseDAO):
    TABLA = "mascotas"
    PK = "id_mascota"
    COLUMNAS_EDITABLES = {
        "nombre", "especie", "raza", "sexo", "fecha_nacimiento", "id_cliente",
    }

    def _traducir_integridad(self, e: sqlite3.IntegrityError) -> ValueError:
        if "FOREIGN KEY" in str(e):
            return ResponsableInexistenteError("El cliente responsable no existe")
        return super()._traducir_integridad(e)

    def crear(self, mascota: MascotaCrear) -> int:
        return self._insertar(mascota.model_dump(mode="json"))

    def actualizar(self, id_mascota: int, datos: MascotaActualizar) -> bool:
        return self._actualizar(
            id_mascota, datos.model_dump(mode="json", exclude_unset=True)
        )

    def obtener_por_cliente(self, id_cliente: int) -> list[dict]:
        cursor = self.db.get_conexion().execute(
            "SELECT * FROM mascotas WHERE id_cliente = ?", (id_cliente,)
        )
        return [dict(fila) for fila in cursor.fetchall()]