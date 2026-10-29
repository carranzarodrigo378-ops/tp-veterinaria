from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.rutas import (
    auth,
    muestras,
    clientes_mascotas,
    consultas,
    infraestructura,
    reportes,
)
from app.persistencia.conexion import DatabaseSingleton
from app.core.seguridad import hashear_password

# 1. Crear las tablas si no existen según schema.sql
db = DatabaseSingleton()
db.inicializar_esquema()


# 2. Carga de datos semilla estructurales para evitar errores de Foreign Keys
def cargar_datos_semilla():
    conn = db.get_conexion()
    cursor = conn.cursor()

    # Sede central obligatoria
    cursor.execute("SELECT COUNT(*) FROM clinicas")
    if cursor.fetchone()[0] == 0:
        cursor.execute(
            """
            INSERT INTO clinicas (nombre, direccion, telefono, activa) 
            VALUES (?, ?, ?, 1)
            """,
            ("Sede Central Veterinaria", "Av. Colón 1200", "351-4445555"),
        )

    # Veterinario Jefe / Administrador y Veterinario de planta asociados a la sede central
    cursor.execute("SELECT COUNT(*) FROM veterinarios")
    if cursor.fetchone()[0] == 0:
        cursor.executemany(
            """
            INSERT INTO veterinarios (nombre, apellido, matricula, clinica_id) 
            VALUES (?, ?, ?, ?)
            """,
            [
                ("Administrador", "General", "MP-0001", 1),
                ("Franco", "Veterinario", "MP-4589", 1),
            ],
        )

    # Laboratorio central de derivación
    cursor.execute("SELECT COUNT(*) FROM laboratorios")
    if cursor.fetchone()[0] == 0:
        cursor.execute(
            """
            INSERT INTO laboratorios (nombre, direccion, telefono) 
            VALUES (?, ?, ?)
            """,
            ("Laboratorio Central BioVet", "Bv. Chacabuco 500", "351-7778888"),
        )

    # Catálogo base de tipos de análisis clínicos
    cursor.execute("SELECT COUNT(*) FROM tipo_analisis")
    if cursor.fetchone()[0] == 0:
        cursor.executemany(
            """
            INSERT INTO tipo_analisis (nombre, tipo_muestra, precio, temperatura_almacenamiento_c) 
            VALUES (?, ?, ?, ?)
            """,
            [
                ("Hemograma Completo", "sangre", 15000.0, 4.0),
                ("Perfil Renal", "sangre", 18500.0, 4.0),
                ("Sedimento Urinario", "orina", 12000.0, 2.0),
            ],
        )

    # Usuarios iniciales del sistema en la tabla usuarios
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'"
    )
    if cursor.fetchone():
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        if cursor.fetchone()[0] == 0:
            cursor.executemany(
                """
                INSERT INTO usuarios (usuario, password_hash, rol, nombre, apellido, email, telefono, matricula, id_cliente, id_veterinario) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        "admin",
                        hashear_password("admin123"),
                        "admin",
                        "Administrador",
                        "General",
                        "admin@veterinaria.com",
                        "351-4445555",
                        "MP-0001",
                        None,
                        1,
                    ),
                    (
                        "vet_franco",
                        hashear_password("vet123"),
                        "veterinario",
                        "Dr. Franco",
                        "Veterinario",
                        "franco@veterinaria.com",
                        "351-5556666",
                        "MP-4589",
                        None,
                        2,
                    ),
                ],
            )

    conn.commit()


cargar_datos_semilla()

app = FastAPI(
    title="Red de Clínicas Veterinarias y Laboratorio Central",
    description=(
        "Sistema integral para atención veterinaria, derivación de muestras biológicas "
        "y laboratorio central con trazabilidad inmutable mediante el patrón State (DAO 2026)."
    ),
    version="1.0.0",
)

# Configuración explícita de orígenes CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de routers
app.include_router(auth.router)
app.include_router(clientes_mascotas.router)
app.include_router(consultas.router)
app.include_router(muestras.router)
app.include_router(infraestructura.router)
app.include_router(reportes.router)


@app.get("/health", tags=["Salud"])
def health():
    return {"status": "ok"}


@app.get("/", tags=["Inicio"])
def inicio():
    return {
        "sistema": "Red de Clínicas y Laboratorio Central",
        "materia": "Desarrollo de Aplicaciones con Objetos",
        "estado": "En línea",
        "documentacion": "/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)