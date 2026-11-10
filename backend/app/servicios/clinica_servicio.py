from app.esquemas.clientes import ClienteCrear, ClienteActualizar
from app.esquemas.mascotas import MascotaCrear, MascotaActualizar
from app.esquemas.enums import Sexo
from app.persistencia.cliente_dao import ClienteDAO
from app.persistencia.mascota_dao import MascotaDAO
from app.persistencia.conexion import DatabaseSingleton
from app.persistencia.excepciones import (
    ResponsableInexistenteError,
    ClienteDuplicadoError,
    ClienteConMascotasError,
)


class ClinicaServicio:
    def __init__(self, cliente_dao: ClienteDAO = None, mascota_dao: MascotaDAO = None):
        self.cliente_dao = cliente_dao or ClienteDAO()
        self.mascota_dao = mascota_dao or MascotaDAO()
        self.db = DatabaseSingleton()

    # --- CLIENTES ---
    def registrar_cliente(self, datos_cliente: dict) -> dict:
        # Valida con el esquema Pydantic para asegurar tipos y campos requeridos
        cliente_dto = ClienteCrear(**datos_cliente)
        id_cliente = self.cliente_dao.crear(cliente_dto)
        return self.obtener_cliente(id_cliente)

    def listar_clientes(self, incluir_inactivos: bool = False) -> list[dict]:
        return self.cliente_dao.obtener_todos(
            limite=500, incluir_inactivos=incluir_inactivos
        )

    def obtener_cliente(self, id_cliente: int) -> dict:
        cliente = self.cliente_dao.obtener_por_id(id_cliente)
        if not cliente:
            raise KeyError(f"No existe el cliente con ID {id_cliente}")
        return cliente

    def dar_baja_cliente(self, id_cliente: int) -> dict:
        """Baja lógica del cliente y sus mascotas asociadas."""
        if not self.cliente_dao.existe(id_cliente, incluir_inactivos=True):
            raise KeyError(f"No existe el cliente con ID {id_cliente}")
        self.cliente_dao.eliminar(id_cliente)
        return self.obtener_cliente(id_cliente)

    # --- MASCOTAS ---
    def listar_mascotas(self, incluir_inactivos: bool = False) -> list[dict]:
        return self.mascota_dao.obtener_todos(
            limite=500, incluir_inactivos=incluir_inactivos
        )

    def registrar_mascota(self, datos_mascota: MascotaCrear) -> dict:
        # Regla de negocio y validación de existencia del responsable activo
        if not self.cliente_dao.existe(datos_mascota.id_cliente):
            raise ValueError(
                f"El cliente con ID {datos_mascota.id_cliente} no existe o está dado de baja."
            )

        id_mascota = self.mascota_dao.crear(datos_mascota)
        return self.obtener_mascota(id_mascota)

    def actualizar_mascota(
        self, id_mascota: int, datos_actualizacion: MascotaActualizar
    ) -> dict:
        if not self.mascota_dao.existe(id_mascota, incluir_inactivos=True):
            raise KeyError(f"No existe la mascota con ID {id_mascota}")

        datos_dict = datos_actualizacion.model_dump(exclude_unset=True)
        if "id_cliente" in datos_dict and datos_dict["id_cliente"] is not None:
            if not self.cliente_dao.existe(datos_dict["id_cliente"]):
                raise ValueError(
                    f"El cliente con ID {datos_dict['id_cliente']} no existe o está inactivo."
                )

        self.mascota_dao.actualizar(id_mascota, datos_actualizacion)
        return self.obtener_mascota(id_mascota)

    def cambiar_duenio_mascota(self, id_mascota: int, nuevo_id_cliente: int) -> dict:
        if not self.mascota_dao.existe(id_mascota):
            raise KeyError(f"No existe la mascota con ID {id_mascota}")
        if not self.cliente_dao.existe(nuevo_id_cliente):
            raise ValueError(
                f"El nuevo cliente con ID {nuevo_id_cliente} no existe en el sistema."
            )

        actualizacion = MascotaActualizar(id_cliente=nuevo_id_cliente)
        self.mascota_dao.actualizar(id_mascota, actualizacion)
        return self.obtener_mascota(id_mascota)

    def dar_baja_mascota(self, id_mascota: int) -> dict:
        """Baja lógica de la mascota conservando su historial en la base de datos."""
        if not self.mascota_dao.existe(id_mascota, incluir_inactivos=True):
            raise KeyError(f"No existe la mascota con ID {id_mascota}")
        self.mascota_dao.eliminar(id_mascota)
        return self.obtener_mascota(id_mascota)

    def listar_mascotas_por_cliente(
        self, id_cliente: int, incluir_inactivos: bool = False
    ) -> list[dict]:
        if not self.cliente_dao.existe(id_cliente, incluir_inactivos=True):
            raise KeyError(f"El cliente con ID {id_cliente} no existe.")
        return self.mascota_dao.obtener_por_cliente(
            id_cliente, incluir_inactivos=incluir_inactivos
        )

    def obtener_mascota(self, id_mascota: int) -> dict:
        mascota = self.mascota_dao.obtener_por_id(id_mascota)
        if not mascota:
            raise KeyError(f"No existe la mascota con ID {id_mascota}")
        return mascota

    # --- TURNOS ---
    def listar_turnos(
        self,
        veterinario_id: int | None = None,
        id_mascota: int | None = None,
        fecha: str | None = None,
        estado: str | None = None,
    ) -> list[dict]:
        conn = self.db.get_conexion()
        query = """
            SELECT 
                t.id_turno,
                t.fecha_hora,
                t.motivo,
                t.estado,
                t.mascota_id AS id_mascota,
                m.nombre AS mascota_nombre,
                m.especie,
                c.id_cliente,
                c.nombre || ' ' || c.apellido AS cliente_nombre,
                t.veterinario_id AS id_veterinario,
                v.nombre || ' ' || v.apellido AS veterinario_nombre,
                t.clinica_id AS id_clinica,
                cl.nombre AS clinica_nombre
            FROM turnos t
            JOIN mascotas m ON t.mascota_id = m.id_mascota
            JOIN clientes c ON m.id_cliente = c.id_cliente
            JOIN veterinarios v ON t.veterinario_id = v.id_veterinario
            JOIN clinicas cl ON t.clinica_id = cl.id_clinica
            WHERE 1=1
        """
        params: list = []

        if veterinario_id is not None:
            query += " AND t.veterinario_id = ?"
            params.append(veterinario_id)
        if id_mascota is not None:
            query += " AND t.mascota_id = ?"
            params.append(id_mascota)
        if fecha:
            query += " AND date(t.fecha_hora) = date(?)"
            params.append(fecha)
        if estado:
            query += " AND t.estado = ?"
            params.append(estado)

        query += " ORDER BY t.fecha_hora ASC"
        cursor = conn.execute(query, tuple(params))
        return [dict(fila) for fila in cursor.fetchall()]

    def programar_turno(
        self,
        id_mascota: int,
        id_veterinario: int,
        fecha_hora: str,
        motivo: str,
        id_clinica: int = 1,
    ) -> dict:
        if not self.mascota_dao.existe(id_mascota):
            raise KeyError("La mascota indicada no existe o está dada de baja.")

        conn = self.db.get_conexion()
        cursor = conn.cursor()

        superpuesto = cursor.execute(
            """
            SELECT id_turno FROM turnos 
            WHERE veterinario_id = ? 
              AND fecha_hora = ? 
              AND estado = 'programado'
            """,
            (id_veterinario, fecha_hora),
        ).fetchone()

        if superpuesto:
            raise ValueError(
                "El veterinario seleccionado ya tiene un turno programado en ese horario."
            )

        cursor.execute(
            """
            INSERT INTO turnos (mascota_id, veterinario_id, clinica_id, fecha_hora, motivo, estado)
            VALUES (?, ?, ?, ?, ?, 'programado')
            """,
            (id_mascota, id_veterinario, id_clinica, fecha_hora, motivo),
        )
        conn.commit()
        return {
            "id_turno": cursor.lastrowid,
            "id_mascota": id_mascota,
            "id_veterinario": id_veterinario,
            "id_clinica": id_clinica,
            "fecha_hora": fecha_hora,
            "motivo": motivo,
            "estado": "programado",
        }

    def cambiar_estado_turno(self, id_turno: int, nuevo_estado: str) -> dict:
        conn = self.db.get_conexion()
        cursor = conn.execute(
            "UPDATE turnos SET estado = ? WHERE id_turno = ?",
            (nuevo_estado, id_turno),
        )
        conn.commit()
        if cursor.rowcount == 0:
            raise KeyError(f"No existe el turno con ID {id_turno}")
        return {
            "mensaje": "Estado del turno actualizado",
            "id_turno": id_turno,
            "estado": nuevo_estado,
        }


servicio_clinica = ClinicaServicio()