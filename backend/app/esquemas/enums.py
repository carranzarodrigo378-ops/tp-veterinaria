import enum


class Sexo(str, enum.Enum):
    macho = "macho"
    hembra = "hembra"


class EstadoTurno(str, enum.Enum):
    programado = "programado"
    atendido = "atendido"
    cancelado = "cancelado"


class TipoConsulta(str, enum.Enum):
    consulta = "consulta"
    control = "control"
    urgencia = "urgencia"


class TipoMuestra(str, enum.Enum):
    sangre = "sangre"
    orina = "orina"
    tejido = "tejido"
    otro = "otro"


class Prioridad(str, enum.Enum):
    baja = "baja"
    media = "media"
    alta = "alta"


class EstadoMuestra(str, enum.Enum):
    extraida = "extraida"
    empaquetada = "empaquetada"
    en_transito = "en_transito"
    recibida = "recibida"
    analizada = "analizada"
    rechazada = "rechazada"


class EstadoContenedor(str, enum.Enum):
    disponible = "disponible"
    en_uso = "en_uso"
    mantenimiento = "mantenimiento"


class EstadoPrecinto(str, enum.Enum):
    intacto = "intacto"
    roto = "roto"


class EstadoRemito(str, enum.Enum):
    armado = "armado"
    precintado = "precintado"
    en_transito = "en_transito"
    recibido = "recibido"
    rechazado = "rechazado"


class TipoEventoEnvio(str, enum.Enum):
    despachado = "despachado"
    en_ruta = "en_ruta"
    entregado = "entregado"


class TipoItemComprobante(str, enum.Enum):
    consulta = "consulta"
    vacuna = "vacuna"
    analisis_laboratorio = "analisis_laboratorio"