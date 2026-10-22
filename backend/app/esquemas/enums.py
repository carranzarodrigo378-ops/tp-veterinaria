import enum


class Sexo(str, enum.Enum):
    macho = "macho"
    hembra = "hembra"