from datetime import datetime
from app.esquemas.consultas import ConsultaMedicaCrear, OrdenDerivacionCrear
from app.esquemas.vacuna import VacunaCrear
from app.esquemas.esquemaVacunal import EsquemaVacunalCrear
from app.persistencia.consulta_dao import ConsultaDAO
from app.persistencia.vacuna_dao import VacunaDAO
from app.persistencia.esquemaVacunal_dao import EsquemaVacunalDAO
from app.servicios.clinica_servicio import servicio_clinica
from app.persistencia.conexion import DatabaseSingleton


class ConsultasServicio:
    def __init__(self):
        self.consulta_dao = ConsultaDAO()
        self.vacuna_dao = VacunaDAO()
        self.esquema_dao = EsquemaVacunalDAO()
        self.db = DatabaseSingleton()

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
        mascota = servicio_clinica.obtener_mascota(datos.id_mascota)

        conn = self.db.get_conexion()
        # Verificar o crear historia clínica para la mascota
        cursor = conn.execute("SELECT id_historia_clinica FROM historias_clinicas WHERE id_mascota = ?", (datos.id_mascota,))
        hc = cursor.fetchone()
        if not hc:
            cursor = conn.execute(
                "INSERT INTO historias_clinicas (id_mascota, fecha_apertura) VALUES (?, datetime('now', 'localtime'))",
                (datos.id_mascota,)
            )
            id_hc = cursor.lastrowid
            conn.commit()
        else:
            id_hc = hc["id_historia_clinica"]

        # Obtener un ID de clínica y veterinario válidos por defecto
        cursor = conn.execute("SELECT id_veterinario, clinica_id FROM veterinarios LIMIT 1")
        vet = cursor.fetchone()
        vet_id = vet["id_veterinario"] if vet else 1
        clinica_id = vet["clinica_id"] if vet else 1

        advertencia = None
        if not datos.esquema_vacunas_al_dia:
            advertencia = (
                f"ALERTA SANITARIA: La mascota '{mascota['nombre']}' tiene vacunas obligatorias "
                f"pendientes para la especie {mascota['especie']}."
            )

        cursor = conn.execute(
            """
            INSERT INTO consultas (historia_clinica_id, veterinario_id, clinica_id, fecha_hora, tipo, motivo, diagnostico, tratamiento)
            VALUES (?, ?, ?, datetime('now', 'localtime'), 'consulta', ?, ?, ?)
            """,
            (id_hc, vet_id, clinica_id, datos.motivo, datos.diagnostico_preliminar, f"Esquema al día: {datos.esquema_vacunas_al_dia}")
        )
        conn.commit()
        id_consulta = cursor.lastrowid

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
        conn = self.db.get_conexion()
        cursor = conn.execute("SELECT 1 FROM consultas WHERE id_consulta = ?", (datos.id_consulta,))
        if not cursor.fetchone():
            raise KeyError(f"No existe la consulta con ID {datos.id_consulta}")

        # Tipo de análisis y laboratorio por defecto
        cursor = conn.execute("SELECT id_tipo_analisis FROM tipo_analisis LIMIT 1")
        tipo_row = cursor.fetchone()
        id_tipo = tipo_row["id_tipo_analisis"] if tipo_row else 1

        cursor = conn.execute("SELECT id_laboratorio FROM laboratorios LIMIT 1")
        lab_row = cursor.fetchone()
        id_lab = lab_row["id_laboratorio"] if lab_row else 1

        prioridad_valida = datos.prioridad.lower() if datos.prioridad.lower() in ["baja", "media", "alta"] else "media"

        cursor = conn.execute(
            """
            INSERT INTO ordenes_derivacion (id_consulta, tipo_analisis_id, id_laboratorio, fecha_emision, indicaciones, prioridad)
            VALUES (?, ?, ?, datetime('now', 'localtime'), ?, ?)
            """,
            (datos.id_consulta, id_tipo, id_lab, datos.observaciones, prioridad_valida)
        )
        conn.commit()
        id_orden = cursor.lastrowid

        return {
            "id_orden": id_orden,
            "id_consulta": datos.id_consulta,
            "tipo_analisis": datos.tipo_analisis,
            "prioridad": prioridad_valida,
            "observaciones": datos.observaciones,
            "fecha_emision": datetime.now().isoformat(),
        }

    def listar_ordenes(self) -> list[dict]:
        cursor = self.db.get_conexion().execute("SELECT * FROM ordenes_derivacion ORDER BY id_orden_derivacion DESC")
        return [dict(f) for f in cursor.fetchall()]

    def obtener_orden(self, id_orden: int) -> dict:
        cursor = self.db.get_conexion().execute(
            "SELECT * FROM ordenes_derivacion WHERE id_orden_derivacion = ?", (id_orden,)
        )
        fila = cursor.fetchone()
        if not fila:
            raise KeyError(f"No existe la orden con ID {id_orden}")
        return dict(fila)


servicio_consultas = ConsultasServicio()