from pydantic import BaseModel

class VeterinarioBase(BaseModel):
    nombre: str
    apellido: str
    matricula: str
    clinica_id: int
    
class VeterinarioCrear(VeterinarioBase):
    pass

class VeterinarioActualizar(BaseModel):
    nombre: str | None = None
    apellido: str | None = None
    matricula: str | None = None
    clinica_id: int | None = None

class VeterinarioRespuesta(VeterinarioBase):
    id_veterinario: int