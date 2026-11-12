from app.persistencia.veterinario_dao import VeterinarioDAO


class VeterinarioServicio:
    def __init__(self, veterinario_dao: VeterinarioDAO | None = None):
        self.veterinario_dao = veterinario_dao or VeterinarioDAO()

    def listar_veterinarios(self) -> list[dict]:
        veterinarios = self.veterinario_dao.obtener_todos(limite=500)
        return [
            {
                "id_veterinario": veterinario["id_veterinario"],
                "nombre": veterinario.get("nombre"),
                "apellido": veterinario.get("apellido"),
            }
            for veterinario in veterinarios
        ]


servicio_veterinarios = VeterinarioServicio()