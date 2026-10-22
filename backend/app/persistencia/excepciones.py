class ClienteDuplicadoError(ValueError):
    """Ya existe un cliente con ese DNI."""


class ClienteConMascotasError(ValueError):
    """No se puede eliminar: el cliente es responsable de mascotas."""