from pydantic import BaseModel
from datetime import datetime
from app.esquemas.enums import EstadoPrecinto, EstadoRemito

class PrecintoBase(BaseModel):
    codigo: str
    estado: EstadoPrecinto
    fecha_colocacion: datetime

class PrecintoCrear(PrecintoBase):
    pass

class PrecintoRespuesta(PrecintoBase):
    id_precinto: int

class RemitoBiologicoBase(BaseModel):
    numero_remito: str
    clinica_origen_id: int
    laboratorio_destino_id: int
    contenedor_id: int
    precinto_id: int
    fecha_emision: datetime
    estado: EstadoRemito

class RemitoBiologicoCrear(RemitoBiologicoBase):
    pass

class RemitoBiologicoRespuesta(RemitoBiologicoBase):
    id_remito_biologico: int