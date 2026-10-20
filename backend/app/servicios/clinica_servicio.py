class ClinicaServicio:
    def __init__(self, repositorio_clinica=None):
        self.repositorio = repositorio_clinica
        self._clientes = {}
        self._mascotas = {}
        self._contador_clientes = 1
        self._contador_mascotas = 1

    def registrar_cliente(self, datos_cliente):
        cliente_id = self._contador_clientes
        # Acepta objeto Pydantic o diccionario
        datos = datos_cliente if isinstance(datos_cliente, dict) else datos_cliente.model_dump()
        datos["id_cliente"] = cliente_id
        self._clientes[cliente_id] = datos
        self._contador_clientes += 1
        return datos

    def registrar_mascota(self, datos_mascota):
        datos = datos_mascota if isinstance(datos_mascota, dict) else datos_mascota.model_dump()
        id_cliente = datos.get("id_cliente")
        
        # Validación obligatoria: la mascota debe tener un dueño asignado
        if id_cliente not in self._clientes:
            raise ValueError("El responsable (cliente) especificado no existe en el sistema.")

        mascota_id = self._contador_mascotas
        datos["id_mascota"] = mascota_id
        if "historial_clinico" not in datos:
            datos["historial_clinico"] = "Historia clínica iniciada."
        
        self._mascotas[mascota_id] = datos
        self._contador_mascotas += 1
        return datos

    def actualizar_ficha_medica(self, id_mascota, datos_actualizacion):
        """Permite al veterinario completar diagnósticos, peso, o vacunas de la mascota."""
        if id_mascota not in self._mascotas:
            raise ValueError(f"No existe la mascota con ID {id_mascota}")
        
        mascota = self._mascotas[id_mascota]
        datos = datos_actualizacion if isinstance(datos_actualizacion, dict) else datos_actualizacion.model_dump(exclude_unset=True)
        
        for clave, valor in datos.items():
            if valor is not None:
                mascota[clave] = valor
                
        return mascota

    def cambiar_duenio_mascota(self, id_mascota, nuevo_id_cliente):
        if id_mascota not in self._mascotas:
            raise ValueError(f"No existe la mascota con ID {id_mascota}")
        if nuevo_id_cliente not in self._clientes:
            raise ValueError(f"El nuevo cliente con ID {nuevo_id_cliente} no existe")

        self._mascotas[id_mascota]["id_cliente"] = nuevo_id_cliente
        return self._mascotas[id_mascota]

    def listar_clientes(self):
        return list(self._clientes.values())

    def listar_mascotas_por_cliente(self, id_cliente):
        return [m for m in self._mascotas.values() if m.get("id_cliente") == id_cliente]


servicio_clinica = ClinicaServicio()