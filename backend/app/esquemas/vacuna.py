from pydantic import BaseModel, Field


class VacunaBase(BaseModel):
    nombre: str = Field(min_length=1)
    descripcion: str = Field(min_length=1)
    precio: float = Field(gt=0)


class VacunaCrear(VacunaBase):
    pass


class VacunaActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=1)
    descripcion: str | None = Field(default=None, min_length=1)
    precio: float | None = Field(default=None, gt=0)


class VacunaRespuesta(VacunaBase):
    id_vacuna: int


class VacunaAplicadaCrear(BaseModel):
    id_vacuna: int = Field(gt=0)
    fecha_aplicacion: str = Field(min_length=1, description="Fecha en formato YYYY-MM-DD")
    lote: str | None = Field(default=None)
    proxima_dosis: str | None = Field(default=None)


class VacunaAplicadaRespuesta(BaseModel):
    id_vacuna_aplicada: int
    id_consulta: int
    id_vacuna: int
    nombre_vacuna: str | None = None
    fecha_aplicacion: str
    lote: str | None = None
    proxima_dosis: str | None = None