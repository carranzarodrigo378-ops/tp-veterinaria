from datetime import datetime, timedelta


class TurnosServicio:
    def __init__(self, repositorio_turnos=None):
        self.repositorio = repositorio_turnos
        self._turnos = []
        self._contador_turnos = 1

    def agendar_turno(self, id_veterinario, id_mascota, fecha_hora, duracion_minutos=30):
        inicio_nuevo = fecha_hora
        fin_nuevo = inicio_nuevo + timedelta(minutes=duracion_minutos)

        # Validación de superposición de turnos para el mismo veterinario
        for turno in self._turnos:
            if turno["id_veterinario"] == id_veterinario:
                inicio_existente = turno["inicio"]
                fin_existente = turno["fin"]

                # Hay solapamiento si el nuevo turno inicia antes de que termine uno existente
                # y termina después de que empiece
                if inicio_nuevo < fin_existente and fin_nuevo > inicio_existente:
                    raise ValueError(
                        f"El profesional ya tiene un turno asignado entre "
                        f"{inicio_existente.strftime('%H:%M')} y {fin_existente.strftime('%H:%M')}."
                    )

        nuevo_turno = {
            "id_turno": self._contador_turnos,
            "id_veterinario": id_veterinario,
            "id_mascota": id_mascota,
            "inicio": inicio_nuevo,
            "fin": fin_nuevo
        }
        self._turnos.append(nuevo_turno)
        self._contador_turnos += 1
        return nuevo_turno


servicio_turnos = TurnosServicio()