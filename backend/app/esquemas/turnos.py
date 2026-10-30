from pydantic import BaseModel
from datetime import datetime
from app.esquemas.enums import EstadoTurno

class TurnoBase(BaseModel):
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    veterinario_id: int
    mascota_id: int
    estado: EstadoTurno
    
class TurnoCrear(TurnoBase):
    pass

class TurnoRespuesta(TurnoBase):
    id_turno: int
    
