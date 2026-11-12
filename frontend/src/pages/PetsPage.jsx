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
  
  // NUEVO: Estados para la Historia Clínica
  const [historiaClinica, setHistoriaClinica] = useState([]);
  const [cargandoHistoria, setCargandoHistoria] = useState(false);

  // Estado para el buscador
  const [busqueda, setBusqueda] = useState('');

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // Modal de registro
  const [mostrarModal, setMostrarModal] = useState(location.state?.returnToTurnos || false);

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

  useEffect(() => {
    obtenerMascotas();
  }, [obtenerMascotas]);

  const handleCrearMascota = async (e) => {
    e.preventDefault();

    if (!nuevaMascota.nombre.trim() || !nuevaMascota.raza.trim() || !nuevaMascota.fecha_nacimiento) {
      alert('Completá todos los campos obligatorios.');
      return;
    }

    if (!idCliente || !Number.isInteger(idCliente)) {
      alert('No se encontró el ID del cliente.');
      return;
    }

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

      const mascotaCreada = await realizarPeticion(`${API_URL}/mascotas`, {
        method: 'POST',
        body: JSON.stringify(datosMascota)
      });

      if (location.state?.returnToTurnos) {
        const idMascotaId = mascotaCreada?.id_mascota || mascotaCreada?.id;
        navigate('/turnos', { state: { nuevaMascotaId: idMascotaId } });
        return;
      }

      await obtenerMascotas();
      setMostrarModal(false);
      setNuevaMascota({ nombre: '', especie: 'Perro', raza: '', sexo: 'macho', fecha_nacimiento: '' });
      alert('¡Mascota registrada correctamente!');

    } catch (err) {
      alert(`No se pudo registrar la mascota: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  // MODIFICADO: Ahora también busca el historial de turnos
  const consultarMascota = async (idMascota) => {
    try {
      // 1. Traer datos básicos de la mascota
      const datos = await realizarPeticion(`${API_URL}/mascotas/${idMascota}`);
      setMascotaSeleccionada(datos);

      // 2. Traer el historial clínico (Turnos)
      setCargandoHistoria(true);
      const todosLosTurnos = await realizarPeticion(`${API_URL}/turnos`);
      
      // Filtramos los turnos de esta mascota y los ordenamos del más nuevo al más viejo
      const turnosMascota = todosLosTurnos
        .filter(t => (t.id_mascota === idMascota || t.mascota_id === idMascota))
        .sort((a, b) => new Date(b.fecha_hora_inicio) - new Date(a.fecha_hora_inicio));

      setHistoriaClinica(turnosMascota);

    } catch (err) {
      console.error('Error al consultar mascota o su historial:', err);
      alert(err.message);
    } finally {
      setCargandoHistoria(false);
    }
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'No registrada';
    const nacimiento = new Date(`${fechaNacimiento}T00:00:00`);
    if (Number.isNaN(nacimiento.getTime())) return 'No disponible';

    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const diferenciaMes = hoy.getMonth() - nacimiento.getMonth();

    if (diferenciaMes < 0 || (diferenciaMes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad < 0 ? 'No disponible' : `${edad} años`;
  };

  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return '';
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const colorEstado = (estado = '') => {
    const e = String(estado).toLowerCase();
    if (e.includes('cancel')) return 'bg-red-100 text-red-700';
    if (e.includes('complet') || e.includes('atendid') || e.includes('realiz')) return 'bg-green-100 text-green-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const mascotasFiltradas = mascotas.filter((mascota) => {
    const texto = busqueda.toLowerCase();
    return (
      mascota.nombre?.toLowerCase().includes(texto) ||
      mascota.id_cliente?.toString().includes(texto)
    );
  });

  // VISTA DE DETALLE MODIFICADA
  if (mascotaSeleccionada) {
    return (
      <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-4 relative">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/logologin.jpg')" }}
        />
        {/* Contenedor principal con altura máxima y flex para permitir scroll interno */}
        <div className="relative z-10 w-full max-w-md max-h-[90vh] flex flex-col bg-[#129b9b] rounded-3xl shadow-2xl p-5 text-white">
          
          <button
            onClick={() => setMascotaSeleccionada(null)}
            className="mb-4 font-semibold hover:underline cursor-pointer text-left w-fit"
          >
            ← Volver a mascotas
          </button>

          {/* Área con Scroll para los datos y la historia */}
          <div className="overflow-y-auto pr-1 space-y-4 pb-2" style={{ scrollbarWidth: 'thin' }}>
            
            {/* Tarjeta 1: Datos Personales */}
            <div className="bg-white text-gray-800 rounded-2xl p-5 shadow-md space-y-2">
              <h2 className="text-xl font-extrabold text-[#129b9b] text-center mb-3">
                {mascotaSeleccionada.nombre}
              </h2>
              <div className="border-b border-gray-100 pb-1.5 flex justify-between text-sm">
                <span className="text-gray-500">ID mascota:</span>
                <strong>#{mascotaSeleccionada.id_mascota}</strong>
              </div>
              <div className="border-b border-gray-100 pb-1.5 flex justify-between text-sm">
                <span className="text-gray-500">Especie y Raza:</span>
                <strong>{mascotaSeleccionada.especie} - {mascotaSeleccionada.raza}</strong>
              </div>
              <div className="border-b border-gray-100 pb-1.5 flex justify-between text-sm">
                <span className="text-gray-500">Sexo:</span>
                <strong className="capitalize">{mascotaSeleccionada.sexo}</strong>
              </div>
              <div className="border-b border-gray-100 pb-1.5 flex justify-between text-sm">
                <span className="text-gray-500">Nacimiento:</span>
                <strong>{mascotaSeleccionada.fecha_nacimiento}</strong>
              </div>
              <div className="border-b border-gray-100 pb-1.5 flex justify-between text-sm">
                <span className="text-gray-500">Edad:</span>
                <strong>{calcularEdad(mascotaSeleccionada.fecha_nacimiento)}</strong>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="text-gray-500">Tutor (ID Cliente):</span>
                <strong>#{mascotaSeleccionada.id_cliente}</strong>
              </div>
            </div>

            {/* Tarjeta 2: Historia Clínica (Turnos) */}
            <div className="bg-white text-gray-800 rounded-2xl p-5 shadow-md">
              <h3 className="font-bold text-[#129b9b] border-b border-gray-200 pb-2 mb-3 flex items-center gap-2">
                📋 Historia Clínica
              </h3>
              
              {cargandoHistoria ? (
                <div className="text-center text-sm text-gray-500 py-4 animate-pulse">
                  Buscando registros médicos...
                </div>
              ) : historiaClinica.length === 0 ? (
                <div className="text-center text-sm text-gray-400 bg-gray-50 p-4 rounded-xl italic">
                  Esta mascota no tiene turnos ni atenciones registradas.
                </div>
              ) : (
                <div className="space-y-3">
                  {historiaClinica.map((turno) => (
                    <div key={turno.id_turno} className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs relative">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-[#129b9b]">
                          {formatearFecha(turno.fecha_hora_inicio)} hs
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${colorEstado(turno.estado)}`}>
                          {turno.estado}
                        </span>
                      </div>
                      
                      <p className="mt-1.5">
                        <strong className="text-gray-600">Motivo:</strong> {turno.motivo || turno.servicio || 'Consulta general'}
                      </p>
                      
                      {turno.nombre_veterinario && (
                        <p className="mt-0.5">
                          <strong className="text-gray-600">Atendido por:</strong> {turno.nombre_veterinario}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                    <p className="text-xs text-cyan-50 capitalize">
                      {mascota.especie} - {mascota.raza}
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
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={nuevaMascota.nombre}
                    onChange={(e) => setNuevaMascota({ ...nuevaMascota, nombre: e.target.value })}
                    className="w-full border border-gray-200 p-2.5 rounded-xl"
                    placeholder="Ej: Nefer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Especie *</label>
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
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Raza *</label>
                  <input
                    type="text"
                    required
                    value={nuevaMascota.raza}
                    onChange={(e) => setNuevaMascota({ ...nuevaMascota, raza: e.target.value })}
                    className="w-full border border-gray-200 p-2.5 rounded-xl"
                    placeholder="Ej: Carey, Caniche"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Sexo *</label>
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
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Fecha de nacimiento *</label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={nuevaMascota.fecha_nacimiento}
                    onChange={(e) => setNuevaMascota({ ...nuevaMascota, fecha_nacimiento: e.target.value })}
                    className="w-full border border-gray-200 p-2.5 rounded-xl"
                  />
                </div>
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