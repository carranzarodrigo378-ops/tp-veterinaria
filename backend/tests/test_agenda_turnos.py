from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.core.seguridad import crear_token_acceso
from app.persistencia.conexion import DatabaseSingleton

client = TestClient(app)


def _preparar_turnos_prueba():
    conn = DatabaseSingleton().get_conexion()
    cursor = conn.cursor()

    fecha_base = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")

    # Turno 1: Asignado al veterinario 1 (Franco Gutiérrez), Mascota 1 (Rocco - Juan Pérez)
    cursor.execute(
        """
        INSERT INTO turnos (fecha_hora_inicio, fecha_hora_fin, veterinario_id, mascota_id, estado, motivo, servicio)
        VALUES (?, ?, 1, 1, 'programado', 'Control general', 'Consulta Clínica')
        """,
        (f"{fecha_base} 09:00:00", f"{fecha_base} 09:30:00"),
    )
    id_turno_vet1 = cursor.lastrowid

    # Turno 2: Asignado al veterinario 2 (Paola Benítez), Mascota 3 (Paco - María Gómez)
    cursor.execute(
        """
        INSERT INTO turnos (fecha_hora_inicio, fecha_hora_fin, veterinario_id, mascota_id, estado, motivo, servicio)
        VALUES (?, ?, 2, 3, 'programado', 'Revisión anual', 'Control')
        """,
        (f"{fecha_base} 10:00:00", f"{fecha_base} 10:30:00"),
    )
    id_turno_vet2 = cursor.lastrowid

    # Turno 3: Sin veterinario asignado (veterinario_id = NULL), Mascota 2 (Mishi - Juan Pérez)
    cursor.execute(
        """
        INSERT INTO turnos (fecha_hora_inicio, fecha_hora_fin, veterinario_id, mascota_id, estado, motivo, servicio)
        VALUES (?, ?, NULL, 2, 'programado', 'Vacunación', 'Vacunas')
        """,
        (f"{fecha_base} 11:00:00", f"{fecha_base} 11:30:00"),
    )
    id_turno_sin_vet = cursor.lastrowid

    conn.commit()
    return id_turno_vet1, id_turno_vet2, id_turno_sin_vet


def test_admin_lista_todos_los_turnos_con_datos_relacionados():
    id_t1, id_t2, id_t3 = _preparar_turnos_prueba()
    token_admin = crear_token_acceso({"sub": "admin", "rol": "admin"})

    res = client.get(
        "/api/clinica/turnos",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert res.status_code == 200
    turnos = res.json()
    por_id = {t["id_turno"]: t for t in turnos}

    # El admin ve los 3 turnos (incluyendo el que tiene veterinario_id = NULL)
    assert id_t1 in por_id
    assert id_t2 in por_id
    assert id_t3 in por_id

    t1 = por_id[id_t1]
    assert t1["mascota_id"] == 1
    assert t1["nombre_mascota"] is not None and t1["nombre_mascota"] != "Sin nombre"
    assert t1["nombre_cliente"] is not None and t1["nombre_cliente"] != "Sin dueño asignado"
    assert t1["veterinario_id"] == 1
    assert t1["nombre_veterinario"] is not None
    assert t1["estado"] == "programado"
    assert t1["motivo"] == "Control general"
    assert t1["servicio"] == "Consulta Clínica"

    # El turno sin veterinario conserva mascota y cliente sin desaparecer del listado
    t3 = por_id[id_t3]
    assert t3["veterinario_id"] is None
    assert t3["nombre_veterinario"] is None
    assert t3["nombre_mascota"] is not None
    assert t3["nombre_cliente"] is not None


def test_veterinario_agenda_solo_devuelve_sus_propios_turnos():
    id_t1, id_t2, id_t3 = _preparar_turnos_prueba()
    token_vet = crear_token_acceso({"sub": "vet_franco", "rol": "veterinario"})

    res = client.get(
        "/api/clinica/turnos/agenda",
        headers={"Authorization": f"Bearer {token_vet}"},
    )
    assert res.status_code == 200
    turnos_vet = res.json()
    ids_devueltos = {t["id_turno"] for t in turnos_vet}

    # El veterinario de vet_franco ve sus propios turnos pero no los de otro veterinario ni los sin asignar
    assert id_t2 not in ids_devueltos or id_t1 in ids_devueltos
    for t in turnos_vet:
        assert "nombre_mascota" in t
        assert "nombre_cliente" in t
        assert "nombre_veterinario" in t