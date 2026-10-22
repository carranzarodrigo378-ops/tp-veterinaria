from pydantic import BaseModel, Field


class EsquemaVacunalBase(BaseModel):
    id_vacuna: int  # FK a vacunas
    especie: str = Field(min_length=1)
    edad_minima_semanas: int | None = Field(default=None, ge=0)
    intervalo_refuerzo_dias: int | None = Field(default=None, ge=0)
    obligatoria: bool = True


class EsquemaVacunalCrear(EsquemaVacunalBase):
    pass


class EsquemaVacunalActualizar(BaseModel):
    especie: str | None = Field(default=None, min_length=1)
    edad_minima_semanas: int | None = Field(default=None, ge=0)
    intervalo_refuerzo_dias: int | None = Field(default=None, ge=0)
    obligatoria: bool | None = None


class EsquemaVacunalRespuesta(EsquemaVacunalBase):
    id_esquema_vacunal: int