import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API_URL = 'http://127.0.0.1:8000/api/clinica';

const PetsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Datos de sesión
  const rol = localStorage.getItem('role') || 'cliente';
  const idCliente = Number(localStorage.getItem('clientId'));

  // Estados principales
  const [mascotas, setMascotas] = useState([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);

  // Estado para el buscador
  const [busqueda, setBusqueda] = useState('');

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // Modal de registro (si venimos redirigidos de turnos, se abre por defecto)
  const [mostrarModal, setMostrarModal] = useState(location.state?.returnToTurnos || false);

  // Formulario en español, igual que FastAPI
  const [nuevaMascota, setNuevaMascota] = useState({
    nombre: '',
    especie: 'Perro',
    raza: '',
    sexo: 'macho',
    fecha_nacimiento: ''
  });


  // Función para realizar peticiones HTTP
  const realizarPeticion = async (url, opciones = {}) => {
    const token = localStorage.getItem('token');

    const headers = {
      'Content-Type': 'application/json',
      ...opciones.headers
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...opciones,
      headers
    });

    if (!response.ok) {
      let mensaje = `Error HTTP ${response.status}`;

      try {
        const datosError = await response.json();
        mensaje = datosError.detail || mensaje;
      } catch {
        // Mantener el mensaje HTTP
      }

      throw new Error(mensaje);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  };

  // Obtener mascotas según el rol (Cliente o Veterinario/Admin)
  const obtenerMascotas = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      let url = '';

      if (rol === 'cliente') {
        if (!idCliente || !Number.isInteger(idCliente)) {
          throw new Error('No se encontró un ID de cliente válido.');
        }
        url = `${API_URL}/clientes/${idCliente}/mascotas?incluir_inactivos=false`;
      } else {
        url = `${API_URL}/mascotas?incluir_inactivos=false`;
      }

      const datos = await realizarPeticion(url);

      if (!Array.isArray(datos)) {
        throw new Error('La respuesta del servidor no tiene el formato esperado.');
      }

      setMascotas(datos);

    } catch (err) {
      console.error('Error al obtener mascotas:', err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [idCliente, rol]);

  // Cargar mascotas al ingresar a la pantalla
  useEffect(() => {
    obtenerMascotas();
  }, [obtenerMascotas]);

  // Registrar mascota
  const handleCrearMascota = async (e) => {
    e.preventDefault();

    if (
      !nuevaMascota.nombre.trim() ||
      !nuevaMascota.raza.trim() ||
      !nuevaMascota.fecha_nacimiento
    ) {
      alert('Completá todos los campos obligatorios.');
      return;
    }

    if (!idCliente || !Number.isInteger(idCliente)) {
      alert('No se encontró el ID del cliente.');
      return;
    }

    // JSON enviado a FastAPI
    const datosMascota = {
      nombre: nuevaMascota.nombre.trim(),
      especie: nuevaMascota.especie,
      raza: nuevaMascota.raza.trim(),
      sexo: nuevaMascota.sexo,
      fecha_nacimiento: nuevaMascota.fecha_nacimiento,
      id_cliente: idCliente
    };

    try {
      setGuardando(true);

      const mascotaCreada = await realizarPeticion(
        `${API_URL}/mascotas`,
        {
          method: 'POST',
          body: JSON.stringify(datosMascota)
        }
      );

      console.log('Mascota registrada:', mascotaCreada);

      if (location.state?.returnToTurnos) {
        const idMascotaId = mascotaCreada?.id_mascota || mascotaCreada?.id;
        navigate('/turnos', { state: { nuevaMascotaId: idMascotaId } });
        return;
      }

      await obtenerMascotas();
      setMostrarModal(false);
      setNuevaMascota({
        nombre: '',
        especie: 'Perro',
        raza: '',
        sexo: 'macho',
        fecha_nacimiento: ''
      });

      alert('¡Mascota registrada correctamente!');

    } catch (err) {
      console.error('Error al registrar mascota:', err);
      alert(`No se pudo registrar la mascota: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  // Consultar una mascota específica
  const consultarMascota = async (idMascota) => {
    try {
      const datos = await realizarPeticion(
        `${API_URL}/mascotas/${idMascota}`
      );
      setMascotaSeleccionada(datos);
    } catch (err) {
      console.error('Error al consultar mascota:', err);
      alert(err.message);
    }
  };

  // Calcular edad a partir de fecha de nacimiento
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'No registrada';

    const nacimiento = new Date(`${fechaNacimiento}T00:00:00`);

    if (Number.isNaN(nacimiento.getTime())) {
      return 'No disponible';
    }

    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const diferenciaMes = hoy.getMonth() - nacimiento.getMonth();

    if (
      diferenciaMes < 0 ||
      (diferenciaMes === 0 && hoy.getDate() < nacimiento.getDate())
    ) {
      edad--;
    }

    return edad < 0 ? 'No disponible' : `${edad} años`;
  };

  // Lógica de filtrado
  const mascotasFiltradas = mascotas.filter((mascota) => {
    const texto = busqueda.toLowerCase();
    return (
      mascota.nombre?.toLowerCase().includes(texto) ||
      mascota.id_cliente?.toString().includes(texto)
    );
  });

  // Vista de detalle
  if (mascotaSeleccionada) {
    return (
      <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-4 relative">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/logologin.jpg')" }}
        />
        <div className="relative z-10 w-full max-w-md bg-[#129b9b] rounded-3xl shadow-2xl p-5 text-white">
          <button
            onClick={() => setMascotaSeleccionada(null)}
            className="mb-5 font-semibold hover:underline cursor-pointer"
          >
            ← Volver a mascotas
          </button>

          <div className="bg-white text-gray-800 rounded-2xl p-5 shadow-md space-y-3">
            <h2 className="text-xl font-bold text-[#129b9b] text-center">
              {mascotaSeleccionada.nombre}
            </h2>
            <div className="border-b pb-2 flex justify-between">
              <span className="text-gray-500">ID mascota:</span>
              <strong>{mascotaSeleccionada.id_mascota}</strong>
            </div>
            <div className="border-b pb-2 flex justify-between">
              <span className="text-gray-500">Nombre:</span>
              <strong>{mascotaSeleccionada.nombre}</strong>
            </div>
            <div className="border-b pb-2 flex justify-between">
              <span className="text-gray-500">Especie:</span>
              <strong>{mascotaSeleccionada.especie}</strong>
            </div>
            <div className="border-b pb-2 flex justify-between">
              <span className="text-gray-500">Raza:</span>
              <strong>{mascotaSeleccionada.raza}</strong>
            </div>
            <div className="border-b pb-2 flex justify-between">
              <span className="text-gray-500">Sexo:</span>
              <strong>{mascotaSeleccionada.sexo}</strong>
            </div>
            <div className="border-b pb-2 flex justify-between">
              <span className="text-gray-500">Nacimiento:</span>
              <strong>{mascotaSeleccionada.fecha_nacimiento}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Edad:</span>
              <strong>{calcularEdad(mascotaSeleccionada.fecha_nacimiento)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ID cliente:</span>
              <strong>{mascotaSeleccionada.id_cliente}</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Listado de mascotas
  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-4 relative">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/logologin.jpg')" }}
      />
      <div className="relative z-10 w-full max-w-md min-h-[600px] bg-[#129b9b] rounded-3xl shadow-2xl p-5 text-white">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(location.state?.returnToTurnos ? '/turnos' : '/home')}
            className="text-sm font-semibold hover:underline cursor-pointer"
          >
            ‹ Volver
          </button>
          <div className="text-center">
            <h2 className="font-bold text-lg">
              {rol === 'cliente' ? 'Mis Mascotas' : 'Padrón de Pacientes'} ({mascotasFiltradas.length})
            </h2>
            {rol !== 'cliente' && (
              <p className="text-[10px] text-amber-300">
                Vista de Staff Veterinario
              </p>
            )}
          </div>
          <div className="w-10" />
        </div>

        {/* Barra de búsqueda */}
        {!cargando && !error && (mascotas.length > 0 || busqueda !== '') && (
          <div className="mb-4">
            <input
              type="text"
              placeholder={rol === 'cliente' ? "Buscar por nombre..." : "Buscar mascota o ID tutor..."}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-white/10 text-white placeholder-cyan-100/70 border border-white/20 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            />
          </div>
        )}

        {/* Estado de carga */}
        {cargando && (
          <div className="text-center p-6">
            Cargando mascotas...
          </div>
        )}

        {/* Mensaje de error */}
        {!cargando && error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl text-sm">
            {error}
            <button
              onClick={obtenerMascotas}
              className="block mt-2 font-bold underline cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Listado filtrado */}
        {!cargando && !error && (
          <div className="space-y-3">
            {mascotasFiltradas.length > 0 ? (
              mascotasFiltradas.map((mascota) => (
                <div
                  key={mascota.id_mascota}
                  onClick={() => consultarMascota(mascota.id_mascota)}
                  className="bg-[#62c4c4] p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-[#5bb8b8] shadow-md transition-all"
                >
                  <div>
                    <p className="font-bold text-base">
                      {mascota.nombre}
                    </p>
                    <p className="text-xs text-cyan-50">
                      {mascota.especie} • {mascota.raza}
                    </p>
                    <p className="text-xs text-cyan-50 mt-1">
                      {calcularEdad(mascota.fecha_nacimiento)}
                    </p>
                  </div>
                  <span className="text-2xl">
                    {mascota.especie?.toLowerCase() === 'gato'
                      ? '🐱'
                      : mascota.especie?.toLowerCase() === 'perro'
                        ? '🐶'
                        : '🐾'}
                  </span>
                </div>
              ))
            ) : (
              <div className="bg-white/10 p-6 rounded-2xl text-center text-sm">
                {busqueda ? 'No se encontraron mascotas con esa búsqueda.' : 'Todavía no tenés mascotas registradas.'}
              </div>
            )}

            {rol === 'cliente' && (
              <button
                onClick={() => setMostrarModal(true)}
                className="w-full bg-[#62c4c4] p-4 rounded-2xl flex items-center justify-center font-bold border-2 border-dashed border-white/40 hover:bg-[#5bb8b8] cursor-pointer mt-4"
              >
                + Agregar Nueva Mascota
              </button>
            )}
          </div>
        )}

        {/* Modal de registro */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white text-gray-800 p-5 rounded-3xl w-full max-w-sm space-y-4 shadow-2xl">
              <h3 className="font-bold text-[#129b9b] text-center text-lg">
                Registrar Mascota
              </h3>
              <form onSubmit={handleCrearMascota} className="space-y-3">
                {/* Nombre */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevaMascota.nombre}
                    onChange={(e) => setNuevaMascota({ ...nuevaMascota, nombre: e.target.value })}
                    className="w-full border border-gray-200 p-2.5 rounded-xl"
                    placeholder="Ej: Nefer"
                  />
                </div>
                {/* Especie */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Especie *
                  </label>
                  <select
                    required
                    value={nuevaMascota.especie}
                    onChange={(e) => setNuevaMascota({ ...nuevaMascota, especie: e.target.value })}
                    className="w-full border border-gray-200 p-2.5 rounded-xl bg-white"
                  >
                    <option value="Perro">Perro 🐶</option>
                    <option value="Gato">Gato 🐱</option>
                    <option value="Ave">Ave 🦜</option>
                    <option value="Conejo">Conejo 🐰</option>
                    <option value="Otro">Otro 🐾</option>
                  </select>
                </div>
                {/* Raza */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Raza *
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevaMascota.raza}
                    onChange={(e) => setNuevaMascota({ ...nuevaMascota, raza: e.target.value })}
                    className="w-full border border-gray-200 p-2.5 rounded-xl"
                    placeholder="Ej: Carey, Caniche"
                  />
                </div>
                {/* Sexo */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Sexo *
                  </label>
                  <select
                    required
                    value={nuevaMascota.sexo}
                    onChange={(e) => setNuevaMascota({ ...nuevaMascota, sexo: e.target.value })}
                    className="w-full border border-gray-200 p-2.5 rounded-xl bg-white"
                  >
                    <option value="macho">Macho</option>
                    <option value="hembra">Hembra</option>
                  </select>
                </div>
                {/* Fecha de nacimiento */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Fecha de nacimiento *
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={nuevaMascota.fecha_nacimiento}
                    onChange={(e) => setNuevaMascota({ ...nuevaMascota, fecha_nacimiento: e.target.value })}
                    className="w-full border border-gray-200 p-2.5 rounded-xl"
                  />
                </div>
                {/* Botones */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (location.state?.returnToTurnos) {
                        navigate('/turnos');
                      } else {
                        setMostrarModal(false);
                      }
                    }}
                    disabled={guardando}
                    className="w-1/2 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="w-1/2 bg-[#129b9b] text-white py-2.5 rounded-xl font-bold shadow disabled:opacity-50 cursor-pointer"
                  >
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetsPage;
