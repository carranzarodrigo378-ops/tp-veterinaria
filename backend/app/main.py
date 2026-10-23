from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.rutas import auth, muestras, clientes_mascotas, consultas, infraestructura, reportes

app = FastAPI(
    title="Red de Clínicas Veterinarias y Laboratorio Central",
    description=(
        "Sistema integral para atención veterinaria, derivación de muestras biológicas "
        "y laboratorio central con trazabilidad inmutable mediante el patrón State (DAO 2026)."
    ),
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
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
        "documentacion": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

