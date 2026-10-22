from pydantic import BaseModel
from datetime import datetime
from app.esquemas.enums import TipoItemComprobante

class ItemComprobanteBase(BaseModel):
    tipo: TipoItemComprobante
    descripcion: str
    cantidad: int
    precio_unitario: float

class ItemComprobanteCrear(ItemComprobanteBase):
    pass

class ItemComprobanteRespuesta(ItemComprobanteBase):
    id_item_comprobante: int
    comprobante_id: int

class ComprobanteBase(BaseModel):
    numero: int
    consulta_id: int
    clinica_id: int
    cliente_id: int
    fecha_emision: datetime
    total: float

class ComprobanteCrear(ComprobanteBase):
    items: list[ItemComprobanteCrear] 

class ComprobanteRespuesta(ComprobanteBase):
    id_comprobante: int