import re
from typing import Annotated

from pydantic import AfterValidator

_CARACTERES_VALIDOS = re.compile(r"^\+?[\d\s\-()]+$", re.ASCII)


def validar_telefono(valor: str) -> str:
    valor = valor.strip()
    if not _CARACTERES_VALIDOS.fullmatch(valor):
        raise ValueError(
            "El teléfono solo puede tener números, espacios, guiones, paréntesis y un + inicial"
        )
    digitos = re.sub(r"\D", "", valor)
    if not 8 <= len(digitos) <= 15:
        raise ValueError("El teléfono debe tener entre 8 y 15 dígitos")
    return valor


Telefono = Annotated[str, AfterValidator(validar_telefono)]