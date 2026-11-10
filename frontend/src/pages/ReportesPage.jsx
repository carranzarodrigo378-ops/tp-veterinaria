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
  const [facturacion, setFacturacion] = useState(null);
  const [turnos, setTurnos] = useState(null);
  const [demografia, setDemografia] = useState(null);

  // Estados para los filtros variables de Atenciones (pedido del profesor)
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [veterinariosInput, setVeterinariosInput] = useState(''); // Ej: "1" o "1,2"
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
      // Si el backend envía token renovado por interacción, lo actualizamos
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
        resProd,
        resFact,
        resTurnos,
        resDemo,
      ] = await Promise.all([
        fetchConAuth('/resumen-general'),
        fetchConAuth(`/atenciones${armarQueryAtenciones()}`),
        fetchConAuth('/calidad-muestras'),
        fetchConAuth('/derivaciones-tipo'),
        fetchConAuth('/alertas-vacunas'),
        fetchConAuth('/productividad-veterinarios'),
        fetchConAuth('/facturacion'),
        fetchConAuth('/turnos'),
        fetchConAuth('/demografia-mascotas'),
      ]);

      setResumen(resGeneral);
      setAtenciones(resAtenciones);
      setCalidadMuestras(Array.isArray(resCalidad) ? resCalidad : []);
      setDerivaciones(Array.isArray(resDerivaciones) ? resDerivaciones : []);
      setAlertasVacunas(Array.isArray(resVacunas) ? resVacunas : []);
      setProductividad(Array.isArray(resProd) ? resProd : []);
      setFacturacion(resFact);
      setTurnos(resTurnos);
      setDemografia(resDemo);
    } catch (err) {
      setError('No se pudieron cargar algunos reportes desde el servidor.');
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, [token, fetchConAuth, armarQueryAtenciones]);

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
    const hoy = new Date().toISOString().split('T')[0];
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
    <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2 justify-end">
      <button
        type="button"
        onClick={() => descargarReporte('pdf', tipo)}
        disabled={descargando === `${tipo}-pdf`}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-2.5 py-1 rounded-lg text-[11px] transition shadow-sm"
      >
        {descargando === `${tipo}-pdf` ? 'Generando...' : '📄 PDF (ReportLab)'}
      </button>
      <button
        type="button"
        onClick={() => descargarReporte('csv', tipo)}
        disabled={descargando === `${tipo}-csv`}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded-lg text-[11px] transition shadow-sm"
      >
        {descargando === `${tipo}-csv` ? 'Generando...' : '📊 CSV'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6">
      <div className="w-full max-w-2xl min-h-screen md:min-h-[720px] bg-[#129b9b] md:rounded-3xl shadow-2xl p-5 text-white flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Encabezado */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => navigate(-1)}
              className="text-sm font-semibold hover:underline bg-white/10 px-3 py-1 rounded-xl"
            >
              ‹ Volver
            </button>
            <h2 className="font-bold text-lg text-center">Reportes y Estadísticas (UTN-FRC)</h2>
            <button
              onClick={cargarTodosLosReportes}
              className="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-xl font-semibold"
              title="Actualizar datos"
            >
              ↻ Actualizar
            </button>
          </div>

          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded-xl text-xs mb-3 font-medium">
              {error}
            </div>
          )}

          {/* KPIs Resumen General */}
          {resumen && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-center">
              <div className="bg-white/15 backdrop-blur-sm p-2.5 rounded-2xl">
                <p className="text-[11px] opacity-80">Mascotas Activas</p>
                <p className="text-lg font-extrabold">{resumen.mascotas_activas ?? resumen.total_mascotas ?? 0}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm p-2.5 rounded-2xl">
                <p className="text-[11px] opacity-80">Consultas Hoy</p>
                <p className="text-lg font-extrabold">{resumen.consultas_hoy ?? 0}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm p-2.5 rounded-2xl">
                <p className="text-[11px] opacity-80">Muestras Totales</p>
                <p className="text-lg font-extrabold">{resumen.total_muestras ?? 0}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm p-2.5 rounded-2xl">
                <p className="text-[11px] opacity-80">Facturación Total</p>
                <p className="text-lg font-extrabold">${resumen.facturacion_total ?? 0}</p>
              </div>
            </div>
          )}

          {cargando ? (
            <div className="text-center py-12 text-sm font-medium animate-pulse">
              Consultando base de datos y generando métricas...
            </div>
          ) : (
            <div className="space-y-3.5 text-gray-800">
              {/* 1. REPORTE DINÁMICO DE ATENCIONES (PEDIDO DEL PROFESOR) */}
              <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-2">
                <h3 className="font-bold text-[#129b9b] text-sm flex justify-between border-b pb-1">
                  <span>1. Atenciones Clínicas (Consulta Variable Dinámica)</span>
                  <span>🩺</span>
                </h3>

                {/* Controles de filtro en 1 sola consulta */}
                <form onSubmit={filtrarAtenciones} className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold">Desde</label>
                    <input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      className="w-full border rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold">Hasta</label>
                    <input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      className="w-full border rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold">IDs Veterinarios (ej: 1,2)</label>
                    <input
                      type="text"
                      placeholder="Todos (o 1, 2)"
                      value={veterinariosInput}
                      onChange={(e) => setVeterinariosInput(e.target.value)}
                      className="w-full border rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold">Especie</label>
                    <select
                      value={especieFiltro}
                      onChange={(e) => setEspecieFiltro(e.target.value)}
                      className="w-full border rounded-lg px-2 py-1 text-xs bg-white"
                    >
                      <option value="">Todas</option>
                      <option value="perro">Perro</option>
                      <option value="gato">Gato</option>
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-4 flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="submit"
                      className="bg-[#129b9b] text-white px-3 py-1 rounded-lg font-semibold hover:bg-[#0d7373]"
                    >
                      Filtrar consulta
                    </button>
                    <button
                      type="button"
                      onClick={aplicarFiltroHoy}
                      className="bg-amber-500 text-white px-2.5 py-1 rounded-lg font-semibold hover:bg-amber-600"
                    >
                      Atendidos Hoy
                    </button>
                    <button
                      type="button"
                      onClick={limpiarFiltrosAtenciones}
                      className="bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg font-medium hover:bg-gray-300"
                    >
                      Ver todos
                    </button>
                  </div>
                </form>

                {atenciones && (
                  <div className="bg-teal-50/70 p-2.5 rounded-xl space-y-1 mt-1">
                    <p className="text-gray-700">
                      Total consultas filtradas:{' '}
                      <strong>{atenciones.total_atenciones ?? atenciones.total_consultas ?? 0}</strong> | Mascotas
                      únicas atendidas:{' '}
                      <strong>{atenciones.mascotas_distintas ?? atenciones.total_mascotas_atendidas ?? 0}</strong>
                    </p>
                    {atenciones.por_veterinario?.length > 0 && (
                      <div className="pt-1 space-y-0.5">
                        {atenciones.por_veterinario.map((v) => (
                          <p key={v.id_veterinario} className="text-gray-600 text-[11px]">
                            • {v.veterinario}: <strong>{v.atenciones} atenciones</strong> ({v.mascotas_distintas}{' '}
                            mascotas)
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <BotonesExportacion tipo="atenciones" />
              </div>

              {/* 2. CONTROL DE CALIDAD Y RECHAZO DE MUESTRAS */}
              <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-1">
                <h3 className="font-bold text-red-600 text-sm flex justify-between border-b pb-1">
                  <span>2. Control de Calidad y Rechazo de Muestras</span>
                  <span>🚨</span>
                </h3>
                {calidadMuestras.length === 0 ? (
                  <p className="text-gray-500 pt-1">Sin muestras derivadas registradas aún.</p>
                ) : (
                  calidadMuestras.map((lab, idx) => (
                    <div key={idx} className="pt-1">
                      <p className="text-gray-700">
                        {lab.laboratorio || 'Laboratorio Central'}:{' '}
                        <strong>
                          {lab.rechazadas} rechazadas de {lab.total_muestras} ({lab.porcentaje_rechazo ?? lab.tasa_rechazo_porcentaje ?? 0}%)
                        </strong>
                      </p>
                    </div>
                  ))
                )}
                <p className="text-gray-400 italic text-[11px]">
                  Control de integridad de precinto y temperatura en recepción.
                </p>
                <BotonesExportacion tipo="calidad-muestras" />
              </div>

              {/* 3. DERIVACIONES POR TIPO DE ANÁLISIS */}
              <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-1">
                <h3 className="font-bold text-[#129b9b] text-sm flex justify-between border-b pb-1">
                  <span>3. Derivaciones por Estudio Clínico</span>
                  <span>📊</span>
                </h3>
                {derivaciones.length === 0 ? (
                  <p className="text-gray-500 pt-1">No hay órdenes de derivación emitidas.</p>
                ) : (
                  derivaciones.map((d, i) => (
                    <p key={i} className="text-gray-600 pt-0.5">
                      • {d.tipo_analisis} ({d.tipo_muestra || 'muestra'}):{' '}
                      <strong>{d.total_derivaciones ?? d.cantidad ?? 0} órdenes</strong>
                    </p>
                  ))
                )}
                <BotonesExportacion tipo="derivaciones" />
              </div>

              {/* 4. ALERTAS DE ESQUEMA DE VACUNACIÓN */}
              <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-1">
                <h3 className="font-bold text-[#129b9b] text-sm flex justify-between border-b pb-1">
                  <span>4. Alertas Epidemiológicas de Vacunación</span>
                  <span>💉</span>
                </h3>
                <p className="text-gray-600 pt-1">
                  Pacientes con alerta vacunal o refuerzo próximo: <strong>{alertasVacunas.length}</strong>
                </p>
                {alertasVacunas.slice(0, 3).map((alerta, i) => (
                  <p key={i} className="text-gray-500 text-[11px]">
                    • {alerta.mascota} ({alerta.especie}) - {alerta.vacuna || 'Esquema incompleto'}:{' '}
                    <strong>{alerta.estado_alerta || alerta.fecha_atencion}</strong>
                  </p>
                ))}
                <BotonesExportacion tipo="alertas-vacunas" />
              </div>

              {/* 5. PRODUCTIVIDAD POR VETERINARIO */}
              <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-1">
                <h3 className="font-bold text-[#129b9b] text-sm flex justify-between border-b pb-1">
                  <span>5. Productividad por Profesional Veterinario</span>
                  <span>👨‍⚕️</span>
                </h3>
                {productividad.map((vet) => (
                  <p key={vet.id_veterinario} className="text-gray-600 pt-0.5">
                    • {vet.veterinario} ({vet.matricula}):{' '}
                    <strong>
                      {vet.total_consultas} consultas | {vet.mascotas_unicas_atendidas} mascotas |{' '}
                      {vet.ordenes_derivadas} derivaciones
                    </strong>
                  </p>
                ))}
                <BotonesExportacion tipo="productividad-veterinarios" />
              </div>

              {/* 6. FACTURACIÓN Y COMPROBANTES EMITIDOS (TRANSACCIÓN PUNTO 2) */}
              <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-1">
                <h3 className="font-bold text-[#129b9b] text-sm flex justify-between border-b pb-1">
                  <span>6. Facturación y Comprobantes de Atención</span>
                  <span>🧾</span>
                </h3>
                <p className="text-gray-600 pt-1">
                  Comprobantes emitidos: <strong>{facturacion?.cantidad_comprobantes ?? 0}</strong> | Recaudación
                  Total: <strong>${facturacion?.recaudacion_total ?? 0}</strong>
                </p>
                {facturacion?.desglose_por_rubro?.map((r, i) => (
                  <p key={i} className="text-gray-500 text-[11px]">
                    • Rubro {r.rubro}: <strong>${r.recaudacion}</strong> ({r.items_vendidos} ítems)
                  </p>
                ))}
                <BotonesExportacion tipo="facturacion" />
              </div>

              {/* 7. GESTIÓN DE TURNOS */}
              <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-1">
                <h3 className="font-bold text-[#129b9b] text-sm flex justify-between border-b pb-1">
                  <span>7. Estado de Turnos Programados</span>
                  <span>📅</span>
                </h3>
                <p className="text-gray-600 pt-1">
                  Total de turnos en agenda: <strong>{turnos?.detalle_turnos?.length ?? 0}</strong>
                </p>
                <div className="flex gap-3 pt-0.5">
                  {turnos?.resumen_estados?.map((est, i) => (
                    <span key={i} className="text-gray-500 text-[11px]">
                      {est.estado.toUpperCase()}: <strong>{est.cantidad}</strong>
                    </span>
                  ))}
                </div>
                <BotonesExportacion tipo="turnos" />
              </div>

              {/* 8. PADRÓN DEMOGRÁFICO Y AUDITORÍA DE BAJAS LÓGICAS (PUNTO 1) */}
              <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-1">
                <h3 className="font-bold text-[#129b9b] text-sm flex justify-between border-b pb-1">
                  <span>8. Padrón de Mascotas y Bajas Lógicas</span>
                  <span>🐾</span>
                </h3>
                {demografia?.distribucion_especies?.map((esp, i) => (
                  <p key={i} className="text-gray-600 pt-0.5">
                    • {esp.especie.toUpperCase()}: <strong>{esp.total} totales</strong> ({esp.activas} activas /{' '}
                    {esp.bajas_logicas} dadas de baja lógica)
                  </p>
                ))}
                <BotonesExportacion tipo="demografia-mascotas" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportesPage;