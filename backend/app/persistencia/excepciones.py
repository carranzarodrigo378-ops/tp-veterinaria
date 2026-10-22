class ClienteDuplicadoError(ValueError):
    """Ya existe un cliente con ese DNI."""


class ClienteConMascotasError(ValueError):
    """No se puede eliminar: el cliente es responsable de mascotas."""
    
class ResponsableInexistenteError(ValueError):
    """El cliente responsable indicado no existe."""


class CampoObligatorioError(ValueError):
    """Falta un campo obligatorio."""