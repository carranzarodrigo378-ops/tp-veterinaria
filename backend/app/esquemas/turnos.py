from datetime import datetime

from pydantic import BaseModel, model_validator

from app.esquemas.enums import EstadoTurno


class TurnoBase(BaseModel):
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    veterinario_id: int
    mascota_id: int

    @model_validator(mode="after")
    def validar_rango(self):
        if self.fecha_hora_fin <= self.fecha_hora_inicio:
            raise ValueError("La fecha de fin debe ser posterior a la de inicio")
        return self


class TurnoCrear(TurnoBase):
    pass  # el estado inicial lo fija el sistema: programado


class TurnoActualizar(BaseModel):
    fecha_hora_inicio: datetime | None = None
    fecha_hora_fin: datetime | None = None
    estado: EstadoTurno | None = None


class TurnoRespuesta(TurnoBase):
    id_turno: int
    estado: EstadoTurno