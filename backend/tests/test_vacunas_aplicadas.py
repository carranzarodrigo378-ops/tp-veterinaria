from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.core.seguridad import crear_token_acceso
from app.persistencia.conexion import DatabaseSingleton

client = TestClient(app)


def _crear_turno_prueba(mascota_id: int, servicio: str, motivo: str = "Atención programada") -> int:
    conn = DatabaseSingleton().get_conexion()
    cursor = conn.cursor()
    inicio = (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d %H:%M:%S")
    fin = (datetime.now() + timedelta(days=4, minutes=30)).strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        """
        INSERT INTO turnos (fecha_hora_inicio, fecha_hora_fin, veterinario_id, mascota_id, estado, motivo, servicio)
        VALUES (?, ?, 1, ?, 'programado', ?, ?)
        """,
        (inicio, fin, mascota_id, motivo, servicio),
    )
    conn.commit()
    return cursor.lastrowid


def test_listar_catalogo_vacunas():
    token = crear_token_acceso({"sub": "vet_franco", "rol": "veterinario"})
    res = client.get(
        "/api/atencion/vacunas",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    vacunas = res.json()
    assert isinstance(vacunas, list)
    assert len(vacunas) >= 1
    assert {"id_vacuna", "nombre", "descripcion", "precio"}.issubset(vacunas[0].keys())


def test_registrar_consulta_con_vacunas_en_turno_vacunacion():
    token = crear_token_acceso({"sub": "vet_franco", "rol": "veterinario"})
    id_turno = _crear_turno_prueba(mascota_id=1, servicio="Vacunación", motivo="Refuerzo anual")

    payload = {
        "id_mascota": 1,
        "id_turno": id_turno,
        "motivo": "Aplicación de refuerzos",
        "diagnostico_preliminar": "Paciente clínicamente sano, apto para vacunar",
        "esquema_vacunas_al_dia": True,
        "vacunas_aplicadas": [
            {
                "id_vacuna": 1,
                "fecha_aplicacion": "2026-11-13",
                "lote": "LOTE-AR-99",
                "proxima_dosis": "2027-11-13",
            },
            {
                "id_vacuna": 2,
                "fecha_aplicacion": "2026-11-13",
                "lote": "LOTE-SX-10",
                "proxima_dosis": None,
            },
        ],
    }

    res = client.post(
        "/api/atencion/consultas",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201
    data = res.json()
    assert len(data["vacunas_aplicadas"]) == 2
    assert data["vacunas_aplicadas"][0]["lote"] == "LOTE-AR-99"


def test_rechaza_vacunas_si_turno_no_es_de_vacunacion():
    token = crear_token_acceso({"sub": "vet_franco", "rol": "veterinario"})
    id_turno = _crear_turno_prueba(
        mascota_id=1, servicio="Consulta General", motivo="Control dermatológico"
    )

    payload = {
        "id_mascota": 1,
        "id_turno": id_turno,
        "motivo": "Control dermatológico",
        "diagnostico_preliminar": "Dermatitis alérgica",
        "esquema_vacunas_al_dia": True,
        "vacunas_aplicadas": [
            {
                "id_vacuna": 1,
                "fecha_aplicacion": "2026-11-13",
                "lote": "LOTE-01",
                "proxima_dosis": "2027-11-13",
            }
        ],
    }

    res = client.post(
        "/api/atencion/consultas",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 400
    assert "vacunación" in res.json()["detail"].lower()


def test_rollback_si_falla_una_vacuna_no_deja_consulta_a_medias():
    conn = DatabaseSingleton().get_conexion()
    total_antes = conn.execute("SELECT COUNT(*) FROM consultas").fetchone()[0]

    token = crear_token_acceso({"sub": "vet_franco", "rol": "veterinario"})
    id_turno = _crear_turno_prueba(mascota_id=1, servicio="Vacunación")

    payload = {
        "id_mascota": 1,
        "id_turno": id_turno,
        "motivo": "Vacunación con ID inexistente",
        "diagnostico_preliminar": "Paciente sano",
        "esquema_vacunas_al_dia": True,
        "vacunas_aplicadas": [
            {
                "id_vacuna": 999999,  # No existe en el catálogo
                "fecha_aplicacion": "2026-11-13",
            }
        ],
    }

    res = client.post(
        "/api/atencion/consultas",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 404

    total_despues = conn.execute("SELECT COUNT(*) FROM consultas").fetchone()[0]
    assert total_despues == total_antes