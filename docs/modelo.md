# Modelo de entidades

Diagrama de clases del sistema de Veterinaria: Red de Clínicas y Derivación de Laboratorio.

```mermaid
classDiagram
    Cliente "1" --> "1..*" Mascota : responsable de
    Mascota "1" --> "1" HistoriaClinica
    Clinica "1" --> "*" Veterinario
    Veterinario "1" --> "*" Turno
    Mascota "1" --> "*" Turno
    HistoriaClinica "1" --> "*" Consulta
    Veterinario "1" --> "*" Consulta
    Clinica "1" --> "*" Consulta
    Consulta "1" --> "*" VacunaAplicada
    Consulta "1" --> "0..*" OrdenDerivacion
    OrdenDerivacion "*" --> "1" TipoAnalisis
    OrdenDerivacion "1" --> "1..*" Muestra
    Muestra "1" --> "*" HistorialEstadoMuestra : inmutable
    Muestra "*" --> "0..1" RemitoBiologico
    RemitoBiologico "1" --> "1" Contenedor
    RemitoBiologico "1" --> "1" Precinto
    RemitoBiologico "*" --> "1" Clinica : origen
    RemitoBiologico "*" --> "1" Laboratorio : destino
    RemitoBiologico "1" --> "*" EventoEnvio : cadena de envio
    RemitoBiologico "1" --> "0..1" RecepcionLab
    RecepcionLab --> Precinto : verifica estado
    Muestra "1" --> "0..1" ResultadoAnalisis
    Consulta "1" --> "0..1" Comprobante
    Comprobante "1" --> "*" ItemComprobante

    class Mascota {
        +int id
        +string nombre
        +string especie
        +date fechaNacimiento
        +int clienteId
    }
    class Muestra {
        +int id
        +string tipo
        +datetime fechaExtraccion
        +EstadoMuestra estado
    }
    class HistorialEstadoMuestra {
        +string estado
        +datetime fechaHora
        +string observacion
    }
    class RemitoBiologico {
        +string numero
        +datetime fecha
        +string estado
    }
    class Precinto {
        +string codigo
        +string estado
    }
    class Contenedor {
        +string codigo
        +float temperaturaObjetivo
    }
```

## Ciclo de vida de la muestra

```mermaid
stateDiagram-v2
    [*] --> Extraida
    Extraida --> Empaquetada
    Empaquetada --> EnTransito
    EnTransito --> Recibida
    Recibida --> Analizada : precinto intacto
    Recibida --> Rechazada : precinto roto
    Analizada --> [*]
    Rechazada --> [*]
```

## Reglas de negocio

- Toda mascota tiene un cliente responsable (obligatorio).
- Si el precinto llega roto, la muestra pasa a **Rechazada** y no se procesa.
- El historial de estados de la muestra es inmutable: solo se agregan registros.
- No puede haber turnos superpuestos para un mismo veterinario.
- Al registrar una atención se controla el esquema de vacunas obligatorias.