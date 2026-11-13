import unicodedata
from datetime import datetime
from app.esquemas.consultas import ConsultaMedicaCrear, OrdenDerivacionCrear
from app.esquemas.vacuna import VacunaCrear, VacunaAplicadaCrear
from app.esquemas.esquemaVacunal import EsquemaVacunalCrear
from app.persistencia.consulta_dao import consulta_dao
from app.persistencia.vacuna_dao import VacunaDAO
from app.persistencia.esquemaVacunal_dao import EsquemaVacunalDAO
from app.servicios.clinica_servicio import servicio_clinica


def _normalizar_texto(texto: str | None) -> str:
    if not texto:
        return ""
    sin_acentos = "".join(
        c for c in unicodedata.normalize("NFD", str(texto)) if unicodedata.category(c) != "Mn"
    )
    return sin_acentos.lower().strip()


def _extraer_fecha_iso(valor: str | None) -> str:
    if not valor:
        return datetime.now().strftime("%Y-%m-%d")
    return str(valor).strip()[:10]


class ConsultasServicio:
    def __init__(self):
        self.consulta_dao = consulta_dao
        self.vacuna_dao = VacunaDAO()
        self.esquema_dao = EsquemaVacunalDAO()

    # --- LISTADOS Y CATÁLOGOS ---
    def listar_tipos_analisis(self) -> list[dict]:
        """Delega la búsqueda del catálogo al DAO"""
        return self.consulta_dao.listar_tipos_analisis()

    def listar_vacunas(self) -> list[dict]:
        """Devuelve todas las vacunas disponibles en el catálogo."""
        return self.vacuna_dao.listar_catalogo()

    # --- VACUNAS Y ESQUEMAS ---
    def registrar_vacuna(self, datos: VacunaCrear) -> dict:
        vid = self.vacuna_dao.crear(datos)
        return self.vacuna_dao.obtener_por_id(vid)

    def registrar_esquema_vacunal(self, datos: EsquemaVacunalCrear) -> dict:
        if not self.vacuna_dao.existe(datos.id_vacuna):
            raise KeyError(f"La vacuna con ID {datos.id_vacuna} no existe.")
        eid = self.esquema_dao.crear(datos)
        return self.esquema_dao.obtener_por_id(eid)

    # --- VALIDACIÓN DE SERVICIO DE VACUNACIÓN EN BACKEND ---
    def _es_turno_vacunacion(self, turno: dict | None) -> bool:
        if not turno:
            return False
        servicio_norm = _normalizar_texto(turno.get("servicio"))
        motivo_norm = _normalizar_texto(turno.get("motivo"))
        return "vacun" in servicio_norm or "vacun" in motivo_norm

    def _preparar_y_validar_vacunas(
        self,
        lista_vacunas: list[VacunaAplicadaCrear],
        fecha_obligatoria: str,
    ) -> list[dict]:
        hoy_iso = datetime.now().strftime("%Y-%m-%d")
        fecha_piso = max(fecha_obligatoria, hoy_iso)

        preparadas = []
        for v in lista_vacunas:
            if not self.vacuna_dao.existe(v.id_vacuna):
                raise KeyError(f"La vacuna con ID {v.id_vacuna} no existe en el catálogo.")

            fecha_enviada = _extraer_fecha_iso(v.fecha_aplicacion)
            if fecha_enviada != fecha_obligatoria:
                raise ValueError(
                    f"La fecha de aplicación ({fecha_enviada}) debe coincidir con la fecha de la consulta/turno ({fecha_obligatoria})."
                )

            lote_limpio = v.lote.strip() if v.lote and v.lote.strip() else None
            prox_limpia = (
                v.proxima_dosis.strip() if v.proxima_dosis and v.proxima_dosis.strip() else None
            )

            if prox_limpia:
                prox_iso = _extraer_fecha_iso(prox_limpia)
                if prox_iso <= hoy_iso or prox_iso <= fecha_obligatoria:
                    raise ValueError(
                        f"La fecha de la próxima dosis ({prox_iso}) debe ser estrictamente posterior a la fecha actual ({hoy_iso}) y a la fecha del turno ({fecha_obligatoria})."
                    )
                prox_limpia = prox_iso

            preparadas.append(
                {
                    "id_vacuna": v.id_vacuna,
                    "fecha_aplicacion": fecha_obligatoria,
                    "lote": lote_limpio,
                    "proxima_dosis": prox_limpia,
                }
            )
        return preparadas

    # --- CONSULTAS MÉDICAS ---
    def registrar_consulta(self, datos: ConsultaMedicaCrear, veterinario: str) -> dict:
        # 1. Validación: existe la mascota
        mascota = servicio_clinica.obtener_mascota(datos.id_mascota)

        # 2. Si viene id_turno o vacunas_aplicadas, verificamos el turno real en la BD
        turno = None
        if datos.id_turno is not None:
            turno = self.consulta_dao.obtener_turno_por_id(datos.id_turno)
            if not turno:
                raise KeyError(f"No existe el turno con ID {datos.id_turno}.")
            if int(turno["mascota_id"]) != int(datos.id_mascota):
                raise ValueError("El turno indicado no corresponde a la mascota seleccionada.")

        vacunas_para_insertar = []
        if datos.vacunas_aplicadas:
            if datos.id_turno is None or not self._es_turno_vacunacion(turno):
                raise ValueError(
                    "Solo se pueden registrar vacunas aplicadas cuando la atención corresponde a un turno de vacunación."
                )
            fecha_turno = _extraer_fecha_iso(
                turno.get("fecha_hora_inicio") or turno.get("fecha_hora")
            )
            vacunas_para_insertar = self._preparar_y_validar_vacunas(
                datos.vacunas_aplicadas, fecha_obligatoria=fecha_turno
            )

        advertencia = None
        if not datos.esquema_vacunas_al_dia:
            advertencia = (
                f"ALERTA SANITARIA: La mascota '{mascota['nombre']}' tiene vacunas obligatorias "
                f"pendientes para la especie {mascota['especie']}."
            )

        # 3. Inserción atómica de consulta + vacunas_aplicadas
        id_consulta = self.consulta_dao.crear_consulta_medica(
            id_mascota=datos.id_mascota,
            veterinario_id=1,
            motivo=datos.motivo,
            diagnostico=datos.diagnostico_preliminar,
            clinica_id=1,
            turno_id=datos.id_turno,
            vacunas_aplicadas=vacunas_para_insertar,
        )

        aplicadas_guardadas = (
            self.vacuna_dao.obtener_aplicadas_por_consulta(id_consulta)
            if vacunas_para_insertar
            else []
        )

        return {
            "id_consulta": id_consulta,
            "id_mascota": datos.id_mascota,
            "id_turno": datos.id_turno,
            "fecha_atencion": datetime.now().isoformat(),
            "veterinario": veterinario,
            "motivo": datos.motivo,
            "diagnostico_preliminar": datos.diagnostico_preliminar,
            "esquema_vacunas_al_dia": datos.esquema_vacunas_al_dia,
            "advertencia_sanitaria": advertencia,
            "vacunas_aplicadas": aplicadas_guardadas,
        }

    def registrar_vacunas_en_consulta(
        self,
        id_consulta: int,
        vacunas: list[VacunaAplicadaCrear],
        id_turno: int | None = None,
    ) -> list[dict]:
        """Registra vacunas aplicadas asociadas a una consulta existente verificando que sea de vacunación."""
        consulta = self.consulta_dao.obtener_por_id(id_consulta)
        if not consulta:
            raise KeyError(f"No existe la consulta con ID {id_consulta}.")

        turno_id_efectivo = consulta.get("turno_id") or id_turno
        if not turno_id_efectivo:
            raise ValueError("La consulta no tiene un turno de vacunación asociado.")

        turno = self.consulta_dao.obtener_turno_por_id(int(turno_id_efectivo))
        if not self._es_turno_vacunacion(turno):
            raise ValueError(
                "No se pueden registrar vacunas aplicadas porque el turno no corresponde al servicio de vacunación."
            )

        if not vacunas:
            raise ValueError("Debe indicar al menos una vacuna aplicada.")

        fecha_turno = _extraer_fecha_iso(
            turno.get("fecha_hora_inicio") or turno.get("fecha_hora") or consulta.get("fecha_hora")
        )
        preparadas = self._preparar_y_validar_vacunas(
            vacunas, fecha_obligatoria=fecha_turno
        )
        self.consulta_dao.registrar_vacunas_aplicadas(id_consulta, preparadas)
        return self.vacuna_dao.obtener_aplicadas_por_consulta(id_consulta)

    # --- ÓRDENES DE DERIVACIÓN ---
    def emitir_orden_derivacion(self, datos: OrdenDerivacionCrear) -> dict:
        prioridad_valida = (
            datos.prioridad.lower()
            if datos.prioridad.lower() in ["baja", "media", "alta"]
            else "media"
        )

        id_orden = self.consulta_dao.crear_orden_derivacion(
            id_consulta=datos.id_consulta,
            tipo_analisis_nombre=datos.tipo_analisis,
            prioridad=prioridad_valida,
            indicaciones=datos.observaciones,
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
        cursor = self.consulta_dao.db.get_conexion().execute(
            "SELECT * FROM ordenes_derivacion ORDER BY id_orden_derivacion DESC"
        )
        return [dict(f) for f in cursor.fetchall()]


servicio_consultas = ConsultasServicio()