import { useState, useEffect, useCallback, useMemo } from 'react';
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

const NOMBRES_MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Genera la cuadrícula mensual (lunes a domingo) para un año y mes (0-11)
const generarCuadriculaMes = (anio, mes) => {
  const primerDiaMes = new Date(anio, mes, 1);
  const ultimoDiaMes = new Date(anio, mes + 1, 0);
  const totalDias = ultimoDiaMes.getDate();

  // Convertir domingo (0) a 6, y lunes (1) a 0
  const offsetInicio = (primerDiaMes.getDay() + 6) % 7;

  const celdas = [];
  for (let i = 0; i < offsetInicio; i++) {
    celdas.push(null);
  }

  for (let dia = 1; dia <= totalDias; dia++) {
    const mStr = String(mes + 1).padStart(2, '0');
    const dStr = String(dia).padStart(2, '0');
    celdas.push({
      dia,
      fechaISO: `${anio}-${mStr}-${dStr}`,
    });
  }

  while (celdas.length % 7 !== 0) {
    celdas.push(null);
  }

  return celdas;
};

const AgendaVeterinarioPage = () => {
  const navigate = useNavigate();
  const role = (localStorage.getItem('role') || localStorage.getItem('rol') || 'cliente').toLowerCase();
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');

  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [fecha, setFecha] = useState(hoyISO());

  // Vista inicial en 'calendario'; al elegir un día pasa a 'dia'
  const [vistaModo, setVistaModo] = useState('calendario');
  const [mesActual, setMesActual] = useState(() => {
    const hoy = new Date();
    return { anio: hoy.getFullYear(), mes: hoy.getMonth() };
  });

  // Estados para el Modal de Edición
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Sesión válida para veterinario o admin
  const expiration = localStorage.getItem('token_expiration');
  const sesionValida =
    !!token &&
    (!expiration || Date.now() <= parseInt(expiration, 10)) &&
    ['veterinario', 'admin'].includes(role);

  // Control de sesión y de rol
  useEffect(() => {
    if (!sesionValida) navigate('/login');
  }, [sesionValida, navigate]);

  // Obtener todos los turnos correspondientes según el rol desde el backend
  const obtenerTurnos = useCallback(async () => {
    try {
      setCargando(true);
      setError('');

      // Veterinario consulta su propia agenda; Admin consulta todos los turnos
      const endpoint =
        role === 'admin' ? '/api/clinica/turnos' : '/api/clinica/turnos/agenda';

      const res = await api.get(endpoint);
      let lista = Array.isArray(res.data) ? res.data : [];

      // Filtro opcional adicional si es veterinario y tiene veterinarioId en localStorage
      const idVeterinario = localStorage.getItem('veterinarioId');
      if (role === 'veterinario' && idVeterinario) {
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
  }, [role]);

  // Carga los turnos al entrar a la vista
  useEffect(() => {
    if (sesionValida) obtenerTurnos();
  }, [sesionValida, obtenerTurnos]);

  // Mapa de cantidad de turnos y estados por fecha ISO (YYYY-MM-DD)
  const turnosPorFecha = useMemo(() => {
    const mapa = {};
    turnos.forEach((t) => {
      const f = soloFecha(t.fecha_hora_inicio);
      if (!f) return;
      if (!mapa[f]) {
        mapa[f] = { total: 0, activos: 0, atendidos: 0, cancelados: 0 };
      }
      mapa[f].total += 1;
      const est = String(t.estado || 'programado').toLowerCase();
      if (est.includes('cancel')) {
        mapa[f].cancelados += 1;
      } else if (est.includes('atendid') || est.includes('complet') || est.includes('realiz')) {
        mapa[f].atendidos += 1;
      } else {
        mapa[f].activos += 1;
      }
    });
    return mapa;
  }, [turnos]);

  const celdasCalendario = useMemo(
    () => generarCuadriculaMes(mesActual.anio, mesActual.mes),
    [mesActual.anio, mesActual.mes]
  );

  // Cambiar de mes en la vista calendario
  const cambiarMes = (delta) => {
    setMesActual((prev) => {
      const nuevaFecha = new Date(prev.anio, prev.mes + delta, 1);
      return { anio: nuevaFecha.getFullYear(), mes: nuevaFecha.getMonth() };
    });
  };

  const irAMesActual = () => {
    const hoy = new Date();
    setMesActual({ anio: hoy.getFullYear(), mes: hoy.getMonth() });
  };

  const seleccionarDia = (fechaISO) => {
    setFecha(fechaISO);
    setVistaModo('dia');
  };

  const volverAlCalendario = () => {
    const [y, m] = fecha.split('-').map(Number);
    if (y && m) {
      setMesActual({ anio: y, mes: m - 1 });
    }
    setVistaModo('calendario');
  };

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
      obtenerTurnos();
    } catch (err) {
      console.error('Error al actualizar turno:', err);
      alert('Error al guardar el estado: ' + (err.response?.data?.detail || err.message));
    } finally {
      setGuardando(false);
    }
  };

  // Navegación entre días dentro de la vista diaria
  const moverDia = (n) => {
    const d = new Date(`${fecha}T00:00:00`);
    d.setDate(d.getDate() + n);
    const nuevaFecha = d.toLocaleDateString('en-CA');
    setFecha(nuevaFecha);
    setMesActual({ anio: d.getFullYear(), mes: d.getMonth() });
  };

  const turnosDelDia = turnos.filter((t) => soloFecha(t.fecha_hora_inicio) === fecha);

  const prefijoMesActual = `${mesActual.anio}-${String(mesActual.mes + 1).padStart(2, '0')}`;
  const totalTurnosMes = turnos.filter((t) =>
    soloFecha(t.fecha_hora_inicio).startsWith(prefijoMesActual)
  ).length;

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
          {vistaModo === 'dia' ? (
            <button
              onClick={volverAlCalendario}
              className="text-xs font-semibold hover:underline bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl cursor-pointer transition"
            >
              ‹ Calendario
            </button>
          ) : (
            <button
              onClick={() => navigate('/home')}
              className="text-sm font-semibold hover:underline bg-white/10 px-3 py-1 rounded-xl cursor-pointer"
            >
              ‹ Volver
            </button>
          )}

          <div className="text-center">
            <h2 className="font-bold text-lg leading-tight">
              {role === 'admin' ? 'Agenda General' : 'Turnos Asignados'}
            </h2>
            <span className="text-[10px] text-white/80 font-medium block">
              {vistaModo === 'calendario' ? '📅 Selección mensual' : '🩺 Detalle del día'}
            </span>
          </div>

          <button
            onClick={obtenerTurnos}
            className="text-xs bg-white/15 hover:bg-white/25 px-2.5 py-1.5 rounded-xl font-semibold cursor-pointer transition"
            title="Actualizar agenda"
          >
            ↻
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

        {/* ==================== VISTA 1: CALENDARIO MENSUAL ==================== */}
        {!cargando && !error && vistaModo === 'calendario' && (
          <div>
            {/* Controles de navegación de mes */}
            <div className="flex items-center justify-between bg-white/10 rounded-2xl p-2.5 mb-3">
              <button
                onClick={() => cambiarMes(-1)}
                className="px-3 py-1 font-bold cursor-pointer hover:bg-white/20 rounded-lg transition text-base"
                title="Mes anterior"
              >
                ‹
              </button>

              <div className="text-center">
                <p className="font-extrabold text-sm tracking-wide">
                  {NOMBRES_MESES[mesActual.mes]} {mesActual.anio}
                </p>
                <button
                  onClick={irAMesActual}
                  className="text-[10px] text-cyan-100 underline hover:text-white cursor-pointer"
                >
                  Ir al mes actual
                </button>
              </div>

              <button
                onClick={() => cambiarMes(1)}
                className="px-3 py-1 font-bold cursor-pointer hover:bg-white/20 rounded-lg transition text-base"
                title="Mes siguiente"
              >
                ›
              </button>
            </div>

            {/* Resumen del mes y leyenda */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-[11px]">
              <span className="bg-white/10 px-3 py-1 rounded-full font-medium">
                {totalTurnosMes} turno(s) en este mes
              </span>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f1adb6] inline-block border border-white/40"></span>
                  Con turnos
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-white/20 inline-block"></span>
                  Sin turnos
                </span>
              </div>
            </div>

            {/* Cuadrícula de semanas */}
            <div className="bg-white/10 p-3 rounded-2xl shadow-inner">
              {/* Encabezado de días de la semana */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-cyan-100 mb-2">
                {DIAS_SEMANA.map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Casilleros de días */}
              <div className="grid grid-cols-7 gap-1.5">
                {celdasCalendario.map((celda, idx) => {
                  if (!celda) {
                    return <div key={`vacio-${idx}`} className="h-12 rounded-xl bg-white/5" />;
                  }

                  const info = turnosPorFecha[celda.fechaISO];
                  const tieneTurnos = !!info && info.total > 0;
                  const esHoy = celda.fechaISO === hoyISO();

                  return (
                    <button
                      key={celda.fechaISO}
                      type="button"
                      onClick={() => seleccionarDia(celda.fechaISO)}
                      className={`h-12 rounded-xl flex flex-col items-center justify-between p-1.5 transition-all cursor-pointer relative border ${
                        tieneTurnos
                          ? 'bg-[#f1adb6] text-[#0d7373] font-extrabold border-white shadow-md hover:scale-105 hover:bg-[#e89ca6]'
                          : 'bg-white/10 text-white hover:bg-white/20 border-transparent'
                      } ${esHoy ? 'ring-2 ring-amber-300' : ''}`}
                      title={
                        tieneTurnos
                          ? `${info.total} turno(s) el ${celda.fechaISO}`
                          : `Ver ${celda.fechaISO}`
                      }
                    >
                      <span className="text-xs leading-none">{celda.dia}</span>

                      {tieneTurnos ? (
                        <span className="text-[9px] leading-none px-1.5 py-0.5 rounded-full bg-[#0d7373] text-white font-bold">
                          {info.total} {info.total === 1 ? 'turno' : 'turnos'}
                        </span>
                      ) : (
                        esHoy && (
                          <span className="text-[8px] leading-none uppercase font-bold text-amber-300">
                            Hoy
                          </span>
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-center text-[11px] text-cyan-50/90 mt-3">
              Hacé clic en cualquier día del calendario para ver y gestionar sus turnos.
            </p>
          </div>
        )}

        {/* ==================== VISTA 2: TURNOS DEL DÍA ==================== */}
        {!cargando && !error && vistaModo === 'dia' && (
          <>
            {/* Selector de día */}
            <div className="flex items-center justify-between bg-white/10 rounded-2xl p-2 mb-3">
              <button
                onClick={() => moverDia(-1)}
                className="px-3 py-1 font-bold cursor-pointer hover:bg-white/20 rounded-lg transition"
              >
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

              <button
                onClick={() => moverDia(1)}
                className="px-3 py-1 font-bold cursor-pointer hover:bg-white/20 rounded-lg transition"
              >
                ›
              </button>
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium bg-white/10 inline-block px-3 py-1 rounded-full">
                {turnosDelDia.length} turno(s) para este día
              </p>
              <button
                type="button"
                onClick={volverAlCalendario}
                className="text-xs font-bold underline hover:text-cyan-100 cursor-pointer"
              >
                📅 Ver mes completo
              </button>
            </div>

            <div className="space-y-3 pb-8">
              {turnosDelDia.length === 0 ? (
                <div className="bg-white/10 p-6 rounded-2xl text-center text-sm font-medium">
                  No hay turnos agendados para este día.
                </div>
              ) : (
                turnosDelDia.map((t, i) => {
                  const idMascota = t.mascota_id ?? t.id_mascota;
                  const idVet = t.veterinario_id ?? t.id_veterinario;
                  const nombreMascota =
                    t.nombre_mascota ||
                    t.mascota_nombre ||
                    (idMascota ? `N° ${idMascota}` : 'No especificada');
                  const nombreCliente =
                    t.nombre_cliente ||
                    t.cliente_nombre ||
                    t.nombre_dueno ||
                    t.cliente ||
                    'No asignado';
                  const nombreVet =
                    t.nombre_veterinario ||
                    t.veterinario_nombre ||
                    t.atendido_por ||
                    (idVet ? `Veterinario N° ${idVet}` : 'Sin asignar');

                  return (
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
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide ${colorEstado(
                              t.estado
                            )}`}
                          >
                            {t.estado}
                          </span>
                        )}
                      </div>

                      <div className="space-y-0.5 pt-1">
                        <p>
                          <strong className="text-gray-900 font-semibold">Mascota:</strong>{' '}
                          {nombreMascota}
                        </p>
                        <p>
                          <strong className="text-gray-900 font-semibold">Dueño:</strong>{' '}
                          {nombreCliente}
                        </p>
                        <p>
                          <strong className="text-gray-900 font-semibold">Veterinario:</strong>{' '}
                          {nombreVet}
                        </p>
                        {(t.motivo || t.servicio) && (
                          <p className="text-gray-500 text-[11px] mt-1">
                            <strong>Detalle:</strong> {t.servicio || t.motivo}
                          </p>
                        )}
                      </div>

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
                  );
                })
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
              Actualizando estado del turno de{' '}
              <strong>
                {turnoSeleccionado.nombre_mascota ||
                  turnoSeleccionado.mascota_nombre ||
                  `Mascota N°${turnoSeleccionado.mascota_id ?? turnoSeleccionado.id_mascota}`}
              </strong>
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
                  {guardando
                    ? 'Procesando...'
                    : nuevoEstado === 'atendido'
                    ? 'Iniciar Consulta Médica ➔'
                    : 'Confirmar Estado'}
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