from datetime import datetime, timedelta
from app.esquemas.turnos import TurnoCrear
from app.persistencia.turnos_dao import TurnoDAO
from app.persistencia.usuario_dao import UsuarioDAO


class TurnosServicio:
    def __init__(self, turno_dao: TurnoDAO = None, usuario_dao: UsuarioDAO = None):
        self.turno_dao = turno_dao or TurnoDAO()
        self.usuario_dao = usuario_dao or UsuarioDAO()

    def agendar_turno(
        self,
        id_veterinario: int,
        id_mascota: int,
        fecha_hora: datetime | str,
        motivo: str = None,
        servicio: str = None,
        duracion_minutos: int = 30,
    ):
        # 1. Asegurar formato datetime
        if isinstance(fecha_hora, str):
            dt_str = fecha_hora.replace("T", " ")
            formato = "%Y-%m-%d %H:%M:%S" if len(dt_str) > 16 else "%Y-%m-%d %H:%M"
            inicio_nuevo = datetime.strptime(dt_str, formato)
        else:
            inicio_nuevo = fecha_hora

        # 2. Regla de negocio: mínimo 2 días de anticipación (días calendario)
        fecha_minima = datetime.now().date() + timedelta(days=2)
        if inicio_nuevo.date() < fecha_minima:
            raise ValueError("Los turnos deben solicitarse con al menos 2 días de anticipación.")

        fin_nuevo = inicio_nuevo + timedelta(minutes=duracion_minutos)

        turno_dto = TurnoCrear(
            fecha_hora_inicio=inicio_nuevo,
            fecha_hora_fin=fin_nuevo,
            veterinario_id=id_veterinario,
            mascota_id=id_mascota,
            estado="programado",
            motivo=motivo,
            servicio=servicio,
        )

        id_turno = self.turno_dao.crear(turno_dto)
        return self.turno_dao.obtener_por_id(id_turno)

    def listar_turnos(self) -> list[dict]:
        return self.turno_dao.obtener_todos_con_detalles(limite=500)

    def obtener_agenda_veterinario(self, nombre_usuario: str) -> list[dict]:
        """Agenda del veterinario asociado al usuario logueado."""
        usuario = self.usuario_dao.obtener_por_username(nombre_usuario)
        if usuario is None or usuario["id_veterinario"] is None:
            raise ValueError("El usuario no está asociado a un veterinario")
        return self.turno_dao.obtener_agenda_veterinario(usuario["id_veterinario"])


servicio_turnos = TurnosServicio()