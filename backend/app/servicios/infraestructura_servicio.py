from app.esquemas.clinicas import ClinicaCrear, ClinicaActualizar
from app.esquemas.laboratorio import LaboratorioCrear, LaboratorioActualizar
from app.esquemas.contenedor import ContenedorCrear, ContenedorActualizar
from app.esquemas.tipoanalisis import TipoAnalisisCrear, TipoAnalisisActualizar
from app.esquemas.enums import EstadoContenedor, TipoMuestra


class InfraestructuraServicio:
    def __init__(self):
        self._clinicas: dict[int, dict] = {}
        self._laboratorios: dict[int, dict] = {}
        self._contenedores: dict[int, dict] = {}
        self._tipos_analisis: dict[int, dict] = {}

        self._contador_clinicas = 1
        self._contador_laboratorios = 1
        self._contador_contenedores = 1
        self._contador_analisis = 1

    # --- CLÍNICAS ---
    def crear_clinica(self, datos: ClinicaCrear) -> dict:
        cid = self._contador_clinicas
        registro = datos.model_dump()
        registro["id_clinica"] = cid
        self._clinicas[cid] = registro
        self._contador_clinicas += 1
        return registro

    def listar_clinicas(self) -> list[dict]:
        return list(self._clinicas.values())

    def actualizar_clinica(self, id_clinica: int, datos: ClinicaActualizar) -> dict:
        if id_clinica not in self._clinicas:
            raise KeyError(f"No existe la clínica con ID {id_clinica}")
        clinica = self._clinicas[id_clinica]
        for clave, valor in datos.model_dump(exclude_unset=True).items():
            clinica[clave] = valor
        return clinica

    # --- LABORATORIOS ---
    def crear_laboratorio(self, datos: LaboratorioCrear) -> dict:
        lid = self._contador_laboratorios
        registro = datos.model_dump()
        registro["id_laboratorio"] = lid
        self._laboratorios[lid] = registro
        self._contador_laboratorios += 1
        return registro

    def listar_laboratorios(self) -> list[dict]:
        return list(self._laboratorios.values())

    def actualizar_laboratorio(self, id_laboratorio: int, datos: LaboratorioActualizar) -> dict:
        if id_laboratorio not in self._laboratorios:
            raise KeyError(f"No existe el laboratorio con ID {id_laboratorio}")
        lab = self._laboratorios[id_laboratorio]
        for clave, valor in datos.model_dump(exclude_unset=True).items():
            lab[clave] = valor
        return lab

    # --- CONTENEDORES / CONSERVADORAS ---
    def crear_contenedor(self, datos: ContenedorCrear) -> dict:
        cid = self._contador_contenedores
        registro = datos.model_dump()
        registro["id_contenedor"] = cid
        if isinstance(registro.get("estado"), EstadoContenedor):
            registro["estado"] = registro["estado"].value
        self._contenedores[cid] = registro
        self._contador_contenedores += 1
        return registro

    def listar_contenedores(self) -> list[dict]:
        return list(self._contenedores.values())

    def actualizar_contenedor(self, id_contenedor: int, datos: ContenedorActualizar) -> dict:
        if id_contenedor not in self._contenedores:
            raise KeyError(f"No existe el contenedor con ID {id_contenedor}")
        cont = self._contenedores[id_contenedor]
        for clave, valor in datos.model_dump(exclude_unset=True).items():
            if isinstance(valor, EstadoContenedor):
                valor = valor.value
            cont[clave] = valor
        return cont

    # --- CATÁLOGO DE TIPOS DE ANÁLISIS ---
    def crear_tipo_analisis(self, datos: TipoAnalisisCrear) -> dict:
        # Validación de unicidad de nombre
        for t in self._tipos_analisis.values():
            if t["nombre"].lower() == datos.nombre.lower():
                raise ValueError(f"Ya existe un tipo de análisis con el nombre '{datos.nombre}'")

        aid = self._contador_analisis
        registro = datos.model_dump()
        registro["id_tipo_analisis"] = aid
        if isinstance(registro.get("tipo_muestra"), TipoMuestra):
            registro["tipo_muestra"] = registro["tipo_muestra"].value
        self._tipos_analisis[aid] = registro
        self._contador_analisis += 1
        return registro

    def listar_tipos_analisis(self) -> list[dict]:
        return list(self._tipos_analisis.values())

    def actualizar_tipo_analisis(self, id_tipo_analisis: int, datos: TipoAnalisisActualizar) -> dict:
        if id_tipo_analisis not in self._tipos_analisis:
            raise KeyError(f"No existe el tipo de análisis con ID {id_tipo_analisis}")
        analisis = self._tipos_analisis[id_tipo_analisis]
        for clave, valor in datos.model_dump(exclude_unset=True).items():
            if isinstance(valor, TipoMuestra):
                valor = valor.value
            analisis[clave] = valor
        return analisis


servicio_infraestructura = InfraestructuraServicio()