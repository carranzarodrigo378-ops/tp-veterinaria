from datetime import date
from app.esquemas.mascotas import MascotaCrear, MascotaActualizar
from app.esquemas.enums import Sexo


class ClinicaServicio:
    def __init__(self, repositorio_clinica=None):
        self.repositorio = repositorio_clinica
        self._clientes: dict[int, dict] = {}
        self._mascotas: dict[int, dict] = {}
        self._contador_clientes = 1
        self._contador_mascotas = 1

    # --- CLIENTES ---
    def registrar_cliente(self, datos_cliente: dict) -> dict:
        cliente_id = self._contador_clientes
        cliente = {
            "id_cliente": cliente_id,
            "nombre": datos_cliente.get("nombre", ""),
            "apellido": datos_cliente.get("apellido", ""),
            "dni": datos_cliente.get("dni", ""),
            "telefono": datos_cliente.get("telefono", ""),
            "email": datos_cliente.get("email", ""),
        }
        self._clientes[cliente_id] = cliente
        self._contador_clientes += 1
        return cliente

    def listar_clientes(self) -> list[dict]:
        return list(self._clientes.values())

    def obtener_cliente(self, id_cliente: int) -> dict:
        if id_cliente not in self._clientes:
            raise KeyError(f"No existe el cliente con ID {id_cliente}")
        return self._clientes[id_cliente]

    # --- MASCOTAS ---
    def registrar_mascota(self, datos_mascota: MascotaCrear) -> dict:
        # Regla de negocio: Toda mascota tiene un cliente responsable (obligatorio)
        if datos_mascota.id_cliente not in self._clientes:
            raise ValueError(f"El cliente con ID {datos_mascota.id_cliente} no existe en el sistema.")

        mascota_id = self._contador_mascotas
        nueva_mascota = {
            "id_mascota": mascota_id,
            "nombre": datos_mascota.nombre,
            "especie": datos_mascota.especie,
            "raza": datos_mascota.raza,
            "sexo": datos_mascota.sexo.value if isinstance(datos_mascota.sexo, Sexo) else datos_mascota.sexo,
            "fecha_nacimiento": datos_mascota.fecha_nacimiento,
            "id_cliente": datos_mascota.id_cliente,
            "historial_clinico": "Historia clínica iniciada."
        }
        self._mascotas[mascota_id] = nueva_mascota
        self._contador_mascotas += 1
        return nueva_mascota

    def actualizar_mascota(self, id_mascota: int, datos_actualizacion: MascotaActualizar) -> dict:
        if id_mascota not in self._mascotas:
            raise KeyError(f"No existe la mascota con ID {id_mascota}")

        mascota = self._mascotas[id_mascota]
        datos_dict = datos_actualizacion.model_dump(exclude_unset=True)

        if "id_cliente" in datos_dict and datos_dict["id_cliente"] is not None:
            if datos_dict["id_cliente"] not in self._clientes:
                raise ValueError(f"El cliente con ID {datos_dict['id_cliente']} no existe.")

        if "sexo" in datos_dict and isinstance(datos_dict["sexo"], Sexo):
            datos_dict["sexo"] = datos_dict["sexo"].value

        for clave, valor in datos_dict.items():
            mascota[clave] = valor

        return mascota

    def cambiar_duenio_mascota(self, id_mascota: int, nuevo_id_cliente: int) -> dict:
        if id_mascota not in self._mascotas:
            raise KeyError(f"No existe la mascota con ID {id_mascota}")
        if nuevo_id_cliente not in self._clientes:
            raise ValueError(f"El nuevo cliente con ID {nuevo_id_cliente} no existe en el sistema.")

        self._mascotas[id_mascota]["id_cliente"] = nuevo_id_cliente
        return self._mascotas[id_mascota]

    def listar_mascotas_por_cliente(self, id_cliente: int) -> list[dict]:
        if id_cliente not in self._clientes:
            raise KeyError(f"El cliente con ID {id_cliente} no existe.")
        return [m for m in self._mascotas.values() if m["id_cliente"] == id_cliente]

    def obtener_mascota(self, id_mascota: int) -> dict:
        if id_mascota not in self._mascotas:
            raise KeyError(f"No existe la mascota con ID {id_mascota}")
        return self._mascotas[id_mascota]


servicio_clinica = ClinicaServicio()