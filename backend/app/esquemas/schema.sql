-- Esquema de la base de datos (SQLite)
-- Se ejecuta al iniciar la app; IF NOT EXISTS lo hace seguro de correr siempre.

CREATE TABLE IF NOT EXISTS clientes (
    id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre     TEXT NOT NULL,
    apellido   TEXT NOT NULL,
    dni        TEXT NOT NULL UNIQUE,
    telefono   TEXT NOT NULL
    email      TEXT, 
    direccion  TEXT 
);

CREATE TABLE IF NOT EXISTS mascotas (
    id_mascota       INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre           TEXT NOT NULL,
    especie          TEXT NOT NULL,
    raza             TEXT,
    sexo             TEXT NOT NULL CHECK (sexo IN ('macho', 'hembra')),
    fecha_nacimiento TEXT,  -- formato ISO: YYYY-MM-DD
    id_cliente       INTEGER NOT NULL,  -- responsable obligatorio
    FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente)
);

CREATE INDEX IF NOT EXISTS idx_mascotas_cliente ON mascotas (id_cliente);