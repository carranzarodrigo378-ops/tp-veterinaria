import sqlite3
from app.persistencia.base_dao import BaseDAO
from app.esquemas.turnos import TurnoCrear, TurnoActualizar

class TurnoDAO(BaseDAO):
    TABLA = "turnos"
    PK = "id_turno"
    COLUMNAS_EDITABLES = {"fecha_hora_inicio", "fecha_hora_fin", "estado"}

    def crear(self, turno: TurnoCrear) -> int:
        if self._hay_superposicion(turno.veterinario_id, str(turno.fecha_hora_inicio), str(turno.fecha_hora_fin)):
            raise ValueError("El veterinario ya tiene un turno superpuesto en ese horario.")
        return self._insertar(turno.model_dump(exclude_unset=True))

    def actualizar(self, id_turno: int, turno: TurnoActualizar) -> bool:
        datos = turno.model_dump(exclude_unset=True)
        # Si se están modificando las fechas, validamos superposición excluyendo el turno actual
        if "fecha_hora_inicio" in datos and "fecha_hora_fin" in datos:
            cursor = self.db.get_conexion().execute(
                "SELECT veterinario_id FROM turnos WHERE id_turno = ?", (id_turno,)
            )
            fila = cursor.fetchone()
            if fila and self._hay_superposicion(fila["veterinario_id"], str(datos["fecha_hora_inicio"]), str(datos["fecha_hora_fin"]), excluir_id=id_turno):
                raise ValueError("El veterinario ya tiene un turno superpuesto en ese horario.")
                
        return self._actualizar(id_turno, datos)

    def _hay_superposicion(self, vet_id: int, inicio: str, fin: str, excluir_id: int = None) -> bool:
        query = """
            SELECT 1 FROM turnos 
            WHERE veterinario_id = ? AND estado != 'cancelado'
            AND (fecha_hora_inicio < ? AND fecha_hora_fin > ?)
        """
        params = [vet_id, fin, inicio]
        
        if excluir_id is not None:
            query += " AND id_turno != ?"
            params.append(excluir_id)
            
        cursor = self.db.get_conexion().execute(query, tuple(params))
        return cursor.fetchone() is not None