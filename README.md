# Veterinaria: red de clínicas y derivación de laboratorio

TP Integrador 2026 (Tema 2) de Desarrollo de Aplicaciones con Objetos, UTN FRC.

Este proyecto consiste en una solución para gestionar la atención veterinaria y la derivación de muestras biológicas a un laboratorio central. El sistema busca mantener la trazabilidad completa de cada caso, desde la atención clínica hasta la recepción del resultado, garantizando la cadena de custodia y la integridad de la información.

## Descripción general

La aplicación está dividida en dos capas principales:

- Backend: API REST desarrollada con Python y FastAPI.
- Frontend: interfaz web desarrollada con React + Vite.

El sistema cubre procesos como:

- gestión de pacientes y propietarios
- registro de turnos y consultas veterinarias
- derivación de muestras a laboratorio
- trazabilidad de remitos y muestras
- control de estados del caso
- generación de reportes y consultas de seguimiento

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Python 3.12 + FastAPI |
| Frontend | React + Vite |
| Estilos | CSS / Tailwind |
| Testing | pytest |
| CI/CD | GitHub Actions |
| Gestión de paquetes | pip + npm |

## Estructura del repositorio

```text
tp-veterinaria/
├── backend/                  # API y lógica de negocio
│   ├── app/                  # código principal de la API
│   ├── tests/                # pruebas automatizadas con pytest
│   ├── requirements.txt      # dependencias del backend
│   └── pytest.ini            # configuración de pytest
├── frontend/                 # aplicación web
│   ├── src/                  # componentes, rutas y lógica del cliente
│   ├── public/               # assets estáticos
│   ├── package.json          # dependencias y scripts del frontend
│   ├── vite.config.js        # configuración de Vite
│   └── tailwind.config.js    # configuración de Tailwind
├── docs/                     # consignas, diagramas y decisiones de diseño
├── .github/                  # workflows de integración continua
├── README.md                 # documentación principal
├── package.json              # dependencias del proyecto raíz (si aplica)
├── package-lock.json         # lockfile del proyecto raíz
└── .gitignore                # archivos ignorados por git
```

## Requisitos previos

Antes de levantar el proyecto, asegurate de tener instalado:

- [Python 3.12+](https://www.python.org/downloads/)
- [Node.js 20+](https://nodejs.org/)
- [Git](https://git-scm.com/)

> En Windows, al instalar Python marcá la opción “Add python.exe to PATH”.

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPO>
cd tp-veterinaria
```

### 2. Configurar y levantar el backend

```bash
cd backend
python -m venv .venv
```

Activá el entorno virtual:

```powershell
# Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

```bash
# macOS / Linux / Git Bash
source .venv/bin/activate
```

Si PowerShell bloquea la ejecución, podés habilitarlo con:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Instalá dependencias y levantá la API:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

La API quedará disponible en:

- http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### 3. Levantar el frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

La aplicación web quedará disponible en:

- http://localhost:5173

### 4. Variables de entorno

Si el backend incluye un archivo `.env.example`, copialo a `.env` y completá los valores necesarios:

```powershell
# Windows (PowerShell)
Copy-Item backend\.env.example backend\.env
```

```bash
# macOS / Linux / Git Bash
cp backend/.env.example backend/.env
```

> Nunca subas el archivo `.env` al repositorio.

## Tests

Para correr la suite del backend:

```bash
cd backend
pytest
```

## Flujo de trabajo en equipo

1. `main` debe mantenerse siempre en estado funcional. No se hace push directo a `main`.
2. Cada tarea se trabaja en una rama propia.

```bash
git checkout main
git pull
git checkout -b feat/nombre-de-la-tarea
```

3. Los commits deben ser pequeños y descriptivos, utilizando prefijos como:
   - `feat:` nueva funcionalidad
   - `fix:` corrección de bug
   - `docs:` documentación
   - `test:` pruebas
   - `chore:` configuración y mantenimiento

4. Subir la rama y abrir un Pull Request:

```bash
git push -u origin feat/nombre-de-la-tarea
```

5. Otro integrante revisa el PR y, con CI en verde, se hace merge a `main`.

Si agregan una dependencia nueva en el backend, recuerden actualizar `requirements.txt` con:

```bash
pip freeze > requirements.txt
```

## Integrantes

| Integrante | Módulo a cargo |
|------------|----------------|
| _Nombre_ | _Ej: clientes y mascotas_ |
| _Nombre_ | _Ej: consultas y derivaciones_ |
| _Nombre_ | _Ej: muestras, remitos y trazabilidad_ |
| _Nombre_ | _Ej: reportes_ |

## Documentación

La consignas del trabajo práctico, los diagramas y las decisiones de diseño se encuentran en la carpeta [`docs/`](docs/).

También podrán encontrar información sobre el flujo de la muestra, el remito biológico y los patrones aplicados en la solución.

## Estado del proyecto

Este repositorio está en desarrollo activo como trabajo integrador, con una estructura preparada para crecer en funcionalidades, pruebas y documentación técnica.

---

Si querés, también puedo dejarte una versión más “profesional” del README con logo, badges y una sección de screenshots o arquitectura del sistema.