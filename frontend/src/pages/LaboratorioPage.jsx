import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

// El backend guarda los estados en minúscula con guión bajo
const ESTADOS = {
  extraida: { texto: 'Extraída', clase: 'bg-amber-100 text-amber-800' },
  empaquetada: { texto: 'Empaquetada', clase: 'bg-amber-100 text-amber-800' },
  en_transito: { texto: 'En Tránsito', clase: 'bg-amber-100 text-amber-800' },
  recibida: { texto: 'Recibida', clase: 'bg-blue-100 text-blue-700' },
  analizada: { texto: 'Analizada', clase: 'bg-green-100 text-green-700' },
  rechazada: { texto: 'Muestra Rechazada', clase: 'bg-red-100 text-red-700' },
};

const infoEstado = (estado) =>
  ESTADOS[estado] ?? { texto: estado, clase: 'bg-gray-100 text-gray-700' };

// "2026-11-12 08:55:03" -> "12/11/2026"
const fechaCorta = (dt = '') => {
  const [y, m, d] = String(dt).slice(0, 10).split('-');
  return d ? `${d}/${m}/${y}` : '';
};

// Evita que un dato con caracteres HTML rompa el informe imprimible
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const MuestrasPage = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'cliente';

  const [muestras, setMuestras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(null); // id de la muestra en proceso
  const [resultados, setResultados] = useState({}); // texto del resultado por id_muestra
  const [searchMode, setSearchMode] = useState('listado');
  const [searchTerm, setSearchTerm] = useState('');

  // Sesión válida y rol correcto
  const expiration = localStorage.getItem('token_expiration');
  const sesionValida =
    !!expiration &&
    Date.now() <= parseInt(expiration, 10) &&
    ['veterinario', 'admin'].includes(role);

  useEffect(() => {
    if (!sesionValida) navigate('/login');
  }, [sesionValida, navigate]);

  const cargarMuestras = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      // La barra final es necesaria: sin ella FastAPI redirige y se pierde el token
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

  // Ejecuta una acción sobre una muestra y recarga la lista
  const ejecutarAccion = async (idMuestra, accion, cuerpo) => {
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
    ejecutarAccion(id, 'recibir', { estado_precinto: precintoIntacto ? 'intacto' : 'roto' });

  const finalizarAnalisis = (id) => {
    const texto = (resultados[id] || '').trim();
    if (!texto) {
      setError('Escribí el resultado del análisis antes de finalizar.');
      return;
    }
    ejecutarAccion(id, 'analizar', { resultado: texto });
  };

  const muestrasFiltradas = muestras.filter((m) => {
    if (searchMode === 'codigo') {
      if (!searchTerm.trim()) return false;
      const term = searchTerm.toLowerCase().trim();
      return [m.codigo, m.nro_remito, m.paciente, m.nombre_cliente, String(m.id_cliente ?? '')].some(
        (campo) => campo?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleDescargarPDF = (m) => {
    const ventana = window.open('', '_blank');
    if (!ventana) return;
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
            <p><strong>Precinto:</strong> ${esc(m.nro_precinto || '-')} ${m.estado_precinto ? `(${esc(m.estado_precinto)})` : ''}</p>
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
            onClick={() => navigate('/laboratorio-hub')}
            className="text-sm font-semibold hover:underline"
          >
            ‹ Volver
          </button>
          <h2 className="font-bold text-lg">Muestras Biológicas</h2>
          <button
            onClick={cargarMuestras}
            className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-xl font-semibold"
            title="Actualizar"
          >
            ↻
          </button>
        </div>

        {/* Selector de modo */}
        <div className="bg-white/10 p-1 rounded-2xl flex mb-4 text-xs font-bold">
          <button
            onClick={() => setSearchMode('listado')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              searchMode === 'listado' ? 'bg-white text-[#129b9b] shadow' : 'text-white hover:bg-white/10'
            }`}
          >
            📋 Ver Lista
          </button>
          <button
            onClick={() => setSearchMode('codigo')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              searchMode === 'codigo' ? 'bg-white text-[#129b9b] shadow' : 'text-white hover:bg-white/10'
            }`}
          >
            🔍 Buscar por Código
          </button>
        </div>

        {searchMode === 'codigo' && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Código de muestra, remito, paciente o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white text-gray-800 p-3 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0d7373]/50 shadow"
            />
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-xl text-xs mb-3 font-medium">{error}</div>
        )}

        {cargando ? (
          <div className="text-center p-6 text-sm">Cargando muestras...</div>
        ) : (
          <div className="space-y-3">
            {muestrasFiltradas.length > 0 ? (
              muestrasFiltradas.map((m) => {
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
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${est.clase}`}>
                        {est.texto}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <p><strong>Paciente:</strong> {m.paciente ?? '-'}</p>
                      <p><strong>Origen:</strong> {m.clinica_origen ?? '-'}</p>
                      <p className="col-span-2"><strong>Análisis:</strong> {m.analisis ?? '-'}</p>
                      <p><strong>Extracción:</strong> {fechaCorta(m.fecha_extraccion)}</p>
                      {m.nro_remito && <p><strong>Remito:</strong> {m.nro_remito}</p>}
                      {m.nro_precinto && (
                        <p className="col-span-2 font-mono text-gray-500">
                          <strong>Precinto:</strong> {m.nro_precinto}
                        </p>
                      )}
                    </div>

                    {m.resultado && (
                      <p className="bg-[#129b9b]/10 p-2 rounded-xl text-[11px]">
                        <strong>Resultado:</strong> {m.resultado}
                      </p>
                    )}

                    {/* Recepción: solo una muestra en tránsito puede recibirse */}
                    {m.estado_actual === 'en_transito' && (
                      <div className="bg-[#129b9b]/10 p-2.5 rounded-xl border border-[#129b9b]/20 space-y-2 pt-2">
                        <p className="font-bold text-[#129b9b] text-[10px] uppercase">Control Sanitario:</p>
                        <div className="flex gap-2">
                          <button
                            disabled={ocupada}
                            onClick={() => recibir(m.id_muestra, true)}
                            className="flex-1 bg-green-600 text-white py-1.5 rounded-lg font-bold text-[10px] hover:bg-green-700 disabled:opacity-60 transition"
                          >
                            ✓ Precinto Intacto
                          </button>
                          <button
                            disabled={ocupada}
                            onClick={() => recibir(m.id_muestra, false)}
                            className="flex-1 bg-red-600 text-white py-1.5 rounded-lg font-bold text-[10px] hover:bg-red-700 disabled:opacity-60 transition"
                          >
                            ✕ Precinto Roto
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Carga de resultado: solo una muestra recibida puede analizarse */}
                    {m.estado_actual === 'recibida' && (
                      <div className="bg-[#129b9b]/10 p-2.5 rounded-xl border border-[#129b9b]/20 space-y-2">
                        <p className="font-bold text-[#129b9b] text-[10px] uppercase">Resultado del análisis:</p>
                        <textarea
                          rows={2}
                          value={resultados[m.id_muestra] || ''}
                          onChange={(e) =>
                            setResultados((prev) => ({ ...prev, [m.id_muestra]: e.target.value }))
                          }
                          placeholder="Escribí el informe diagnóstico..."
                          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#129b9b]/50"
                        />
                        <button
                          disabled={ocupada}
                          onClick={() => finalizarAnalisis(m.id_muestra)}
                          className="w-full bg-[#129b9b] hover:bg-[#0d7373] disabled:opacity-60 text-white py-1.5 rounded-lg font-bold text-[10px] transition"
                        >
                          🧪 Cargar Resultados & Finalizar
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => handleDescargarPDF(m)}
                      className="w-full bg-[#129b9b]/10 hover:bg-[#129b9b]/20 text-[#129b9b] font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-[#129b9b]/20 transition-colors mt-2"
                    >
                      <span>📥</span> Descargar Informe PDF
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="bg-white/10 p-6 rounded-2xl text-center text-xs">
                {searchMode === 'codigo' && !searchTerm
                  ? 'Ingresá un código para buscar una muestra.'
                  : 'No se encontraron muestras registradas.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MuestrasPage;