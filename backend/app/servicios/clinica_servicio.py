from app.esquemas.clientes import ClienteCrear, ClienteActualizar
from app.esquemas.mascotas import MascotaCrear, MascotaActualizar
from app.esquemas.enums import Sexo
from app.persistencia.cliente_dao import ClienteDAO
from app.persistencia.mascota_dao import MascotaDAO
from app.persistencia.excepciones import (
    ResponsableInexistenteError,
    ClienteDuplicadoError,
    ClienteConMascotasError,
)


class ClinicaServicio:
    def __init__(self, cliente_dao: ClienteDAO = None, mascota_dao: MascotaDAO = None):
        self.cliente_dao = cliente_dao or ClienteDAO()
        self.mascota_dao = mascota_dao or MascotaDAO()

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


servicio_clinica = ClinicaServicio()