from datetime import datetime
from app.esquemas.consultas import ConsultaMedicaCrear, OrdenDerivacionCrear
from app.esquemas.vacuna import VacunaCrear
from app.esquemas.esquemaVacunal import EsquemaVacunalCrear
from app.persistencia.consulta_dao import consulta_dao  # <-- Importamos el DAO correcto
from app.persistencia.vacuna_dao import VacunaDAO
from app.persistencia.esquemaVacunal_dao import EsquemaVacunalDAO
from app.servicios.clinica_servicio import servicio_clinica


class ConsultasServicio:
    def __init__(self):
        self.consulta_dao = consulta_dao
        self.vacuna_dao = VacunaDAO()
        self.esquema_dao = EsquemaVacunalDAO()

    # --- LISTADOS Y CATÁLOGOS ---
    def listar_tipos_analisis(self) -> list[dict]:
        """Delega la búsqueda del catálogo al DAO"""
        return self.consulta_dao.listar_tipos_analisis()

    # --- VACUNAS Y ESQUEMAS ---
    def registrar_vacuna(self, datos: VacunaCrear) -> dict:
        vid = self.vacuna_dao.crear(datos)
        return self.vacuna_dao.obtener_por_id(vid)

    def registrar_esquema_vacunal(self, datos: EsquemaVacunalCrear) -> dict:
        if not self.vacuna_dao.existe(datos.id_vacuna):
            raise KeyError(f"La vacuna con ID {datos.id_vacuna} no existe.")
        eid = self.esquema_dao.crear(datos)
        return self.esquema_dao.obtener_por_id(eid)

    # --- CONSULTAS MÉDICAS ---
    def registrar_consulta(self, datos: ConsultaMedicaCrear, veterinario: str) -> dict:
        # Validación: existe la mascota
        mascota = servicio_clinica.obtener_mascota(datos.id_mascota)

        advertencia = None
        if not datos.esquema_vacunas_al_dia:
            advertencia = (
                f"ALERTA SANITARIA: La mascota '{mascota['nombre']}' tiene vacunas obligatorias "
                f"pendientes para la especie {mascota['especie']}."
            )

        # Delegamos al DAO la inserción (el DAO se encarga de buscar/crear la historia clínica)
        # Asumimos ID de veterinario 1 y clínica 1 (se puede mejorar si el front manda esos IDs)
        id_consulta = self.consulta_dao.crear_consulta_medica(
            id_mascota=datos.id_mascota,
            veterinario_id=1,
            motivo=datos.motivo,
            diagnostico=datos.diagnostico_preliminar,
            clinica_id=1
        )

        return {
            "id_consulta": id_consulta,
            "id_mascota": datos.id_mascota,
            "fecha_atencion": datetime.now().isoformat(),
            "veterinario": veterinario,
            "motivo": datos.motivo,
            "diagnostico_preliminar": datos.diagnostico_preliminar,
            "esquema_vacunas_al_dia": datos.esquema_vacunas_al_dia,
            "advertencia_sanitaria": advertencia,
        }

    # --- ÓRDENES DE DERIVACIÓN ---
    def emitir_orden_derivacion(self, datos: OrdenDerivacionCrear) -> dict:
        # Sanitizar prioridad
        prioridad_valida = datos.prioridad.lower() if datos.prioridad.lower() in ["baja", "media", "alta"] else "media"

        # Delegamos la lógica al DAO
        id_orden = self.consulta_dao.crear_orden_derivacion(
            id_consulta=datos.id_consulta,
            tipo_analisis_nombre=datos.tipo_analisis,
            prioridad=prioridad_valida,
            indicaciones=datos.observaciones
        )

        return {
            "id_orden": id_orden,
            "id_consulta": datos.id_consulta,
            "tipo_analisis": datos.tipo_analisis,
            "prioridad": prioridad_valida,
            "observaciones": datos.observaciones,
            "fecha_emision": datetime.now().isoformat(),
        }

    def listar_ordenes(self) -> list[dict]:
        # Lo ideal es que el DAO tenga un método, pero podemos hacer un atajo seguro aquí
        cursor = self.consulta_dao.db.get_conexion().execute(
            "SELECT * FROM ordenes_derivacion ORDER BY id_orden_derivacion DESC"
        )
        return [dict(f) for f in cursor.fetchall()]


servicio_consultas = ConsultasServicio()