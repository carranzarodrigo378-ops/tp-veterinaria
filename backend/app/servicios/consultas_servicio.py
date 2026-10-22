from datetime import datetime
from app.esquemas.consultas import ConsultaMedicaCrear, OrdenDerivacionCrear
from app.esquemas.vacuna import VacunaCrear
from app.esquemas.esquemaVacunal import EsquemaVacunalCrear
from app.servicios.clinica_servicio import servicio_clinica


class ConsultasServicio:
    def __init__(self):
        self._consultas: dict[int, dict] = {}
        self._ordenes: dict[int, dict] = {}
        self._vacunas: dict[int, dict] = {}
        self._esquemas_vacunales: dict[int, dict] = {}
        self._contador_consultas = 1
        self._contador_ordenes = 1
        self._contador_vacunas = 1
        self._contador_esquemas = 1

    # --- GESTIÓN DE VACUNAS Y ESQUEMAS ---
    def registrar_vacuna(self, datos: VacunaCrear) -> dict:
        vacuna_id = self._contador_vacunas
        registro = {
            "id_vacuna": vacuna_id,
            "nombre": datos.nombre,
            "descripcion": datos.descripcion,
            "precio": datos.precio,
        }
        self._vacunas[vacuna_id] = registro
        self._contador_vacunas += 1
        return registro

    def registrar_esquema_vacunal(self, datos: EsquemaVacunalCrear) -> dict:
        if datos.id_vacuna not in self._vacunas:
            raise KeyError(f"La vacuna con ID {datos.id_vacuna} no existe.")
        
        esquema_id = self._contador_esquemas
        registro = {
            "id_esquema_vacunal": esquema_id,
            "id_vacuna": datos.id_vacuna,
            "especie": datos.especie.lower(),
            "edad_minima_semanas": datos.edad_minima_semanas,
            "intervalo_refuerzo_dias": datos.intervalo_refuerzo_dias,
            "obligatoria": datos.obligatoria,
        }
        self._esquemas_vacunales[esquema_id] = registro
        self._contador_esquemas += 1
        return registro

    # --- CONSULTAS MÉDICAS ---
    def registrar_consulta(self, datos: ConsultaMedicaCrear, veterinario: str) -> dict:
        # Validación: la mascota debe existir en la clínica
        mascota = servicio_clinica.obtener_mascota(datos.id_mascota)
        
        # Regla de negocio: control del esquema de vacunas obligatorias
        advertencia_vacunas = None
        if not datos.esquema_vacunas_al_dia:
            advertencia_vacunas = (
                f"ALERTA SANITARIA: La mascota '{mascota['nombre']}' tiene vacunas obligatorias "
                f"pendientes para la especie {mascota['especie']}."
            )

        consulta_id = self._contador_consultas
        registro_consulta = {
            "id_consulta": consulta_id,
            "id_mascota": datos.id_mascota,
            "fecha_atencion": datetime.now().isoformat(),
            "veterinario": veterinario,
            "motivo": datos.motivo,
            "diagnostico_preliminar": datos.diagnostico_preliminar,
            "esquema_vacunas_al_dia": datos.esquema_vacunas_al_dia,
            "advertencia_sanitaria": advertencia_vacunas,
        }
        self._consultas[consulta_id] = registro_consulta
        self._contador_consultas += 1
        return registro_consulta

    # --- ÓRDENES DE DERIVACIÓN ---
    def emitir_orden_derivacion(self, datos: OrdenDerivacionCrear) -> dict:
        if datos.id_consulta not in self._consultas:
            raise KeyError(f"No existe la consulta con ID {datos.id_consulta}")

        orden_id = self._contador_ordenes
        registro_orden = {
            "id_orden": orden_id,
            "id_consulta": datos.id_consulta,
            "tipo_analisis": datos.tipo_analisis,
            "prioridad": datos.prioridad,
            "observaciones": datos.observaciones,
            "fecha_emision": datetime.now().isoformat(),
        }
        self._ordenes[orden_id] = registro_orden
        self._contador_ordenes += 1
        return registro_orden

    def listar_ordenes(self) -> list[dict]:
        return list(self._ordenes.values())

    def obtener_orden(self, id_orden: int) -> dict:
        if id_orden not in self._ordenes:
            raise KeyError(f"No existe la orden con ID {id_orden}")
        return self._ordenes[id_orden]


servicio_consultas = ConsultasServicio()