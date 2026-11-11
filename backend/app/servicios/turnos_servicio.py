from datetime import datetime, timedelta
from app.esquemas.turnos import TurnoCrear
from app.persistencia.turnos_dao import TurnoDAO

class TurnosServicio:
    def __init__(self, turno_dao: TurnoDAO = None):
        self.turno_dao = turno_dao or TurnoDAO()

    def agendar_turno(self, id_veterinario: int, id_mascota: int, fecha_hora: datetime, motivo: str = None, servicio: str = None, duracion_minutos: int = 30):
        inicio_nuevo = fecha_hora
        fin_nuevo = inicio_nuevo + timedelta(minutes=duracion_minutos)

        turno_dto = TurnoCrear(
            fecha_hora_inicio=inicio_nuevo,
            fecha_hora_fin=fin_nuevo,
            veterinario_id=id_veterinario,
            mascota_id=id_mascota,
            estado="programado",
            motivo=motivo,
            servicio=servicio
        )

        id_turno = self.turno_dao.crear(turno_dto)
        return self.turno_dao.obtener_por_id(id_turno)

    def listar_turnos(self) -> list[dict]:
        return self.turno_dao.obtener_todos(limite=500)

servicio_turnos = TurnosServicio()