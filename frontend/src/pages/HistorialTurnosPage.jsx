import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';

const FILTROS_ESTADO = [
  { id: 'todos', label: 'Todos' },
  { id: 'programado', label: 'Programados' },
  { id: 'atendido', label: 'Atendidos' },
  { id: 'cancelado', label: 'Cancelados' },
];

const ESTADOS_TURNO = {
  programado: {
    texto: 'Programado',
    clase: 'bg-blue-100 text-blue-800 border-blue-200',
    icono: '🗓️',
  },
  atendido: {
    texto: 'Atendido',
    clase: 'bg-green-100 text-green-800 border-green-200',
    icono: '✅',
  },
  cancelado: {
    texto: 'Cancelado',
    clase: 'bg-red-100 text-red-800 border-red-200',
    icono: '❌',
  },
};

const claveEstado = (estado) => String(estado || 'programado').toLowerCase();

const infoEstadoTurno = (estado) => {
  const clave = claveEstado(estado);
  return (
    ESTADOS_TURNO[clave] ?? {
      texto: estado || 'Programado',
      clase: 'bg-gray-100 text-gray-700 border-gray-200',
      icono: '•',
    }
  );
};

// "2026-11-15 09:00:00" o "2026-11-15T09:00:00" → Date (compatible con Safari)
const parsearFecha = (valor) => {
  if (!valor) return null;
  const d = new Date(String(valor).trim().replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
};

// Devuelve { fecha: '14/11/2026', hora: '09:00 a 09:30' }
const extraerFechaHoraTurno = (t) => {
  const inicio = parsearFecha(t.fecha_hora_inicio || t.fecha_hora);
  if (!inicio) return { fecha: '-', hora: '-' };

  const fin = parsearFecha(t.fecha_hora_fin);
  const formatoHora = { hour: '2-digit', minute: '2-digit', hour12: false };

  let hora = inicio.toLocaleTimeString('es-AR', formatoHora);
  if (fin) hora = `${hora} a ${fin.toLocaleTimeString('es-AR', formatoHora)}`;

  return {
    fecha: inicio.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    hora,
  };
};

const extraerMascotaId = (t) =>
  t.mascota_id ?? t.id_mascota ?? t.mascota?.id_mascota ?? t.mascota?.id ?? null;

const extraerVeterinarioId = (t) =>
  t.veterinario_id ?? t.id_veterinario ?? t.veterinario?.id_veterinario ?? null;

const extraerTurnoId = (t) => t.id_turno ?? t.id ?? null;

// Arma el nombre visible de un veterinario a partir de lo que devuelva la API
const nombreVeterinario = (v) => {
  if (!v) return null;
  const completo =
    v.nombre_completo || [v.nombre, v.apellido].filter(Boolean).join(' ').trim();
  return completo ? completo : null;
};

const HistorialTurnosPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Datos de sesión
  const rol = (localStorage.getItem('role') || 'cliente').toLowerCase();
  const idCliente = Number(localStorage.getItem('clientId'));

  // Si venimos desde el detalle de una mascota, abre filtrado por ella
  const idMascotaInicial = location.state?.idMascota ?? null;

  const [mascotas, setMascotas] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [idMascotaFiltro, setIdMascotaFiltro] = useState(idMascotaInicial);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [cancelandoId, setCancelandoId] = useState(null);
  const [error, setError] = useState('');

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError('');

      // Mascotas según el rol
      let urlMascotas = '/api/clinica/mascotas?incluir_inactivos=false';
      if (rol === 'cliente') {
        if (!idCliente || !Number.isInteger(idCliente)) {
          throw new Error('No se encontró un ID de cliente válido.');
        }
        urlMascotas = `/api/clinica/clientes/${idCliente}/mascotas?incluir_inactivos=false`;
      }

      const [resMascotas, resTurnos] = await Promise.all([
        api.get(urlMascotas),
        api.get('/api/clinica/turnos'),
      ]);

      if (!Array.isArray(resMascotas.data) || !Array.isArray(resTurnos.data)) {
        throw new Error('La respuesta del servidor no tiene el formato esperado.');
      }

      setMascotas(resMascotas.data);
      setTurnos(resTurnos.data);

      // Veterinarios (para mostrar el nombre). Si falla, no rompe la pantalla.
      try {
        const resVets = await api.get('/api/clinica/veterinarios');
        setVeterinarios(Array.isArray(resVets.data) ? resVets.data : []);
      } catch (errVets) {
        console.error('Error al cargar veterinarios:', errVets);
      }
    } catch (err) {
      console.error('Error al cargar el historial:', err);
      setError(err.response?.data?.detail || err.message || 'No se pudieron cargar los turnos.');
    } finally {
      setCargando(false);
    }
  }, [idCliente, rol]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Cancelar turno: PATCH /api/clinica/turnos/{id_turno}/estado
  const handleCancelarTurno = async (turno) => {
    const idTurno = extraerTurnoId(turno);
    if (!idTurno) return;

    setCancelandoId(idTurno);
    setError('');
    try {
      await api.patch(`/api/clinica/turnos/${idTurno}/estado`, { estado: 'cancelado' });
      // Actualizamos en memoria para no recargar todo
      setTurnos((prev) =>
        prev.map((t) => (extraerTurnoId(t) === idTurno ? { ...t, estado: 'cancelado' } : t))
      );
    } catch (err) {
      console.error('Error al cancelar turno:', err);
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'No se pudo cancelar el turno.');
    } finally {
      setCancelandoId(null);
    }
  };

  // Mapas id → objeto
  const mascotasPorId = useMemo(() => {
    const mapa = {};
    mascotas.forEach((m) => {
      mapa[m.id_mascota ?? m.id] = m;
    });
    return mapa;
  }, [mascotas]);

  const veterinariosPorId = useMemo(() => {
    const mapa = {};
    veterinarios.forEach((v) => {
      mapa[v.id_veterinario ?? v.id] = v;
    });
    return mapa;
  }, [veterinarios]);

  // Nombre del veterinario (nunca el ID)
  const obtenerNombreVeterinario = useCallback(
    (turno) => {
      const directo =
        turno.nombre_veterinario ||
        turno.veterinario_nombre ||
        turno.atendido_por ||
        nombreVeterinario(turno.veterinario);
      if (directo) return directo;

      const idVet = extraerVeterinarioId(turno);
      return idVet !== null ? nombreVeterinario(veterinariosPorId[idVet]) : null;
    },
    [veterinariosPorId]
  );

  // Turnos (anteriores y programados) filtrados y ordenados
  const turnosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase();

    return turnos
      .filter((t) => {
        const inicio = parsearFecha(t.fecha_hora_inicio || t.fecha_hora);
        if (!inicio) return false;

        const mId = extraerMascotaId(t);
        const mascota = mascotasPorId[mId];

        // Para el cliente, solo mascotas propias (mascotas ya viene filtrado por cliente)
        if (rol === 'cliente' && !mascota) return false;

        if (idMascotaFiltro && Number(mId) !== Number(idMascotaFiltro)) return false;

        if (filtroEstado !== 'todos' && claveEstado(t.estado) !== filtroEstado) return false;

        if (texto) {
          const nombre = mascota?.nombre?.toLowerCase() || '';
          const motivo = t.motivo?.toLowerCase() || '';
          const servicio = t.servicio?.toLowerCase() || '';
          const vet = obtenerNombreVeterinario(t)?.toLowerCase() || '';
          return (
            nombre.includes(texto) ||
            motivo.includes(texto) ||
            servicio.includes(texto) ||
            vet.includes(texto)
          );
        }
        return true;
      })
      .sort(
        (a, b) =>
          parsearFecha(b.fecha_hora_inicio || b.fecha_hora) -
          parsearFecha(a.fecha_hora_inicio || a.fecha_hora)
      );
  }, [turnos, mascotasPorId, rol, idMascotaFiltro, filtroEstado, busqueda, obtenerNombreVeterinario]);

  // Agrupar por mascota
  const turnosPorMascota = useMemo(() => {
    const grupos = {};
    turnosFiltrados.forEach((t) => {
      const mId = extraerMascotaId(t);
      if (!grupos[mId]) grupos[mId] = [];
      grupos[mId].push(t);
    });
    return grupos;
  }, [turnosFiltrados]);

  const mascotaFiltrada = idMascotaFiltro ? mascotasPorId[idMascotaFiltro] : null;
  const hayFiltros = busqueda || idMascotaFiltro || filtroEstado !== 'todos';

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-4 relative">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/logologin.jpg')" }}
      />
      <div className="relative z-10 w-full max-w-md min-h-[600px] bg-[#129b9b] rounded-3xl shadow-2xl p-5 text-white">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-semibold hover:underline cursor-pointer"
          >
            ‹ Volver
          </button>
          <h2 className="font-bold text-lg text-center">
            Mis Turnos ({turnosFiltrados.length})
          </h2>
          <button
            onClick={cargarDatos}
            className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-xl font-semibold cursor-pointer"
            title="Actualizar turnos"
          >
            ↻
          </button>
        </div>

        {/* Filtro activo por mascota */}
        {mascotaFiltrada && (
          <div className="mb-3 flex items-center justify-between bg-white/15 rounded-xl px-3 py-2 text-sm">
            <span>
              Mostrando: <strong>{mascotaFiltrada.nombre}</strong>
            </span>
            <button
              onClick={() => setIdMascotaFiltro(null)}
              className="text-xs font-bold underline cursor-pointer"
            >
              Ver todas
            </button>
          </div>
        )}

        {!cargando && !error && (
          <>
            {/* Filtros por estado */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 text-[11px] font-semibold">
              {FILTROS_ESTADO.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltroEstado(f.id)}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
                    filtroEstado === f.id
                      ? 'bg-white text-[#129b9b] font-bold shadow'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Buscador */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por mascota, motivo, servicio o veterinario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-white/10 text-white placeholder-cyan-100/70 border border-white/20 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 transition-all text-sm"
              />
            </div>
          </>
        )}

        {/* Cargando */}
        {cargando && <div className="text-center p-6">Cargando turnos...</div>}

        {/* Error */}
        {!cargando && error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl text-sm">
            {error}
            <button
              onClick={cargarDatos}
              className="block mt-2 font-bold underline cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Listado agrupado por mascota */}
        {!cargando && !error && (
          <div className="space-y-5">
            {Object.keys(turnosPorMascota).length > 0 ? (
              Object.entries(turnosPorMascota).map(([idMascota, lista]) => {
                const mascota = mascotasPorId[idMascota];
                return (
                  <div key={idMascota}>
                    <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                      <span>
                        {mascota?.especie?.toLowerCase() === 'gato'
                          ? '🐱'
                          : mascota?.especie?.toLowerCase() === 'perro'
                            ? '🐶'
                            : '🐾'}
                      </span>
                      {mascota?.nombre || `Mascota #${idMascota}`}
                    </h3>

                    <div className="space-y-2.5">
                      {lista.map((turno, idx) => {
                        const est = infoEstadoTurno(turno.estado);
                        const { fecha, hora } = extraerFechaHoraTurno(turno);
                        const idTurno = extraerTurnoId(turno);
                        const vetNombre = obtenerNombreVeterinario(turno);
                        const inicio = parsearFecha(turno.fecha_hora_inicio || turno.fecha_hora);
                        const puedeCancelar =
                          claveEstado(turno.estado) === 'programado' &&
                          idTurno &&
                          inicio &&
                          inicio > new Date();

                        return (
                          <div
                            key={idTurno ?? idx}
                            className="bg-white text-gray-800 p-3.5 rounded-2xl shadow-md text-xs space-y-2"
                          >
                            <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                              <p className="text-[11px] text-gray-500 font-medium">
                                {turno.servicio || turno.tipo_servicio || 'Consulta Veterinaria'}
                              </p>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${est.clase}`}
                              >
                                {est.icono} {est.texto}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-700">
                              <p>
                                <strong>Fecha:</strong> {fecha}
                              </p>
                              <p>
                                <strong>Hora:</strong> {hora} hs
                              </p>
                              {vetNombre && (
                                <p className="col-span-2">
                                  <strong>Profesional:</strong> {vetNombre}
                                </p>
                              )}
                            </div>

                            {turno.motivo && (
                              <p className="bg-gray-50 p-2 rounded-xl text-[11px] text-gray-600">
                                <strong>Motivo:</strong> {turno.motivo}
                              </p>
                            )}

                            {puedeCancelar && (
                              <button
                                type="button"
                                disabled={cancelandoId === idTurno}
                                onClick={() => handleCancelarTurno(turno)}
                                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-1.5 rounded-xl text-[11px] border border-red-200 transition cursor-pointer disabled:opacity-50"
                              >
                                {cancelandoId === idTurno ? 'Cancelando...' : '✕ Cancelar Turno'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white/10 p-6 rounded-2xl text-center text-sm space-y-2">
                <p>
                  {hayFiltros
                    ? 'No se encontraron turnos con ese filtro.'
                    : 'Todavía no tenés turnos registrados.'}
                </p>
                {!hayFiltros && (
                  <button
                    type="button"
                    onClick={() => navigate('/turnos')}
                    className="mt-2 bg-white text-[#129b9b] px-4 py-2 rounded-full text-xs font-bold cursor-pointer"
                  >
                    Agendar mi primer turno
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialTurnosPage;
