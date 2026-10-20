# Veterinaria: Red de Clínicas y Derivación de Laboratorio

TP Integrador 2026 (Tema 2) de **Desarrollo de Aplicaciones con Objetos**, UTN FRC.

Sistema que integra la atención clínica veterinaria con la derivación de muestras biológicas a un laboratorio central, garantizando la trazabilidad completa (cadena de custodia) desde la extracción hasta el diagnóstico.

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Python 3.12 + FastAPI |
| Frontend | React (Vite) |
| Tests | pytest |
| CI | GitHub Actions |

## Estructura del repo

```
tp-veterinaria/
├── backend/        # API FastAPI
│   ├── app/        # código de la aplicación
│   └── tests/      # tests con pytest
├── frontend/       # app React (Vite)
├── docs/           # consigna, diagramas, decisiones de diseño
└── .github/        # workflows de CI
```

## Requisitos

- [Python 3.12+](https://www.python.org/downloads/) (en Windows, tildar *Add python.exe to PATH* al instalar)
- [Node.js 20+](https://nodejs.org/)
- [Git](https://git-scm.com/)

## Puesta en marcha

### 1. Clonar el repo

```bash
git clone <URL_DEL_REPO>
cd tp-veterinaria
```

### 2. Backend

```bash
cd backend
python -m venv .venv
```

Activar el entorno virtual:

```powershell
# Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

```bash
# Mac / Linux / Git Bash
source .venv/bin/activate
```

> Si PowerShell bloquea la activación, ejecutar una vez:
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

Instalar dependencias y levantar el servidor:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Documentación interactiva (Swagger): http://localhost:8000/docs
- Health check: http://localhost:8000/health

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173

### 4. Variables de entorno

Si el backend tiene un archivo `.env.example`, copiarlo a `.env` y completar los valores:

```powershell
# Windows (PowerShell)
Copy-Item backend\.env.example backend\.env
```

```bash
# Mac / Linux / Git Bash
cp backend/.env.example backend/.env
```

**Nunca subir el archivo `.env` al repositorio.**

## Tests

```bash
cd backend
pytest
```

## Flujo de trabajo en equipo

1. `main` siempre debe funcionar. **No se pushea directo a `main`.**
2. Cada tarea va en una rama propia:
   ```bash
   git checkout main
   git pull
   git checkout -b feat/nombre-de-la-tarea
   ```
3. Commits chicos y descriptivos, con prefijo:
   - `feat:` nueva funcionalidad
   - `fix:` corrección de un bug
   - `docs:` documentación
   - `test:` tests
   - `chore:` configuración, dependencias, etc.
4. Subir la rama y abrir un Pull Request:
   ```bash
   git push -u origin feat/nombre-de-la-tarea
   ```
5. Otro integrante revisa el PR y, con el CI en verde, se mergea a `main`.

Si instalan una dependencia nueva en el backend, actualizar `requirements.txt` (`pip freeze > requirements.txt`) y avisar al equipo.

## Integrantes

| Integrante | Módulo a cargo |
|------------|----------------|
| _Nombre_ | _Ej: clientes y mascotas_ |
| _Nombre_ | _Ej: consultas y derivaciones_ |
| _Nombre_ | _Ej: muestras, remitos y trazabilidad_ |
| _Nombre_ | _Ej: reportes_ |

## Documentación

La consigna, los diagramas y las decisiones de diseño (patrones aplicados, ciclo de vida de la muestra y del remito biológico) van en la carpeta [`docs/`](docs/).
