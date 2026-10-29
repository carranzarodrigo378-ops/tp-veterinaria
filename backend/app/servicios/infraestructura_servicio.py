from app.esquemas.clinicas import ClinicaCrear, ClinicaActualizar
from app.esquemas.laboratorio import LaboratorioCrear, LaboratorioActualizar
from app.esquemas.contenedor import ContenedorCrear, ContenedorActualizar
from app.esquemas.tipoanalisis import TipoAnalisisCrear, TipoAnalisisActualizar
from app.persistencia.clinica_dao import ClinicaDAO
from app.persistencia.laboratorio_dao import LaboratorioDAO
from app.persistencia.contenedor_dao import ContenedorDAO
from app.persistencia.tipoAnalisis_dao import TipoAnalisisDAO


class InfraestructuraServicio:
    def __init__(self):
        self.clinica_dao = ClinicaDAO()
        self.laboratorio_dao = LaboratorioDAO()
        self.contenedor_dao = ContenedorDAO()
        self.tipo_analisis_dao = TipoAnalisisDAO()

    # --- CLÍNICAS ---
    def crear_clinica(self, datos: ClinicaCrear) -> dict:
        cid = self.clinica_dao.crear(datos)
        return self.clinica_dao.obtener_por_id(cid)

    def listar_clinicas(self) -> list[dict]:
        return self.clinica_dao.obtener_todos(limite=500)

    def actualizar_clinica(self, id_clinica: int, datos: ClinicaActualizar) -> dict:
        if not self.clinica_dao.existe(id_clinica):
            raise KeyError(f"No existe la clínica con ID {id_clinica}")
        self.clinica_dao.actualizar(id_clinica, datos)
        return self.clinica_dao.obtener_por_id(id_clinica)

    # --- LABORATORIOS ---
    def crear_laboratorio(self, datos: LaboratorioCrear) -> dict:
        lid = self.laboratorio_dao.crear(datos)
        return self.laboratorio_dao.obtener_por_id(lid)

    def listar_laboratorios(self) -> list[dict]:
        return self.laboratorio_dao.obtener_todos(limite=500)

    def actualizar_laboratorio(self, id_laboratorio: int, datos: LaboratorioActualizar) -> dict:
        if not self.laboratorio_dao.existe(id_laboratorio):
            raise KeyError(f"No existe el laboratorio con ID {id_laboratorio}")
        self.laboratorio_dao.actualizar(id_laboratorio, datos)
        return self.laboratorio_dao.obtener_por_id(id_laboratorio)

    # --- CONTENEDORES / CONSERVADORAS ---
    def crear_contenedor(self, datos: ContenedorCrear) -> dict:
        cid = self.contenedor_dao.crear(datos)
        return self.contenedor_dao.obtener_por_id(cid)

    def listar_contenedores(self) -> list[dict]:
        return self.contenedor_dao.obtener_todos(limite=500)

    def actualizar_contenedor(self, id_contenedor: int, datos: ContenedorActualizar) -> dict:
        if not self.contenedor_dao.existe(id_contenedor):
            raise KeyError(f"No existe el contenedor con ID {id_contenedor}")
        self.contenedor_dao.actualizar(id_contenedor, datos)
        return self.contenedor_dao.obtener_por_id(id_contenedor)

    # --- TIPOS DE ANÁLISIS ---
    def crear_tipo_analisis(self, datos: TipoAnalisisCrear) -> dict:
        aid = self.tipo_analisis_dao.crear(datos)
        return self.tipo_analisis_dao.obtener_por_id(aid)

    def listar_tipos_analisis(self) -> list[dict]:
        return self.tipo_analisis_dao.obtener_todos(limite=500)

    def actualizar_tipo_analisis(self, id_tipo_analisis: int, datos: TipoAnalisisActualizar) -> dict:
        if not self.tipo_analisis_dao.existe(id_tipo_analisis):
            raise KeyError(f"No existe el tipo de análisis con ID {id_tipo_analisis}")
        self.tipo_analisis_dao.actualizar(id_tipo_analisis, datos)
        return self.tipo_analisis_dao.obtener_por_id(id_tipo_analisis)


servicio_infraestructura = InfraestructuraServicio()