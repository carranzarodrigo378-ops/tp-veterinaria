-- Esquema de la base de datos (SQLite)
-- Se ejecuta al iniciar la app; IF NOT EXISTS lo hace seguro de correr siempre.
-- Fechas: TEXT/DATETIME en formato ISO (YYYY-MM-DD o YYYY-MM-DD HH:MM:SS)

-- ==================== CLÍNICA ====================

CREATE TABLE IF NOT EXISTS clientes (
    id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre     TEXT NOT NULL,
    apellido   TEXT NOT NULL,
    dni        TEXT NOT NULL UNIQUE,
    telefono   TEXT NOT NULL,
    email      TEXT,
    direccion  TEXT,
    activo     BOOLEAN NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS mascotas (
    id_mascota       INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre           TEXT NOT NULL,
    especie          TEXT NOT NULL,
    raza             TEXT,
    sexo             TEXT NOT NULL CHECK (sexo IN ('macho', 'hembra')),
    fecha_nacimiento TEXT,
    id_cliente       INTEGER NOT NULL,  -- responsable obligatorio
    activo           BOOLEAN NOT NULL DEFAULT 1,
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
    veterinario_id    INTEGER,  -- NULL cuando el cliente pide turno; se asigna al ser atendido
    mascota_id        INTEGER NOT NULL,
    estado            TEXT NOT NULL DEFAULT 'programado' CHECK (estado IN ('programado', 'atendido', 'cancelado')),
    motivo            TEXT,
    servicio          TEXT,
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

-- ==================== SEGURIDAD Y USUARIOS ====================

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario     INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario        TEXT NOT NULL UNIQUE,
    password_hash  TEXT NOT NULL,
    rol            TEXT NOT NULL CHECK (rol IN ('admin', 'veterinario', 'laboratorio', 'cliente')),
    nombre         TEXT NOT NULL,
    apellido       TEXT NOT NULL,
    email          TEXT,
    telefono       TEXT,
    matricula      TEXT,
    id_cliente     INTEGER,
    id_veterinario INTEGER,
    FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente),
    FOREIGN KEY (id_veterinario) REFERENCES veterinarios (id_veterinario)
);

-- =========================================================================
-- ==================== DATOS SEMILLA UNIFICADOS (SEED) ====================
-- =========================================================================

-- 1. Clínica, Laboratorio Central, Contenedores, Tipos de Análisis y Vacunas
INSERT OR IGNORE INTO clinicas (id_clinica, nombre, direccion, telefono, activa) VALUES
(1, 'Clínica Veterinaria Central', 'Av. Vélez Sarsfield 1250, Córdoba', '3514200100', 1);

INSERT OR IGNORE INTO laboratorios (id_laboratorio, nombre, direccion, telefono) VALUES
(1, 'Laboratorio Biológico Central Vet2Gö', 'Bv. Chacabuco 540, Córdoba', '3514300200');

INSERT OR IGNORE INTO contenedores (id_contenedor, codigo, capacidad_muestras, temperatura_objetivo_c, estado) VALUES
(1, 'CONT-ISO-01', 20, 4.0, 'en_uso'),
(2, 'CONT-ISO-02', 15, 4.0, 'disponible');

INSERT OR IGNORE INTO tipo_analisis (id_tipo_analisis, nombre, tipo_muestra, precio, temperatura_almacenamiento_c) VALUES
(1, 'Hemograma Completo', 'sangre', 12000, 4.0),
(2, 'Perfil Bioquímico Renal y Hepático', 'sangre', 15500, 4.0),
(3, 'Urianálisis Completo y Sedimento', 'orina', 9500, 4.0),
(4, 'Citología e Histopatología', 'tejido', 18000, 4.0),
(5, 'Coproparasitológico Seriado', 'otro', 8500, 4.0);

INSERT OR IGNORE INTO vacunas (id_vacuna, nombre, descripcion, precio) VALUES
(1, 'Antirrábica Anual', 'Vacuna obligatoria contra el virus de la rabia', 10000),
(2, 'Séxtuple Canina', 'Moquillo, Parvovirus, Adenovirus, Parainfluenza y Leptospira', 14000),
(3, 'Triple Felina', 'Rinotraqueítis, Calicivirus y Panleucopenia felina', 13500);

-- 2. Cuatro Clientes
INSERT OR IGNORE INTO clientes (id_cliente, nombre, apellido, dni, telefono, email, direccion, activo) VALUES
(1, 'Juan', 'Pérez', '35111222', '3515111222', 'juan.perez@email.com', 'Av. Colón 1450', 1),
(2, 'María', 'Gómez', '38222333', '3515222333', 'maria.gomez@email.com', 'Obispo Trejo 850', 1),
(3, 'Lucas', 'Rodríguez', '40333444', '3515333444', 'lucas.rodriguez@email.com', 'Av. Rafael Núñez 3900', 1),
(4, 'Sofía', 'Martínez', '42444555', '3515444555', 'sofia.martinez@email.com', 'Gral. Paz 420', 1);

-- 3. Ocho Mascotas (2 por cliente: perro, gato, ave, conejo, otro)
INSERT OR IGNORE INTO mascotas (id_mascota, nombre, especie, raza, sexo, fecha_nacimiento, id_cliente, activo) VALUES
(1, 'Rocco', 'perro', 'Ovejero Alemán', 'macho', '2021-05-14', 1, 1),
(2, 'Mishi', 'gato', 'Siamés', 'hembra', '2022-08-20', 1, 1),
(3, 'Paco', 'ave', 'Loro Amazónico', 'macho', '2020-11-10', 2, 1),
(4, 'Copito', 'conejo', 'Cabeza de León', 'hembra', '2023-02-15', 2, 1),
(5, 'Thor', 'perro', 'Golden Retriever', 'macho', '2019-09-03', 3, 1),
(6, 'Tortu', 'otro', 'Tortuga Terrestre', 'hembra', '2018-01-25', 3, 1),
(7, 'Luna', 'gato', 'Mestizo Europeo', 'hembra', '2022-04-12', 4, 1),
(8, 'Tambor', 'conejo', 'Californiano', 'macho', '2023-07-08', 4, 1);

-- 4. Historias Clínicas (1 a 1 con cada mascota)
INSERT OR IGNORE INTO historias_clinicas (id_historia_clinica, id_mascota, fecha_apertura, observaciones) VALUES
(1, 1, '2026-01-10', 'Historia clínica inicial - Rocco'),
(2, 2, '2026-01-10', 'Historia clínica inicial - Mishi'),
(3, 3, '2026-01-12', 'Historia clínica inicial - Paco'),
(4, 4, '2026-01-12', 'Historia clínica inicial - Copito'),
(5, 5, '2026-01-15', 'Historia clínica inicial - Thor'),
(6, 6, '2026-01-15', 'Historia clínica inicial - Tortu'),
(7, 7, '2026-01-18', 'Historia clínica inicial - Luna'),
(8, 8, '2026-01-18', 'Historia clínica inicial - Tambor');

-- 5. Dos Veterinarios
INSERT OR IGNORE INTO veterinarios (id_veterinario, nombre, apellido, matricula, clinica_id) VALUES
(1, 'Franco', 'Gutiérrez', 'MP-1001', 1),
(2, 'Paola', 'Benítez', 'MP-1002', 1);

-- 6. Usuarios (1 Admin, 1 Laboratorio 'labo1', 2 Veterinarios, 4 Clientes)
INSERT OR IGNORE INTO usuarios (id_usuario, usuario, password_hash, rol, nombre, apellido, email, telefono, matricula, id_cliente, id_veterinario) VALUES
(1, 'admin', '1234', 'admin', 'Administrador', 'General', 'admin@vet2go.com', '3514000001', 'MP-0001', NULL, NULL),
(2, 'labo1', 'Labo123', 'laboratorio', 'Operador', 'Laboratorio', 'labo1@vet2go.com', '3514000002', NULL, NULL, NULL),
(3, 'vet_franco', '1234', 'veterinario', 'Franco', 'Gutiérrez', 'franco@vet2go.com', '3514000003', 'MP-1001', NULL, 1),
(4, 'vet_paola', '1234', 'veterinario', 'Paola', 'Benítez', 'paola@vet2go.com', '3514000004', 'MP-1002', NULL, 2),
(5, 'juan', '1234', 'cliente', 'Juan', 'Pérez', 'juan.perez@email.com', '3515111222', NULL, 1, NULL),
(6, 'maria', '1234', 'cliente', 'María', 'Gómez', 'maria.gomez@email.com', '3515222333', NULL, 2, NULL),
(7, 'lucas', '1234', 'cliente', 'Lucas', 'Rodríguez', 'lucas.rodriguez@email.com', '3515333444', NULL, 3, NULL),
(8, 'sofia', '1234', 'cliente', 'Sofía', 'Martínez', 'sofia.martinez@email.com', '3515444555', NULL, 4, NULL);

-- 7. Consultas, Órdenes de Derivación, Remitos, Precintos y Muestras de Prueba
-- (Necesarios para que el INNER JOIN de Laboratorio muestre datos desde el inicio)
INSERT OR IGNORE INTO consultas (id_consulta, historia_clinica_id, veterinario_id, clinica_id, turno_id, fecha_hora, tipo, motivo, diagnostico, tratamiento, peso_kg) VALUES
(1, 1, 1, 1, NULL, '2026-11-12 09:00:00', 'consulta', 'Control prequirúrgico y decaimiento', 'Sospecha de anemia leve', 'Solicito Hemograma Completo', 32.5),
(2, 2, 2, 1, NULL, '2026-11-12 09:30:00', 'consulta', 'Polidipsia y poliuria', 'Control renal preventivo', 'Solicito Urianálisis Completo', 4.2),
(3, 5, 1, 1, NULL, '2026-11-12 10:00:00', 'urgencia', 'Vómitos y letargo agudo', 'Evaluación hepática urgente', 'Solicito Perfil Bioquímico', 29.0);

INSERT OR IGNORE INTO ordenes_derivacion (id_orden_derivacion, id_consulta, tipo_analisis_id, id_laboratorio, fecha_emision, indicaciones, prioridad) VALUES
(1, 1, 1, 1, '2026-11-12 09:10:00', 'Ayuno de 8 hs cumplido', 'media'),
(2, 2, 3, 1, '2026-11-12 09:40:00', 'Muestra refrigerada a 4°C', 'alta'),
(3, 3, 2, 1, '2026-11-12 10:10:00', 'Urgencia clínica', 'alta');

INSERT OR IGNORE INTO precintos (id_precinto, codigo, estado, fecha_colocacion) VALUES
(1, 'PREC-0001-9015', 'intacto', '2026-11-12 09:20:00'),
(2, 'PREC-0002-9045', 'intacto', '2026-11-12 09:50:00');

INSERT OR IGNORE INTO remitos_biologicos (id_remito_biologico, numero_remito, clinica_origen_id, laboratorio_destino_id, contenedor_id, precinto_id, fecha_emision, estado) VALUES
(1, 'REM-0001-9015', 1, 1, 1, 1, '2026-11-12 09:20:00', 'en_transito'),
(2, 'REM-0002-9045', 1, 1, 2, 2, '2026-11-12 09:50:00', 'recibido');

INSERT OR IGNORE INTO muestras (id_muestra, orden_derivacion_id, remito_id, codigo, tipo, fecha_extraccion, estado_actual) VALUES
-- Muestra 1: Ya está EN TRÁNSITO (lista para que 'labo1' verifique el precinto en LaboratorioOnly.jsx)
(1, 1, 1, 'MUE-2026-001', 'sangre', '2026-11-12 09:15:00', 'en_transito'),
-- Muestra 2: Ya está RECIBIDA (lista para que 'labo1' cargue el resultado y lo envíe de vuelta)
(2, 2, 2, 'MUE-2026-002', 'orina', '2026-11-12 09:45:00', 'recibida'),
-- Muestra 3: Está EXTRAÍDA en la clínica (lista para que 'vet_franco' la empaquete y despache en LaboratorioPage.jsx)
(3, 3, NULL, 'MUE-2026-003', 'sangre', '2026-11-12 10:15:00', 'extraida');

INSERT OR IGNORE INTO historial_estado_muestras (id_historial_estado_muestra, muestra_id, estado, fecha_hora, usuario, observaciones) VALUES
(1, 1, 'extraida', '2026-11-12 09:15:00', 'vet_franco', 'Extracción inicial de muestra biológica'),
(2, 1, 'empaquetada', '2026-11-12 09:20:00', 'vet_franco', 'Empaquetada en CONT-ISO-01 con precinto PREC-0001-9015'),
(3, 1, 'en_transito', '2026-11-12 09:25:00', 'Transporte Vet2Gö', 'Despachada hacia Laboratorio Central'),
(4, 2, 'extraida', '2026-11-12 09:45:00', 'vet_paola', 'Extracción inicial de muestra biológica'),
(5, 2, 'empaquetada', '2026-11-12 09:50:00', 'vet_paola', 'Empaquetada en CONT-ISO-02 con precinto PREC-0002-9045'),
(6, 2, 'en_transito', '2026-11-12 09:55:00', 'Transporte Vet2Gö', 'Despachada hacia Laboratorio Central'),
(7, 2, 'recibida', '2026-11-12 10:10:00', 'labo1', 'Precinto verificado intacto en recepción'),
(8, 3, 'extraida', '2026-11-12 10:15:00', 'vet_franco', 'Extracción inicial en guardia');