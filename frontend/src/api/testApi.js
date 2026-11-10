import axios from 'axios';

// Creamos un cliente directo apuntando a FastAPI
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// Pegá acá el token entre comillas simples
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbnRvMTIzIiwicm9sIjoiY2xpZW50ZSIsImV4cCI6MTc5NDI5MTE1Mn0.PRW7Fu3R9QskrLKt-5MGrGLxe2ANw4qGRoSgVyBX3Lw';

async function probarConexion() {
  console.log('Intentando conectar con FastAPI...');

  try {
    // Probamos el endpoint de mascotas pasando el ID 1
    const response = await api.get('/api/clinica/mascotas/1', {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    console.log('\n Status:', response.status);
    console.log(' Datos recibidos:', response.data);
    console.log('\n ¡El backend y el endpoint responden correctamente!');
  } catch (error) {
    if (error.response) {
      console.error(`\n Error del servidor (${error.response.status}):`, error.response.data);
    } else if (error.request) {
      console.error('\n Error de red: No hubo respuesta del backend. ¿Está corriendo uvicorn?');
    } else {
      console.error('\n Error de configuración:', error.message);
    }
  }
}

probarConexion();