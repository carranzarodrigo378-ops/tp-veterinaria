class ClienteDuplicadoError(ValueError):
    """Ya existe un cliente con ese DNI."""

class ClienteConMascotasError(ValueError):
    """No se puede eliminar: el cliente es responsable de mascotas."""
    
class ResponsableInexistenteError(ValueError):
    """El cliente responsable indicado no existe."""

class CampoObligatorioError(ValueError):
    """Falta un campo obligatorio."""

class EntidadDuplicadaError(ValueError):
    """Ya existe un registro con ese código, matrícula o identificador único."""

class InmutabilidadError(ValueError):
    """No se permite modificar o eliminar este registro por reglas de trazabilidad."""