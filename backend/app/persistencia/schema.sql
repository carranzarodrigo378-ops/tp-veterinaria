-- Esquema de la base de datos (SQLite)
-- Se ejecuta al iniciar la app; IF NOT EXISTS lo hace seguro de correr siempre.
-- Fechas: TEXT/DATETIME en formato ISO (YYYY-MM-DD o YYYY-MM-DD HH:MM:SS)

-- ==================== USUARIOS ====================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('admin', 'veterinario', 'cliente')),
    activo BOOLEAN NOT NULL DEFAULT 1
);

-- ==================== CLÍNICA ====================

CREATE TABLE IF NOT EXISTS clientes (
    id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre     TEXT NOT NULL,
    apellido   TEXT NOT NULL,
    dni        TEXT NOT NULL UNIQUE,
    telefono   TEXT NOT NULL,
    email      TEXT,
    direccion  TEXT
);

CREATE TABLE IF NOT EXISTS mascotas (
    id_mascota       INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre           TEXT NOT NULL,
    especie          TEXT NOT NULL,
    raza             TEXT,
    sexo             TEXT NOT NULL CHECK (sexo IN ('macho', 'hembra')),
    fecha_nacimiento TEXT,
    id_cliente       INTEGER NOT NULL,  -- responsable obligatorio
    FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente)
);

CREATE TABLE IF NOT EXISTS clinicas (
    id_clinica INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre     TEXT NOT NULL,
    direccion  TEXT NOT NULL,
    telefono   TEXT NOT NULL,
    activa     BOOLEAN NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS veterinarios (
    id_veterinario INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre         TEXT NOT NULL,
    apellido       TEXT NOT NULL,
    matricula      TEXT NOT NULL UNIQUE,
    clinica_id     INTEGER NOT NULL,
    FOREIGN KEY (clinica_id) REFERENCES clinicas (id_clinica)
);

CREATE TABLE IF NOT EXISTS historias_clinicas (
    id_historia_clinica INTEGER PRIMARY KEY AUTOINCREMENT,
    id_mascota          INTEGER NOT NULL UNIQUE,  -- 1 a 1 con mascota
    fecha_apertura      TEXT NOT NULL,
    fecha_cierre        TEXT,
    observaciones       TEXT,
    FOREIGN KEY (id_mascota) REFERENCES mascotas (id_mascota)
);

-- ==================== ATENCIÓN ====================

CREATE TABLE IF NOT EXISTS turnos (
    id_turno          INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_hora_inicio DATETIME NOT NULL,
    fecha_hora_fin    DATETIME NOT NULL,
    veterinario_id    INTEGER NOT NULL,
    mascota_id        INTEGER NOT NULL,
    estado            TEXT NOT NULL CHECK (estado IN ('programado', 'atendido', 'cancelado')),
    FOREIGN KEY (mascota_id) REFERENCES mascotas (id_mascota),
    FOREIGN KEY (veterinario_id) REFERENCES veterinarios (id_veterinario)
);

CREATE TABLE IF NOT EXISTS consultas (
    id_consulta         INTEGER PRIMARY KEY AUTOINCREMENT,
    historia_clinica_id INTEGER NOT NULL,
    veterinario_id      INTEGER NOT NULL,
    clinica_id          INTEGER NOT NULL,
    turno_id            INTEGER,  -- NULL en urgencias sin turno
    fecha_hora          DATETIME NOT NULL,
    tipo                TEXT NOT NULL CHECK (tipo IN ('consulta', 'control', 'urgencia')),
    motivo              TEXT,
    diagnostico         TEXT,
    tratamiento         TEXT,
    peso_kg             FLOAT,
    FOREIGN KEY (historia_clinica_id) REFERENCES historias_clinicas (id_historia_clinica),
    FOREIGN KEY (veterinario_id) REFERENCES veterinarios (id_veterinario),
    FOREIGN KEY (clinica_id) REFERENCES clinicas (id_clinica),
    FOREIGN KEY (turno_id) REFERENCES turnos (id_turno)
);

CREATE TABLE IF NOT EXISTS vacunas (
    id_vacuna   INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre      TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    precio      DECIMAL
);

CREATE TABLE IF NOT EXISTS esquema_vacunal (
    id_esquema_vacunal      INTEGER PRIMARY KEY AUTOINCREMENT,
    id_vacuna               INTEGER NOT NULL,
    especie                 TEXT NOT NULL,
    edad_minima_semanas     INTEGER,
    intervalo_refuerzo_dias INTEGER,
    obligatoria             BOOLEAN NOT NULL DEFAULT 1,
    FOREIGN KEY (id_vacuna) REFERENCES vacunas (id_vacuna)
);

CREATE TABLE IF NOT EXISTS vacunas_aplicadas (
    id_vacuna_aplicada INTEGER PRIMARY KEY AUTOINCREMENT,
    id_consulta        INTEGER NOT NULL,
    id_vacuna          INTEGER NOT NULL,
    fecha_aplicacion   TEXT NOT NULL,
    lote               TEXT,
    proxima_dosis      TEXT,
    FOREIGN KEY (id_consulta) REFERENCES consultas (id_consulta),
    FOREIGN KEY (id_vacuna) REFERENCES vacunas (id_vacuna)
);

-- ==================== DERIVACIÓN ====================

CREATE TABLE IF NOT EXISTS laboratorios (
    id_laboratorio INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre         TEXT NOT NULL,
    direccion      TEXT,
    telefono       TEXT
);

CREATE TABLE IF NOT EXISTS tipo_analisis (
    id_tipo_analisis             INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre                       TEXT NOT NULL UNIQUE,
    tipo_muestra                 TEXT NOT NULL CHECK (tipo_muestra IN ('sangre', 'orina', 'tejido', 'otro')),
    precio                       DECIMAL,
    temperatura_almacenamiento_c DECIMAL
);

CREATE TABLE IF NOT EXISTS ordenes_derivacion (
    id_orden_derivacion INTEGER PRIMARY KEY AUTOINCREMENT,
    id_consulta         INTEGER NOT NULL,
    tipo_analisis_id    INTEGER NOT NULL,
    id_laboratorio      INTEGER NOT NULL,
    fecha_emision       DATETIME NOT NULL,
    indicaciones        TEXT,
    prioridad           TEXT NOT NULL CHECK (prioridad IN ('baja', 'media', 'alta')),
    FOREIGN KEY (id_consulta) REFERENCES consultas (id_consulta),
    FOREIGN KEY (tipo_analisis_id) REFERENCES tipo_analisis (id_tipo_analisis),
    FOREIGN KEY (id_laboratorio) REFERENCES laboratorios (id_laboratorio)
);

-- ==================== TRANSPORTE Y TRAZABILIDAD ====================

CREATE TABLE IF NOT EXISTS contenedores (
    id_contenedor          INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo                 TEXT NOT NULL UNIQUE,
    capacidad_muestras     INTEGER NOT NULL,
    temperatura_objetivo_c DECIMAL,
    estado                 TEXT NOT NULL CHECK (estado IN ('disponible', 'en_uso', 'mantenimiento'))
);

CREATE TABLE IF NOT EXISTS precintos (
    id_precinto      INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo           TEXT NOT NULL UNIQUE,
    estado           TEXT NOT NULL CHECK (estado IN ('intacto', 'roto')),
    fecha_colocacion DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS remitos_biologicos (
    id_remito_biologico    INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_remito          TEXT NOT NULL UNIQUE,
    clinica_origen_id      INTEGER NOT NULL,
    laboratorio_destino_id INTEGER NOT NULL,
    contenedor_id          INTEGER NOT NULL,
    precinto_id            INTEGER NOT NULL UNIQUE,
    fecha_emision          DATETIME NOT NULL,
    estado                 TEXT NOT NULL CHECK (estado IN ('armado', 'precintado', 'en_transito', 'recibido', 'rechazado')),
    FOREIGN KEY (clinica_origen_id) REFERENCES clinicas (id_clinica),
    FOREIGN KEY (laboratorio_destino_id) REFERENCES laboratorios (id_laboratorio),
    FOREIGN KEY (contenedor_id) REFERENCES contenedores (id_contenedor),
    FOREIGN KEY (precinto_id) REFERENCES precintos (id_precinto)
);

CREATE TABLE IF NOT EXISTS muestras (
    id_muestra          INTEGER PRIMARY KEY AUTOINCREMENT,
    orden_derivacion_id INTEGER NOT NULL,
    remito_id           INTEGER,  -- NULL hasta que se empaqueta
    codigo              TEXT NOT NULL UNIQUE,
    tipo                TEXT,
    fecha_extraccion    DATETIME NOT NULL,
    estado_actual       TEXT NOT NULL DEFAULT 'extraida'
        CHECK (estado_actual IN ('extraida', 'empaquetada', 'en_transito', 'recibida', 'analizada', 'rechazada')),
    FOREIGN KEY (orden_derivacion_id) REFERENCES ordenes_derivacion (id_orden_derivacion),
    FOREIGN KEY (remito_id) REFERENCES remitos_biologicos (id_remito_biologico)
);

-- Historial de estados: SOLO se inserta (inmutable)
CREATE TABLE IF NOT EXISTS historial_estado_muestras (
    id_historial_estado_muestra INTEGER PRIMARY KEY AUTOINCREMENT,
    muestra_id                  INTEGER NOT NULL,
    estado                      TEXT NOT NULL
        CHECK (estado IN ('extraida', 'empaquetada', 'en_transito', 'recibida', 'analizada', 'rechazada')),
    fecha_hora                  DATETIME NOT NULL,
    usuario                     TEXT,
    observaciones               TEXT,
    FOREIGN KEY (muestra_id) REFERENCES muestras (id_muestra)
);

CREATE TRIGGER IF NOT EXISTS historial_no_update
BEFORE UPDATE ON historial_estado_muestras
BEGIN
    SELECT RAISE(ABORT, 'El historial de estados es inmutable');
END;

CREATE TRIGGER IF NOT EXISTS historial_no_delete
BEFORE DELETE ON historial_estado_muestras
BEGIN
    SELECT RAISE(ABORT, 'El historial de estados es inmutable');
END;

CREATE TABLE IF NOT EXISTS eventos_envio (
    id_evento_envio     INTEGER PRIMARY KEY AUTOINCREMENT,
    remito_biologico_id INTEGER NOT NULL,
    tipo                TEXT NOT NULL CHECK (tipo IN ('despachado', 'en_ruta', 'entregado')),
    fecha_hora          DATETIME NOT NULL,
    responsable         TEXT,
    observaciones       TEXT,
    FOREIGN KEY (remito_biologico_id) REFERENCES remitos_biologicos (id_remito_biologico)
);

CREATE TABLE IF NOT EXISTS recepciones_lab (
    id_recepcion_lab        INTEGER PRIMARY KEY AUTOINCREMENT,
    remito_biologico_id     INTEGER NOT NULL UNIQUE,  -- un remito se recibe una vez
    fecha_hora              DATETIME NOT NULL,
    recibido_por            TEXT,
    estado_precinto         TEXT NOT NULL CHECK (estado_precinto IN ('intacto', 'roto')),
    temperatura_recepcion_c DECIMAL,
    observaciones           TEXT,
    FOREIGN KEY (remito_biologico_id) REFERENCES remitos_biologicos (id_remito_biologico)
);

CREATE TABLE IF NOT EXISTS resultados_analisis (
    id_resultado_analisis INTEGER PRIMARY KEY AUTOINCREMENT,
    muestra_id            INTEGER NOT NULL UNIQUE,  -- un resultado por muestra
    fecha_resultado       DATETIME NOT NULL,
    resultado             TEXT NOT NULL,
    validado_por          TEXT,
    FOREIGN KEY (muestra_id) REFERENCES muestras (id_muestra)
);

-- ==================== FACTURACIÓN ====================

CREATE TABLE IF NOT EXISTS comprobantes (
    id_comprobante INTEGER PRIMARY KEY AUTOINCREMENT,
    numero         BIGINT NOT NULL UNIQUE,
    consulta_id    INTEGER NOT NULL,
    clinica_id     INTEGER NOT NULL,
    cliente_id     INTEGER NOT NULL,
    fecha_emision  DATETIME NOT NULL,
    total          DECIMAL NOT NULL,
    FOREIGN KEY (consulta_id) REFERENCES consultas (id_consulta),
    FOREIGN KEY (clinica_id) REFERENCES clinicas (id_clinica),
    FOREIGN KEY (cliente_id) REFERENCES clientes (id_cliente)
);

CREATE TABLE IF NOT EXISTS item_comprobante (
    id_item_comprobante INTEGER PRIMARY KEY AUTOINCREMENT,
    comprobante_id      INTEGER NOT NULL,
    tipo                TEXT NOT NULL CHECK (tipo IN ('consulta', 'vacuna', 'analisis_laboratorio')),
    descripcion         TEXT NOT NULL,
    cantidad            INTEGER NOT NULL,
    precio_unitario     DECIMAL NOT NULL,
    FOREIGN KEY (comprobante_id) REFERENCES comprobantes (id_comprobante)
);

-- ==================== ÍNDICES ====================

CREATE INDEX IF NOT EXISTS idx_mascotas_cliente ON mascotas (id_cliente);
CREATE INDEX IF NOT EXISTS idx_consultas_historia ON consultas (historia_clinica_id);
CREATE INDEX IF NOT EXISTS idx_turnos_veterinario ON turnos (veterinario_id, fecha_hora_inicio);
CREATE INDEX IF NOT EXISTS idx_muestras_remito ON muestras (remito_id);
CREATE INDEX IF NOT EXISTS idx_historial_muestra ON historial_estado_muestras (muestra_id);