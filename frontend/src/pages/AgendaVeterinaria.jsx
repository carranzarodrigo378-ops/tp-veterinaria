import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

// Colores del estado del turno (ajustá las claves a los estados reales del backend)
const colorEstado = (estado = '') => {
  const e = String(estado).toLowerCase();
  if (e.includes('cancel')) return 'bg-red-100 text-red-700';
  if (e.includes('complet') || e.includes('atendid') || e.includes('realiz')) {
    return 'bg-green-100 text-green-700';
  }
  return 'bg-yellow-100 text-yellow-700';
};

// fecha_hora_inicio llega como "2026-11-11 14:30:00"
const soloFecha = (dt = '') => String(dt).slice(0, 10); // 2026-11-11
const soloHora = (dt = '') => String(dt).slice(11, 16); // 14:30

// Fecha local en YYYY-MM-DD (toISOString usaría UTC y a la noche daría el día siguiente)
const hoyISO = () => new Date().toLocaleDateString('en-CA');

const AgendaVeterinarioPage = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'cliente';

  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [fecha, setFecha] = useState(hoyISO());

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

  // Obtener los turnos desde el backend
  const obtenerTurnos = useCallback(async () => {
    try {
      setCargando(true);
      setError('');

      const res = await api.get('/api/clinica/turnos');
      let lista = Array.isArray(res.data) ? res.data : [];

      // Solo los turnos del veterinario logueado
      const idVeterinario = localStorage.getItem('veterinarioId');
      if (idVeterinario) {
        lista = lista.filter(
          (t) => String(t.veterinario_id) === String(idVeterinario)
        );
      }

      // Orden cronológico (el formato YYYY-MM-DD HH:MM:SS se ordena bien como texto)
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
  }, []);

  useEffect(() => {
    if (sesionValida) obtenerTurnos();
  }, [sesionValida, obtenerTurnos]);

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

      {/* Fondo exterior */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/logologin.jpg')" }}
      />

      <div className="relative z-10 w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl p-5 text-white overflow-y-auto">

        {/* Barra superior */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigate('/home')}
            className="text-sm font-semibold hover:underline"
          >
            ‹ Volver
          </button>
          <h2 className="font-bold text-lg">Turnos Asignados</h2>
          <div className="w-6"></div>
        </div>

        {/* Selector de día */}
        <div className="flex items-center justify-between bg-white/10 rounded-2xl p-2 mb-3">
          <button onClick={() => moverDia(-1)} className="px-3 py-1 font-bold">
            ‹
          </button>

          <div className="text-center">
            <input
              type="date"
              value={fecha}
              onChange={(e) => e.target.value && setFecha(e.target.value)}
              className="bg-transparent text-center font-semibold text-sm outline-none"
            />
            {fecha !== hoyISO() && (
              <button
                onClick={() => setFecha(hoyISO())}
                className="block mx-auto text-[11px] underline"
              >
                Ir a hoy
              </button>
            )}
          </div>

          <button onClick={() => moverDia(1)} className="px-3 py-1 font-bold">
            ›
          </button>
        </div>

        {cargando && (
          <div className="text-center p-6 text-sm">Cargando turnos...</div>
        )}

        {!cargando && error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl text-sm">
            {error}
            <button
              onClick={obtenerTurnos}
              className="block mt-2 font-bold underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {!cargando && !error && (
          <>
            <p className="text-xs mb-2 opacity-90">
              {turnosDelDia.length} turno(s) para este día
            </p>

            <div className="space-y-3">
              {turnosDelDia.length === 0 ? (
                <div className="bg-white/10 p-6 rounded-2xl text-center text-sm">
                  No hay turnos para este día.
                </div>
              ) : (
                turnosDelDia.map((t, i) => (
                  <div
                    key={t.id_turno ?? i}
                    className="bg-white text-gray-800 p-4 rounded-2xl shadow-md text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center border-b pb-1">
                      <span className="font-bold text-[#129b9b] text-sm">
                        {soloHora(t.fecha_hora_inicio)} - {soloHora(t.fecha_hora_fin)} hs
                      </span>
                      {t.estado && (
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${colorEstado(t.estado)}`}
                        >
                          {t.estado}
                        </span>
                      )}
                    </div>

                    <p className="pt-1">
                      <strong>Mascota:</strong>{' '}
                      {t.nombre_mascota ?? `N° ${t.mascota_id ?? '-'}`}
                    </p>

                    {t.nombre_cliente && (
                      <p>
                        <strong>Cliente:</strong> {t.nombre_cliente}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AgendaVeterinarioPage;