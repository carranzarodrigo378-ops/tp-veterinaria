import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

// Colores del estado del turno
const colorEstado = (estado = '') => {
  const e = String(estado).toLowerCase();
  if (e.includes('cancel')) return 'bg-red-100 text-red-700';
  if (e.includes('complet') || e.includes('atendid') || e.includes('realiz')) {
    return 'bg-green-100 text-green-700';
  }
  return 'bg-yellow-100 text-yellow-700';
};

// Formateo de fechas y horas
const soloFecha = (dt = '') => String(dt).slice(0, 10);
const soloHora = (dt = '') => String(dt).slice(11, 16);
const hoyISO = () => new Date().toLocaleDateString('en-CA');

const AgendaVeterinarioPage = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'cliente';

  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [fecha, setFecha] = useState(hoyISO());

  // Estados para el Modal de Edición
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Sesión válida y rol correcto
  const expiration = localStorage.getItem('token_expiration');
  const sesionValida =
    !!expiration &&
    Date.now() <= parseInt(expiration, 10) &&
    role === 'veterinario';

  // Control de sesión y de rol
  useEffect(() => {
    if (!sesionValida) navigate('/login');
  }, [sesionValida, navigate]);

  // Obtener los turnos desde el endpoint del backend
  const obtenerTurnos = useCallback(async () => {
    try {
      setCargando(true);
      setError('');

      const res = await api.get('/api/clinica/turnos/agenda', {
        params: { fecha },
      });
      let lista = Array.isArray(res.data) ? res.data : [];

      // Filtro opcional por veterinario si el usuario lo tiene en su storage
      const idVeterinario = localStorage.getItem('veterinarioId');
      if (idVeterinario) {
        lista = lista.filter(
          (t) =>
            String(t.veterinario_id ?? t.id_veterinario) === String(idVeterinario)
        );
      }

      // Orden cronológico
      lista.sort((a, b) =>
        String(a.fecha_hora_inicio).localeCompare(String(b.fecha_hora_inicio))
      );

      setTurnos(lista);
    } catch (err) {
      console.error('Error al obtener turnos:', err);
      setError(err.response?.data?.detail || 'No se pudieron cargar los turnos.');
    } finally {
      setCargando(false);
    }
  }, [fecha]);

  // Vuelve a consultar la API al cargar o al cambiar de día
  useEffect(() => {
    if (sesionValida) obtenerTurnos();
  }, [sesionValida, obtenerTurnos]);

  // Funciones de acción del Modal
  const abrirModal = (turno) => {
    setTurnoSeleccionado(turno);
    setNuevoEstado(turno.estado || 'programado');
  };

  const cerrarModal = () => {
    setTurnoSeleccionado(null);
    setNuevoEstado('');
  };

  const guardarCambioEstado = async (e) => {
    e.preventDefault();

    // LÓGICA DE DERIVACIÓN: Si marca "Atendido", lo llevamos a la pantalla clínica
    if (nuevoEstado === 'atendido') {
      cerrarModal();
      const idMascota = turnoSeleccionado.mascota_id ?? turnoSeleccionado.id_mascota;
      // Redirigimos pasándole los IDs necesarios para arrancar la consulta
      navigate(`/consulta/nueva?turno=${turnoSeleccionado.id_turno}&mascota=${idMascota}`);
      return; 
    }

    // Si solo lo está cancelando o volviendo a programar, hacemos la petición normal
    try {
      setGuardando(true);
      await api.patch(`/api/clinica/turnos/${turnoSeleccionado.id_turno}/estado`, {
        estado: nuevoEstado,
      });
      cerrarModal();
      obtenerTurnos(); // Recargamos la lista para ver el cambio
    } catch (err) {
      console.error('Error al actualizar turno:', err);
      alert('Error al guardar el estado: ' + (err.response?.data?.detail || err.message));
    } finally {
      setGuardando(false);
    }
  };

  // Navegación entre días
  const moverDia = (n) => {
    const d = new Date(`${fecha}T00:00:00`);
    d.setDate(d.getDate() + n);
    setFecha(d.toLocaleDateString('en-CA'));
  };

  const turnosDelDia = turnos.filter(
    (t) => soloFecha(t.fecha_hora_inicio) === fecha
  );

  if (!sesionValida) return null;

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6 relative">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/logologin.jpg')" }}
      />

      <div className="relative z-10 w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl p-5 text-white overflow-y-auto">
        {/* Barra superior */}
        <div className="flex justify-between items-center mb-4 border-b border-white/20 pb-4">
          <button
            onClick={() => navigate('/home')}
            className="text-sm font-semibold hover:underline bg-white/10 px-3 py-1 rounded-xl cursor-pointer"
          >
            ‹ Volver
          </button>
          <h2 className="font-bold text-lg">Turnos Asignados</h2>
          <div className="w-16"></div> {/* Espaciador para centrar el título */}
        </div>

        {/* Selector de día */}
        <div className="flex items-center justify-between bg-white/10 rounded-2xl p-2 mb-3">
          <button onClick={() => moverDia(-1)} className="px-3 py-1 font-bold cursor-pointer hover:bg-white/20 rounded-lg transition">
            ‹
          </button>

          <div className="text-center">
            <input
              type="date"
              value={fecha}
              onChange={(e) => e.target.value && setFecha(e.target.value)}
              className="bg-transparent text-center font-semibold text-sm outline-none cursor-pointer"
            />
            {fecha !== hoyISO() && (
              <button
                onClick={() => setFecha(hoyISO())}
                className="block mx-auto text-[11px] underline mt-0.5 cursor-pointer"
              >
                Ir a hoy
              </button>
            )}
          </div>

          <button onClick={() => moverDia(1)} className="px-3 py-1 font-bold cursor-pointer hover:bg-white/20 rounded-lg transition">
            ›
          </button>
        </div>

        {cargando && (
          <div className="text-center py-12 text-sm animate-pulse">Cargando agenda...</div>
        )}

        {!cargando && error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl text-sm shadow-md">
            {error}
            <button
              onClick={obtenerTurnos}
              className="block mt-2 font-bold underline cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {!cargando && !error && (
          <>
            <p className="text-xs mb-3 font-medium bg-white/10 inline-block px-3 py-1 rounded-full">
              {turnosDelDia.length} turno(s) para este día
            </p>

            <div className="space-y-3 pb-8">
              {turnosDelDia.length === 0 ? (
                <div className="bg-white/10 p-6 rounded-2xl text-center text-sm font-medium">
                  No hay turnos agendados para este día.
                </div>
              ) : (
                turnosDelDia.map((t, i) => (
                  <div
                    key={t.id_turno ?? i}
                    className="bg-white text-gray-800 p-4 rounded-2xl shadow-md text-xs space-y-2 relative"
                  >
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="font-extrabold text-[#129b9b] text-[13px]">
                        {soloHora(t.fecha_hora_inicio)} - {soloHora(t.fecha_hora_fin)} hs
                      </span>
                      {t.estado && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide ${colorEstado(t.estado)}`}
                        >
                          {t.estado}
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5 pt-1">
                      <p>
                        <strong className="text-gray-900 font-semibold">Mascota:</strong>{' '}
                        {t.nombre_mascota || (t.id_mascota ?? t.mascota_id ? `N° ${t.id_mascota ?? t.mascota_id}` : 'No especificada')}
                      </p>
                      <p>
                        <strong className="text-gray-900 font-semibold">Dueño:</strong>{' '}
                        {t.nombre_cliente || t.nombre_dueno || t.cliente || 'No asignado'}
                      </p>
                      {(t.motivo || t.servicio) && (
                        <p className="text-gray-500 text-[11px] mt-1">
                          <strong>Detalle:</strong> {t.servicio || t.motivo}
                        </p>
                      )}
                    </div>

                    {/* Mostrar botón solo si NO fue atendido/cancelado (opcional, si querés bloquear la re-edición) */}
                    {t.estado !== 'atendido' && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => abrirModal(t)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded-lg transition text-[11px] cursor-pointer shadow-sm"
                        >
                          ✎ Gestionar
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal de Gestión de Turno */}
      {turnoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in text-gray-800">
            <h3 className="font-bold text-lg text-[#129b9b] mb-1">Gestionar Turno</h3>
            <p className="text-xs text-gray-500 mb-4 pb-3 border-b">
              Actualizando estado del turno de <strong>{turnoSeleccionado.nombre_mascota || `Mascota N°${turnoSeleccionado.mascota_id}`}</strong>
            </p>

            <form onSubmit={guardarCambioEstado}>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Estado de la atención
              </label>
              <select
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#129b9b]/50 mb-5 bg-gray-50 cursor-pointer"
              >
                <option value="programado">Programado</option>
                <option value="atendido">Atendido / Realizado</option>
                <option value="cancelado">Cancelado</option>
              </select>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-[#129b9b] hover:bg-[#0d7373] text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Procesando...' : (nuevoEstado === 'atendido' ? 'Iniciar Consulta Médica ➔' : 'Confirmar Estado')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendaVeterinarioPage;