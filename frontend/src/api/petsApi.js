import api from "./axiosConfig";

// 1. Registrar una nueva mascota (POST /api/clinica/mascotas)
export const createPet = async (petData) => {
  const response = await api.post("/api/clinica/mascotas", petData);
  return response.data;
};

// 2. Obtener una mascota por su ID (GET /api/clinica/mascotas/{id_mascota})
export const getPetById = async (idMascota) => {
  const response = await api.get(`/api/clinica/mascotas/${idMascota}`);
  return response.data;
};

// 3. Listar las mascotas de un cliente (GET /api/clinica/clientes/{id_cliente}/mascotas)
export const getPetsByCliente = async (idCliente) => {
  const response = await api.get(`/api/clinica/clientes/${idCliente}/mascotas`);
  return response.data;
};

// 4. Actualizar datos de una mascota (PATCH /api/clinica/mascotas/{id_mascota})
export const updatePet = async (idMascota, updateData) => {
  const response = await api.patch(
    `/api/clinica/mascotas/${idMascota}`,
    updateData,
  );
  return response.data;
};

// 5. Dar de baja lógica a una mascota (DELETE /api/clinica/mascotas/{id_mascota})
export const deletePet = async (idMascota) => {
  const response = await api.delete(`/api/clinica/mascotas/${idMascota}`);
  return response.data;
};

// 6. Cambiar el dueño de una mascota (PUT /api/clinica/mascotas/{id_mascota}/duenio/{nuevo_id_cliente})
export const changePetOwner = async (idMascota, nuevoIdCliente) => {
  const response = await api.put(
    `/api/clinica/mascotas/${idMascota}/duenio/${nuevoIdCliente}`,
  );
  return response.data;
};
