import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://127.0.0.1:8000/api/reportes';

const ReportesPage = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || localStorage.getItem('rol') || 'cliente';
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');

  // Estados de datos reales del backend
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [descargando, setDescargando] = useState('');

  const [resumen, setResumen] = useState(null);
  const [atenciones, setAtenciones] = useState(null);
  const [calidadMuestras, setCalidadMuestras] = useState([]);
  const [derivaciones, setDerivaciones] = useState([]);
  const [alertasVacunas, setAlertasVacunas] = useState([]);
  const [productividad, setProductividad] = useState([]);
  const [turnos, setTurnos] = useState(null);
  const [demografia, setDemografia] = useState(null);

  // Estados para los filtros variables de Atenciones
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [veterinariosInput, setVeterinariosInput] = useState('');
  const [especieFiltro, setEspecieFiltro] = useState('');

  useEffect(() => {
    const expiration = localStorage.getItem('token_expiration');
    const expirado = expiration && Date.now() > parseInt(expiration, 10);
    if (!token || expirado || !['veterinario', 'admin'].includes(role)) {
      navigate('/login');
    }
  }, [role, token, navigate]);

  const fetchConAuth = useCallback(
    async (endpoint) => {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tokenRenovado = res.headers.get('X-Renewed-Token');
      if (tokenRenovado) {
        localStorage.setItem('token', tokenRenovado);
      }
      if (!res.ok) throw new Error(`Error ${res.status} al consultar ${endpoint}`);
      return res.json();
    },
    [token]
  );

  const armarQueryAtenciones = useCallback(() => {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fecha_desde', fechaDesde);
    if (fechaHasta) params.append('fecha_hasta', fechaHasta);
    if (especieFiltro) params.append('especie', especieFiltro);

    if (veterinariosInput.trim()) {
      veterinariosInput
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id))
        .forEach((id) => params.append('veterinarios_ids', id));
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [fechaDesde, fechaHasta, veterinariosInput, especieFiltro]);

  const cargarTodosLosReportes = useCallback(async () => {
    if (!token) return;
    setCargando(true);
    setError('');
    try {
      const [
        resGeneral,
        resAtenciones,
        resCalidad,
        resDerivaciones,
        resVacunas,
        resTurnos,
      ] = await Promise.all([
        fetchConAuth('/resumen-general'),
        fetchConAuth(`/atenciones${armarQueryAtenciones()}`),
        fetchConAuth('/calidad-muestras'),
        fetchConAuth('/derivaciones-tipo'),
        fetchConAuth('/alertas-vacunas'),
        fetchConAuth('/turnos'),
      ]);

      setResumen(resGeneral);
      setAtenciones(resAtenciones);
      setCalidadMuestras(Array.isArray(resCalidad) ? resCalidad : []);
      setDerivaciones(Array.isArray(resDerivaciones) ? resDerivaciones : []);
      setAlertasVacunas(Array.isArray(resVacunas) ? resVacunas : []);
      setTurnos(resTurnos);

      if (role === 'admin') {
        const [resProd, resDemo] = await Promise.all([
          fetchConAuth('/productividad-veterinarios'),
          fetchConAuth('/demografia-mascotas'),
        ]);
        setProductividad(Array.isArray(resProd) ? resProd : []);
        setDemografia(resDemo);
      }
    } catch (err) {
      setError('No se pudieron cargar algunos reportes desde el servidor.');
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, [token, role, fetchConAuth, armarQueryAtenciones]);

  useEffect(() => {
    cargarTodosLosReportes();
  }, [cargarTodosLosReportes]);

  const filtrarAtenciones = async (e) => {
    if (e) e.preventDefault();
    try {
      const data = await fetchConAuth(`/atenciones${armarQueryAtenciones()}`);
      setAtenciones(data);
    } catch {
      setError('Error al aplicar los filtros de atención.');
    }
  };

  const aplicarFiltroHoy = async () => {
    const hoy = new Date().toLocaleDateString('en-CA');
    setFechaDesde(hoy);
    setFechaHasta(hoy);
    const data = await fetchConAuth(`/atenciones?fecha_desde=${hoy}&fecha_hasta=${hoy}`);
    setAtenciones(data);
  };

  const limpiarFiltrosAtenciones = async () => {
    setFechaDesde('');
    setFechaHasta('');
    setVeterinariosInput('');
    setEspecieFiltro('');
    const data = await fetchConAuth('/atenciones');
    setAtenciones(data);
  };

  const descargarReporte = async (formato, tipoReporte) => {
    try {
      setDescargando(`${tipoReporte}-${formato}`);
      const qs = tipoReporte === 'atenciones' ? armarQueryAtenciones() : '';
      const res = await fetch(`${API_BASE}/exportar/${formato}/${tipoReporte}${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Error al exportar el documento');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${tipoReporte}.${formato}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('No se pudo descargar el archivo. Verificá que el backend esté corriendo.');
      console.error(err);
    } finally {
      setDescargando('');
    }
  };

  const BotonesExportacion = ({ tipo }) => (
    <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 mt-3">
      <span className="text-[10px] text-gray-400 font-medium">
        Exportar informe completo
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => descargarReporte('pdf', tipo)}
          disabled={descargando === `${tipo}-pdf`}
          className="bg-[#0d7373] hover:bg-[#0a5c5c] disabled:opacity-60 text-white font-semibold px-3 py-1 rounded-lg text-[11px] transition shadow-sm flex items-center gap-1"
        >
          {descargando === `${tipo}-pdf` ? 'Generando...' : '📄 Descargar PDF'}
        </button>
        <button
          type="button"
          onClick={() => descargarReporte('csv', tipo)}
          disabled={descargando === `${tipo}-csv`}
          className="bg-[#129b9b] hover:bg-[#0f8686] disabled:opacity-60 text-white font-semibold px-3 py-1 rounded-lg text-[11px] transition shadow-sm flex items-center gap-1"
        >
          {descargando === `${tipo}-csv` ? 'Generando...' : '📊 Exportar CSV'}
        </button>
      </div>
    </div>
  );

  const inputClase =
    'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#129b9b]/50 bg-gray-50/70';

  const maxDerivaciones = Math.max(
    ...derivaciones.map((d) => Number(d.total_derivaciones ?? d.cantidad ?? 0)),
    1
  );

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6 relative">
      {/* Fondo exterior */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/logologin.jpg')" }}
      />

      <div className="relative z-10 w-full max-w-3xl min-h-screen md:min-h-[720px] bg-[#129b9b] md:rounded-3xl shadow-2xl p-5 text-white overflow-y-auto">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-semibold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl transition"
          >
            ‹ Volver
          </button>
          <div className="text-center">
            <h2 className="font-bold text-lg tracking-tight">
              Panel de Reportes y Estadísticas
            </h2>
            <span className="inline-block mt-0.5 text-[10px] font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              {role === 'admin' ? '🛡️ Vista Gerencial y Clínica' : '🩺 Vista Clínica y Operativa'}
            </span>
          </div>
          <button
            onClick={cargarTodosLosReportes}
            className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl font-semibold transition"
            title="Actualizar métricas"
          >
            ↻ Actualizar
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded-xl text-xs mb-3 font-medium">
            {error}
          </div>
        )}

        {/* KPIs Resumen General con iconos */}
        {resumen && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
            <div className="bg-white/15 backdrop-blur-sm p-3 rounded-2xl border border-white/15 flex items-center gap-2.5">
              <span className="text-2xl bg-white/20 p-2 rounded-xl">🐾</span>
              <div>
                <p className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">
                  Mascotas Activas
                </p>
                <p className="text-xl font-extrabold leading-tight">
                  {resumen.mascotas_activas ?? resumen.total_mascotas ?? 0}
                </p>
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-sm p-3 rounded-2xl border border-white/15 flex items-center gap-2.5">
              <span className="text-2xl bg-white/20 p-2 rounded-xl">🩺</span>
              <div>
                <p className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">
                  Consultas Hoy
                </p>
                <p className="text-xl font-extrabold leading-tight">
                  {resumen.consultas_hoy ?? 0}
                </p>
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-sm p-3 rounded-2xl border border-white/15 flex items-center gap-2.5">
              <span className="text-2xl bg-white/20 p-2 rounded-xl">🧪</span>
              <div>
                <p className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">
                  Muestras Totales
                </p>
                <p className="text-xl font-extrabold leading-tight">
                  {resumen.total_muestras ?? 0}
                </p>
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-sm p-3 rounded-2xl border border-white/15 flex items-center gap-2.5">
              <span className="text-2xl bg-white/20 p-2 rounded-xl">🚚</span>
              <div>
                <p className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">
                  En Tránsito
                </p>
                <p className="text-xl font-extrabold leading-tight">
                  {resumen.remitos_en_transito ?? 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {cargando ? (
          <div className="text-center py-12 text-sm font-medium animate-pulse">
            Consultando base de datos y generando métricas...
          </div>
        ) : (
          <div className="space-y-4 text-gray-800">
            {/* 1. REPORTE DINÁMICO DE ATENCIONES */}
            <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-2.5">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <div>
                  <h3 className="font-bold text-[#0d7373] text-sm">
                    1. Atenciones Clínicas Realizadas
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Filtrá por rango de fechas, profesionales o especie del paciente
                  </p>
                </div>
                <span className="text-lg bg-[#129b9b]/10 p-1.5 rounded-xl">🩺</span>
              </div>

              <form onSubmit={filtrarAtenciones} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-500 font-semibold mb-0.5">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className={inputClase}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 font-semibold mb-0.5">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className={inputClase}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 font-semibold mb-0.5">
                    IDs Veterinarios (ej: 1,2)
                  </label>
                  <input
                    type="text"
                    placeholder="Todos"
                    value={veterinariosInput}
                    onChange={(e) => setVeterinariosInput(e.target.value)}
                    className={inputClase}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 font-semibold mb-0.5">
                    Especie
                  </label>
                  <select
                    value={especieFiltro}
                    onChange={(e) => setEspecieFiltro(e.target.value)}
                    className={inputClase}
                  >
                    <option value="">Todas las especies</option>
                    <option value="perro">🐶 Perro</option>
                    <option value="gato">🐱 Gato</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-4 flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="submit"
                    className="bg-[#129b9b] text-white px-3.5 py-1.5 rounded-lg font-semibold hover:bg-[#0d7373] transition"
                  >
                    🔍 Aplicar filtros
                  </button>
                  <button
                    type="button"
                    onClick={aplicarFiltroHoy}
                    className="bg-amber-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-600 transition"
                  >
                    ⚡ Atendidos Hoy
                  </button>
                  <button
                    type="button"
                    onClick={limpiarFiltrosAtenciones}
                    className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-200 transition"
                  >
                    Limpiar
                  </button>
                </div>
              </form>

              {atenciones && (
                <div className="bg-[#f0f9f9] border border-[#129b9b]/20 p-3 rounded-xl space-y-2">
                  <div className="flex flex-wrap gap-3">
                    <span className="bg-white px-2.5 py-1 rounded-lg shadow-xs text-gray-700">
                      Consultas encontradas:{' '}
                      <strong className="text-[#0d7373] text-sm">
                        {atenciones.total_atenciones ?? atenciones.total_consultas ?? 0}
                      </strong>
                    </span>
                    <span className="bg-white px-2.5 py-1 rounded-lg shadow-xs text-gray-700">
                      Pacientes únicos:{' '}
                      <strong className="text-[#0d7373] text-sm">
                        {atenciones.mascotas_distintas ?? atenciones.total_mascotas_atendidas ?? 0}
                      </strong>
                    </span>
                  </div>

                  {atenciones.por_veterinario?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {atenciones.por_veterinario.map((v) => (
                        <div
                          key={v.id_veterinario}
                          className="bg-white px-2.5 py-1.5 rounded-lg flex justify-between items-center border border-gray-100"
                        >
                          <span className="font-medium text-gray-700">👨‍⚕️ {v.veterinario}</span>
                          <span className="bg-[#129b9b]/15 text-[#0d7373] font-bold px-2 py-0.5 rounded-full text-[11px]">
                            {v.atenciones} cons. ({v.mascotas_distintas} masc.)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <BotonesExportacion tipo="atenciones" />
            </div>

            {/* 2. CONTROL DE CALIDAD Y RECHAZO DE MUESTRAS */}
            <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-2">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <div>
                  <h3 className="font-bold text-[#0d7373] text-sm">
                    2. Control de Calidad y Rechazo de Muestras
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Verificación de precinto sanitario y viabilidad en recepción de laboratorio
                  </p>
                </div>
                <span className="text-lg bg-red-50 p-1.5 rounded-xl">🚨</span>
              </div>

              {calidadMuestras.length === 0 ? (
                <div className="bg-gray-50 text-gray-500 p-3 rounded-xl text-center">
                  Aún no hay muestras derivadas registradas en el laboratorio.
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  {calidadMuestras.map((lab, idx) => {
                    const pct = Number(lab.porcentaje_rechazo ?? lab.tasa_rechazo_porcentaje ?? 0);
                    return (
                      <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-800">
                            🏥 {lab.laboratorio || 'Laboratorio Central'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              pct > 20
                                ? 'bg-red-100 text-red-700'
                                : pct > 0
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {pct}% tasa de rechazo
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center pt-1">
                          <div className="bg-white p-1.5 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-gray-400">Total Muestras</p>
                            <p className="font-bold text-gray-700 text-sm">{lab.total_muestras}</p>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-emerald-600">Analizadas / En Curso</p>
                            <p className="font-bold text-emerald-700 text-sm">
                              {(lab.total_muestras || 0) - (lab.rechazadas || 0)}
                            </p>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-red-500">Rechazadas (Precinto)</p>
                            <p className="font-bold text-red-600 text-sm">{lab.rechazadas}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <BotonesExportacion tipo="calidad-muestras" />
            </div>

            {/* 3. DERIVACIONES POR TIPO DE ANÁLISIS */}
            <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-2">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <div>
                  <h3 className="font-bold text-[#0d7373] text-sm">
                    3. Derivaciones por Estudio Clínico
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Volumen de órdenes emitidas según tipo de análisis y muestra biológica
                  </p>
                </div>
                <span className="text-lg bg-[#129b9b]/10 p-1.5 rounded-xl">📊</span>
              </div>

              {derivaciones.length === 0 ? (
                <div className="bg-gray-50 text-gray-500 p-3 rounded-xl text-center">
                  No hay órdenes de derivación emitidas hasta el momento.
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  {derivaciones.map((d, i) => {
                    const cant = Number(d.total_derivaciones ?? d.cantidad ?? 0);
                    const anchoBarra = Math.max(Math.round((cant / maxDerivaciones) * 100), 8);
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold text-gray-700">
                            {d.tipo_analisis}{' '}
                            <span className="text-gray-400 font-normal uppercase text-[10px]">
                              ({d.tipo_muestra || 'muestra'})
                            </span>
                          </span>
                          <span className="font-bold text-[#0d7373]">{cant} órdenes</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#129b9b] h-full rounded-full transition-all"
                            style={{ width: `${anchoBarra}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <BotonesExportacion tipo="derivaciones" />
            </div>

            {/* 4. ALERTAS DE ESQUEMA DE VACUNACIÓN */}
            <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-2">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <div>
                  <h3 className="font-bold text-[#0d7373] text-sm">
                    4. Alertas Epidemiológicas de Vacunación
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Pacientes activos con dosis vencidas o refuerzos dentro de los próximos 30 días
                  </p>
                </div>
                <span className="text-lg bg-amber-50 p-1.5 rounded-xl">💉</span>
              </div>

              {alertasVacunas.length === 0 ? (
                <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-center font-medium">
                  ✔ Todos los pacientes activos tienen su esquema de vacunación al día.
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  {alertasVacunas.slice(0, 5).map((alerta, i) => {
                    const esVencida = String(alerta.estado_alerta).toLowerCase().includes('vencida');
                    return (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-100"
                      >
                        <div>
                          <p className="font-bold text-gray-800">
                            {alerta.mascota}{' '}
                            <span className="text-gray-400 font-normal capitalize">
                              ({alerta.especie})
                            </span>{' '}
                            • <span className="text-[#0d7373]">{alerta.vacuna}</span>
                          </p>
                          <p className="text-[10px] text-gray-500">
                            Responsable: {alerta.cliente} ({alerta.telefono})
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              esVencida
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {String(alerta.estado_alerta).replace('_', ' ')}
                          </span>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Refuerzo: {alerta.proxima_dosis}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <BotonesExportacion tipo="alertas-vacunas" />
            </div>

            {/* 5. GESTIÓN DE TURNOS */}
            <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-2">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <div>
                  <h3 className="font-bold text-[#0d7373] text-sm">
                    5. Estado de Turnos Programados
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Seguimiento de asistencia, turnos en espera de guardia y cancelaciones
                  </p>
                </div>
                <span className="text-lg bg-[#129b9b]/10 p-1.5 rounded-xl">📅</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                {['programado', 'atendido', 'cancelado'].map((estadoKey) => {
                  const item = turnos?.resumen_estados?.find(
                    (e) => e.estado.toLowerCase() === estadoKey
                  );
                  const cantidad = item ? item.cantidad : 0;
                  const estilos = {
                    programado: 'bg-amber-50 text-amber-700 border-amber-200',
                    atendido: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    cancelado: 'bg-gray-100 text-gray-600 border-gray-200',
                  }[estadoKey];
                  return (
                    <div key={estadoKey} className={`p-2 rounded-xl border ${estilos}`}>
                      <p className="text-[10px] uppercase font-bold tracking-wider">
                        {estadoKey}s
                      </p>
                      <p className="text-base font-extrabold">{cantidad}</p>
                    </div>
                  );
                })}
              </div>
              <BotonesExportacion tipo="turnos" />
            </div>

            {/* REPORTES GERENCIALES EXCLUSIVOS PARA ADMIN */}
            {role === 'admin' && (
              <>
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-white/20 px-3 py-1 rounded-full">
                    🔒 Reportes Gerenciales y de Auditoría (Exclusivo Administración)
                  </span>
                </div>

                {/* 6. PRODUCTIVIDAD POR VETERINARIO */}
                <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-2">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div>
                      <h3 className="font-bold text-[#0d7373] text-sm">
                        6. Productividad por Profesional Veterinario
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        Comparativa de consultas atendidas, pacientes únicos y derivaciones emitidas
                      </p>
                    </div>
                    <span className="text-lg bg-[#129b9b]/10 p-1.5 rounded-xl">👨‍⚕️</span>
                  </div>

                  <div className="overflow-x-auto pt-1">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-[10px] text-gray-400 uppercase">
                          <th className="py-1.5">Profesional</th>
                          <th className="py-1.5 text-center">Matrícula</th>
                          <th className="py-1.5 text-center">Consultas</th>
                          <th className="py-1.5 text-center">Pacientes</th>
                          <th className="py-1.5 text-center">Derivaciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {productividad.map((vet) => (
                          <tr key={vet.id_veterinario} className="hover:bg-gray-50">
                            <td className="py-2 font-semibold text-gray-800">{vet.veterinario}</td>
                            <td className="py-2 text-center text-gray-500">{vet.matricula}</td>
                            <td className="py-2 text-center font-bold text-[#0d7373]">
                              {vet.total_consultas}
                            </td>
                            <td className="py-2 text-center text-gray-700">
                              {vet.mascotas_unicas_atendidas}
                            </td>
                            <td className="py-2 text-center text-gray-700">
                              {vet.ordenes_derivadas}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <BotonesExportacion tipo="productividad-veterinarios" />
                </div>

                {/* 7. PADRÓN DEMOGRÁFICO Y AUDITORÍA DE BAJAS LÓGICAS */}
                <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-2">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div>
                      <h3 className="font-bold text-[#0d7373] text-sm">
                        7. Padrón de Mascotas y Auditoría de Bajas Lógicas
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        Distribución demográfica por especie y trazabilidad de registros inactivos
                      </p>
                    </div>
                    <span className="text-lg bg-[#129b9b]/10 p-1.5 rounded-xl">🐾</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {demografia?.distribucion_especies?.map((esp, i) => (
                      <div
                        key={i}
                        className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-gray-800 uppercase text-xs">
                            {esp.especie === 'perro' ? '🐶 ' : esp.especie === 'gato' ? '🐱 ' : '🐾 '}
                            {esp.especie}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Total registrado: <strong>{esp.total}</strong>
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="block bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {esp.activas} activas
                          </span>
                          <span className="block bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                            {esp.bajas_logicas} bajas lógicas
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <BotonesExportacion tipo="demografia-mascotas" />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportesPage;