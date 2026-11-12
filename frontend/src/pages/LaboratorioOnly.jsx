import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const ESTADOS = {
  en_transito: { texto: 'En Tránsito', clase: 'bg-amber-100 text-amber-800' },
  recibida: { texto: 'Recibida en Lab', clase: 'bg-blue-100 text-blue-700' },
  analizada: { texto: 'Analizada (Enviada)', clase: 'bg-green-100 text-green-700' },
  rechazada: { texto: 'Muestra Rechazada', clase: 'bg-red-100 text-red-700' },
};

// Configuración visual para cada bolita de la línea de tiempo de trazabilidad
const ESTILOS_HITOS = {
  extraida: {
    titulo: 'Extraída',
    bolita: 'bg-slate-500 ring-slate-200',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    linea: 'bg-slate-300',
  },
  empaquetada: {
    titulo: 'Empaquetada',
    bolita: 'bg-indigo-500 ring-indigo-200',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    linea: 'bg-indigo-300',
  },
  en_transito: {
    titulo: 'En Tránsito',
    bolita: 'bg-amber-500 ring-amber-200',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    linea: 'bg-amber-300',
  },
  recibida: {
    titulo: 'Recibida en Lab',
    bolita: 'bg-blue-500 ring-blue-200',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    linea: 'bg-blue-300',
  },
  analizada: {
    titulo: 'Analizada',
    bolita: 'bg-emerald-500 ring-emerald-200',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    linea: 'bg-emerald-300',
  },
  rechazada: {
    titulo: 'Rechazada',
    bolita: 'bg-red-500 ring-red-200',
    badge: 'bg-red-50 text-red-700 border-red-200',
    linea: 'bg-red-300',
  },
};

const infoEstado = (estado) =>
  ESTADOS[estado] ?? { texto: estado, clase: 'bg-gray-100 text-gray-700' };

// "2026-11-12 08:55:03" -> "12/11/2026"
const fechaCorta = (dt = '') => {
  const [y, m, d] = String(dt).slice(0, 10).split('-');
  return d ? `${d}/${m}/${y}` : '';
};

// "2026-11-12 09:45:00" -> "12/11/2026 • 09:45 hs"
const formatearFechaHora = (dt = '') => {
  if (!dt) return '';
  const [fecha, hora] = String(dt).trim().split(' ');
  const [y, m, d] = (fecha || '').split('-');
  const horaCorta = hora ? hora.slice(0, 5) : '';
  return d ? `${d}/${m}/${y}${horaCorta ? ` • ${horaCorta} hs` : ''}` : dt;
};

// Extrae fecha, estado, usuario y observaciones de cada string de historial_trazabilidad
const parsearHito = (hitoStr = '') => {
  const texto = String(hitoStr);
  const matchFecha = texto.match(/\[(.*?)\]/);
  const fechaHora = matchFecha ? matchFecha[1] : '';

  const sinFecha = texto.replace(/\[.*?\]\s*/, '');
  const partes = sinFecha.split('|').map((p) => p.trim());

  let estado = '';
  let usuario = '';
  let obs = '';

  partes.forEach((p) => {
    if (p.toLowerCase().startsWith('estado:')) {
      estado = p.slice(7).trim().toLowerCase();
    } else if (p.toLowerCase().startsWith('usuario:')) {
      usuario = p.slice(8).trim();
    } else if (p.toLowerCase().startsWith('obs:')) {
      obs = p.slice(4).trim();
    }
  });

  if (!estado) {
    return {
      fechaHora: '',
      estado: 'extraida',
      usuario: '',
      obs: texto,
    };
  }

  return { fechaHora, estado, usuario, obs };
};

// Evita que un dato con caracteres HTML rompa el informe imprimible
const esc = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

const LaboratorioOnly = () => {
  const navigate = useNavigate();
  const role = (localStorage.getItem('role') || localStorage.getItem('rol') || '').toLowerCase();
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  const userName = localStorage.getItem('clientName') || localStorage.getItem('usuario') || 'labo1';

  const [muestras, setMuestras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(null);
  const [resultados, setResultados] = useState({});
  const [trazabilidadAbierta, setTrazabilidadAbierta] = useState({});
  const [searchMode, setSearchMode] = useState('listado');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Exclusivo para el rol 'laboratorio'
  const expiration = localStorage.getItem('token_expiration');
  const noExpirado = !expiration || Date.now() <= parseInt(expiration, 10);
  const sesionValida = !!token && noExpirado && role === 'laboratorio';

  useEffect(() => {
    if (!sesionValida) navigate('/login');
  }, [sesionValida, navigate]);

  const cargarMuestras = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      const res = await api.get('/api/muestras/');
      setMuestras(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error al obtener muestras:', err);
      setError(err.response?.data?.detail || 'No se pudieron cargar las muestras.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (sesionValida) cargarMuestras();
  }, [sesionValida, cargarMuestras]);

  const ejecutarAccion = async (idMuestra, accion, cuerpo = {}) => {
    try {
      setProcesando(idMuestra);
      setError('');
      await api.post(`/api/muestras/${idMuestra}/${accion}`, cuerpo);
      await cargarMuestras();
    } catch (err) {
      console.error(`Error en ${accion}:`, err);
      setError(err.response?.data?.detail || 'No se pudo completar la operación.');
    } finally {
      setProcesando(null);
    }
  };

  const recibir = (id, precintoIntacto) =>
    ejecutarAccion(id, 'recibir', {
      estado_precinto: precintoIntacto ? 'intacto' : 'roto',
    });

  const finalizarAnalisis = (id) => {
    const texto = (resultados[id] || '').trim();
    if (!texto) {
      setError('Escribí el resultado del análisis antes de enviarlo a la clínica.');
      return;
    }
    ejecutarAccion(id, 'analizar', { resultado: texto });
  };

  const toggleTrazabilidad = (id) => {
    setTrazabilidadAbierta((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const cerrarSesion = () => {
    localStorage.clear();
    navigate('/login');
  };

  const muestrasFiltradas = muestras.filter((m) => {
    if (['extraida', 'empaquetada'].includes(m.estado_actual)) {
      return false;
    }
    if (filtroEstado !== 'todos' && m.estado_actual !== filtroEstado) {
      return false;
    }
    if (searchMode === 'codigo') {
      if (!searchTerm.trim()) return false;
      const term = searchTerm.toLowerCase().trim();
      return [
        m.codigo,
        m.nro_remito,
        m.nro_precinto,
        m.paciente,
        m.nombre_cliente,
        String(m.id_cliente ?? ''),
      ].some((campo) => campo?.toLowerCase().includes(term));
    }
    return true;
  });

  const handleDescargarPDF = (m) => {
    const ventana = window.open('', '_blank');
    if (!ventana) return;
    const itemsHistorial = Array.isArray(m.historial_trazabilidad)
      ? m.historial_trazabilidad.map((h) => `<li>${esc(h)}</li>`).join('')
      : '';

    ventana.document.write(`
      <html>
        <head>
          <title>Informe de Laboratorio - ${esc(m.codigo)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 25px; color: #333; }
            .header { border-bottom: 2px solid #129b9b; padding-bottom: 10px; margin-bottom: 20px; }
            .title { color: #129b9b; margin: 0; }
            .box { background: #f9f9f9; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
            .footer { margin-top: 30px; font-size: 11px; text-align: center; color: #777; }
            ul { font-size: 12px; padding-left: 18px; color: #444; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Vet2Gö - Laboratorio Biológico Central</h1>
            <p>Comprobante de Análisis y Trazabilidad Sanitaria</p>
          </div>
          <div class="box">
            <p><strong>Código de muestra:</strong> ${esc(m.codigo)}</p>
            <p><strong>Nº Remito:</strong> ${esc(m.nro_remito || '-')}</p>
            <p><strong>Precinto:</strong> ${esc(m.nro_precinto || '-')} ${
              m.estado_precinto ? `(${esc(m.estado_precinto)})` : ''
            }</p>
            <p><strong>Cliente:</strong> ${esc(m.nombre_cliente)}</p>
            <p><strong>Paciente:</strong> ${esc(m.paciente)}</p>
            <p><strong>Clínica origen:</strong> ${esc(m.clinica_origen)}</p>
            <p><strong>Fecha de extracción:</strong> ${esc(fechaCorta(m.fecha_extraccion))}</p>
          </div>
          <div class="box">
            <h3>Resultado del Análisis (${esc(m.analisis)}):</h3>
            <p><strong>Estado:</strong> ${esc(infoEstado(m.estado_actual).texto)}</p>
            <p><strong>Informe Diagnóstico:</strong> ${esc(m.resultado || 'Pendiente')}</p>
          </div>
          ${
            itemsHistorial
              ? `<div class="box">
                  <h3>Cadena de Custodia Inmutable:</h3>
                  <ul>${itemsHistorial}</ul>
                </div>`
              : ''
          }
          <div class="footer">
            <p>Documento oficial emitido con cadena de custodia inmutable.</p>
          </div>
        </body>
      </html>
    `);
    ventana.document.close();
    ventana.print();
  };

  if (!sesionValida) return null;

  return (
    <div className="min-h-screen bg-[#0d7373] flex flex-col relative">
      {/* Fondo exterior */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/logologin.jpg')" }}
      />

      {/* BARRA SUPERIOR IGUAL A LOS OTROS USUARIOS (/home) */}
      <header className="sticky top-0 z-30 w-full bg-[#0d7373] border-b border-white/15 px-6 py-3 flex justify-between items-center text-white shadow-md">
        <div className="flex items-center gap-1 font-extrabold text-2xl tracking-wide">
          Vet<span className="text-[#e8a2a7]">2</span>Gö
          <span className="text-pink-300 text-xl ml-0.5">🐾</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-sm">
              👤
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold">{userName}</p>
              <span className="inline-block bg-white/20 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wider">
                LABORATORIO
              </span>
            </div>
          </div>

          <button
            onClick={cerrarSesion}
            className="bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>🐾</span> Cerrar Sesión
          </button>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL EN DISPOSICIÓN HORIZONTAL */}
      <div className="relative z-10 flex-1 flex items-start justify-center p-4 md:p-6">
        <div className="w-full max-w-5xl bg-[#129b9b] rounded-3xl shadow-2xl p-6 text-white">
          {/* Título interno + Botón actualizar */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-bold text-lg leading-tight">Laboratorio Central</h2>
              <span className="text-[11px] text-white/80 font-medium">
                🔬 Recepción y Análisis de Muestras
              </span>
            </div>
            <button
              onClick={cargarMuestras}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl font-semibold cursor-pointer"
              title="Actualizar"
            >
              ↻
            </button>
          </div>

          {/* Controles en fila horizontal: Selector de modo + Filtros rápidos */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div className="bg-white/10 p-1 rounded-2xl flex text-xs font-bold md:w-80">
              <button
                onClick={() => setSearchMode('listado')}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  searchMode === 'listado'
                    ? 'bg-white text-[#129b9b] shadow'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                📋 Ver Lista
              </button>
              <button
                onClick={() => setSearchMode('codigo')}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  searchMode === 'codigo'
                    ? 'bg-white text-[#129b9b] shadow'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                🔍 Buscar por Código
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
              {[
                { id: 'todos', label: 'Todas' },
                { id: 'en_transito', label: '🚚 En Tránsito' },
                { id: 'recibida', label: '📥 Recibidas' },
                { id: 'analizada', label: '✅ Analizadas' },
                { id: 'rechazada', label: '🚨 Rechazadas' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltroEstado(f.id)}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    filtroEstado === f.id
                      ? 'bg-white text-[#0d7373] shadow-sm'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {searchMode === 'codigo' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Código de muestra, remito, precinto, paciente o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white text-gray-800 p-3 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0d7373]/50 shadow"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-xl text-xs mb-3 font-medium">
              {error}
            </div>
          )}

          {cargando ? (
            <div className="text-center p-6 text-sm">Cargando muestras...</div>
          ) : (
            <div>
              {muestrasFiltradas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  {muestrasFiltradas.map((m) => {
                    const est = infoEstado(m.estado_actual);
                    const ocupada = procesando === m.id_muestra;

                    return (
                      <div
                        key={m.id_muestra}
                        className="bg-white text-gray-800 p-4 rounded-2xl shadow-lg text-xs space-y-2"
                      >
                        <div className="flex justify-between items-center border-b border-[#129b9b]/30 pb-2">
                          <div>
                            <span className="font-bold text-[#129b9b]">{m.codigo}</span>
                            <span className="text-[10px] text-gray-400 block">
                              Cliente: {m.nombre_cliente ?? '-'} (N° {m.id_cliente ?? '-'})
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${est.clase}`}
                          >
                            {est.texto}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          <p>
                            <strong>Paciente:</strong> {m.paciente ?? '-'}
                          </p>
                          <p>
                            <strong>Origen:</strong> {m.clinica_origen ?? '-'}
                          </p>
                          <p className="col-span-2">
                            <strong>Análisis:</strong> {m.analisis ?? '-'}
                          </p>
                          <p>
                            <strong>Extracción:</strong> {fechaCorta(m.fecha_extraccion)}
                          </p>
                          {m.nro_remito && (
                            <p>
                              <strong>Remito:</strong> {m.nro_remito}
                            </p>
                          )}
                          {m.nro_precinto && (
                            <p className="col-span-2 font-mono text-gray-600">
                              <strong>Precinto:</strong> {m.nro_precinto}{' '}
                              {m.estado_precinto && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-sans font-bold uppercase ${
                                    m.estado_precinto === 'roto'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-green-100 text-green-700'
                                  }`}
                                >
                                  {m.estado_precinto}
                                </span>
                              )}
                            </p>
                          )}
                        </div>

                        {m.resultado && (
                          <p className="bg-green-50 border border-green-200 text-green-900 p-2 rounded-xl text-[11px]">
                            <strong>Resultado enviado a la Clínica:</strong> {m.resultado}
                          </p>
                        )}

                        {m.estado_actual === 'rechazada' && (
                          <p className="bg-red-50 border border-red-200 text-red-700 p-2 rounded-xl text-[11px] font-semibold">
                            🚨 Muestra rechazada automáticamente por precinto sanitario roto.
                          </p>
                        )}

                        {/* 1. Recepción: solo una muestra en tránsito puede recibirse o rechazarse */}
                        {m.estado_actual === 'en_transito' && (
                          <div className="bg-[#129b9b]/10 p-2.5 rounded-xl border border-[#129b9b]/20 space-y-2 pt-2">
                            <p className="font-bold text-[#129b9b] text-[10px] uppercase">
                              Control Sanitario de Recepción:
                            </p>
                            <div className="flex gap-2">
                              <button
                                disabled={ocupada}
                                onClick={() => recibir(m.id_muestra, true)}
                                className="flex-1 bg-green-600 text-white py-1.5 rounded-lg font-bold text-[10px] hover:bg-green-700 disabled:opacity-60 transition cursor-pointer"
                              >
                                ✓ Recibida (Precinto Intacto)
                              </button>
                              <button
                                disabled={ocupada}
                                onClick={() => recibir(m.id_muestra, false)}
                                className="flex-1 bg-red-600 text-white py-1.5 rounded-lg font-bold text-[10px] hover:bg-red-700 disabled:opacity-60 transition cursor-pointer"
                              >
                                ✕ Precinto Roto (Rechazar)
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 2. Carga de resultado: solo una muestra recibida puede analizarse y enviarse de vuelta */}
                        {m.estado_actual === 'recibida' && (
                          <div className="bg-[#129b9b]/10 p-2.5 rounded-xl border border-[#129b9b]/20 space-y-2">
                            <p className="font-bold text-[#129b9b] text-[10px] uppercase">
                              Resultado del análisis:
                            </p>
                            <textarea
                              rows={2}
                              value={resultados[m.id_muestra] || ''}
                              onChange={(e) =>
                                setResultados((prev) => ({
                                  ...prev,
                                  [m.id_muestra]: e.target.value,
                                }))
                              }
                              placeholder="Escribí el informe diagnóstico para enviar a la clínica..."
                              className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#129b9b]/50"
                            />
                            <button
                              disabled={ocupada}
                              onClick={() => finalizarAnalisis(m.id_muestra)}
                              className="w-full bg-[#129b9b] hover:bg-[#0d7373] disabled:opacity-60 text-white py-1.5 rounded-lg font-bold text-[10px] transition cursor-pointer"
                            >
                              🧪 Cargar Resultados & Enviar de Vuelta
                            </button>
                          </div>
                        )}

                        {/* LÍNEA DE TIEMPO VISUAL DE TRAZABILIDAD INMUTABLE */}
                        {Array.isArray(m.historial_trazabilidad) &&
                          m.historial_trazabilidad.length > 0 && (
                            <div className="pt-1 border-t border-gray-100">
                              <button
                                type="button"
                                onClick={() => toggleTrazabilidad(m.id_muestra)}
                                className="text-[11px] font-bold text-[#0d7373] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>{trazabilidadAbierta[m.id_muestra] ? '▼' : '▶'}</span>
                                <span>
                                  {trazabilidadAbierta[m.id_muestra] ? 'Ocultar' : 'Ver'} Trazabilidad
                                  Inmutable ({m.historial_trazabilidad.length} hitos)
                                </span>
                              </button>

                              {trazabilidadAbierta[m.id_muestra] && (
                                <div className="mt-2.5 bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80">
                                  <div className="relative">
                                    {m.historial_trazabilidad.map((hitoStr, idx) => {
                                      const hito = parsearHito(hitoStr);
                                      const estilo =
                                        ESTILOS_HITOS[hito.estado] || ESTILOS_HITOS.extraida;
                                      const esUltimo =
                                        idx === m.historial_trazabilidad.length - 1;

                                      return (
                                        <div
                                          key={idx}
                                          className="relative flex items-start gap-3 pb-3.5 last:pb-0"
                                        >
                                          {/* Línea vertical conectora de transición */}
                                          {!esUltimo && (
                                            <span
                                              className={`absolute left-[7px] top-4 -bottom-1 w-0.5 ${estilo.linea}`}
                                            />
                                          )}

                                          {/* Bolita de color del estado */}
                                          <span
                                            className={`relative z-10 mt-0.5 w-4 h-4 rounded-full shrink-0 ring-4 ${estilo.bolita} flex items-center justify-center shadow-xs`}
                                          >
                                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                          </span>

                                          {/* Tarjetita con los datos de la transición */}
                                          <div className="flex-1 bg-white p-2.5 rounded-xl border border-gray-100 shadow-2xs space-y-1">
                                            <div className="flex flex-wrap justify-between items-center gap-1">
                                              <span
                                                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${estilo.badge}`}
                                              >
                                                {estilo.titulo}
                                              </span>
                                              {hito.fechaHora && (
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                  🕒 {formatearFechaHora(hito.fechaHora)}
                                                </span>
                                              )}
                                            </div>

                                            <div className="text-[11px] text-gray-600 flex flex-wrap gap-x-3 gap-y-0.5">
                                              {hito.usuario && (
                                                <span>
                                                  👤 <strong className="text-gray-700">{hito.usuario}</strong>
                                                </span>
                                              )}
                                              {hito.obs && (
                                                <span className="text-gray-500 italic">
                                                  “{hito.obs}”
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                        <button
                          onClick={() => handleDescargarPDF(m)}
                          className="w-full bg-[#129b9b]/10 hover:bg-[#129b9b]/20 text-[#129b9b] font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-[#129b9b]/20 transition-colors mt-2 cursor-pointer"
                        >
                          <span>📥</span> Descargar Informe PDF
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white/10 p-6 rounded-2xl text-center text-xs">
                  {searchMode === 'codigo' && !searchTerm
                    ? 'Ingresá un código para buscar una muestra.'
                    : 'No hay muestras en tránsito ni procesadas en este momento.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaboratorioOnly;