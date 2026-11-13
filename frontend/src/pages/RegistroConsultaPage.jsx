import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';

const hoyISO = () => new Date().toLocaleDateString('en-CA');

// Suma 1 día a una fecha YYYY-MM-DD para fijar el mínimo estricto (> fecha base)
const sumarUnDiaISO = (fechaISO) => {
  const d = new Date(`${fechaISO}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-CA');
};

const normalizarTexto = (txt = '') =>
  String(txt)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const RegistroConsultaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const turnoId = searchParams.get('turno');
  const mascotaId = searchParams.get('mascota');
  const role = (localStorage.getItem('role') || localStorage.getItem('rol') || 'veterinario').toLowerCase();

  // Estados del formulario clínico
  const [motivo, setMotivo] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [vacunasAlDia, setVacunasAlDia] = useState(true);

  // Estados del turno y de vacunación
  const [turnoInfo, setTurnoInfo] = useState(null);
  const [fechaTurno, setFechaTurno] = useState(hoyISO());
  const [esTurnoVacunacion, setEsTurnoVacunacion] = useState(false);
  const [catalogoVacunas, setCatalogoVacunas] = useState([]);
  // Mapa { [id_vacuna]: { seleccionada, fecha_aplicacion, lote, proxima_dosis } }
  const [vacunasSeleccionadas, setVacunasSeleccionadas] = useState({});

  // Estados de derivación a laboratorio
  const [derivarLab, setDerivarLab] = useState(false);
  const [tipoAnalisis, setTipoAnalisis] = useState('');
  const [prioridad, setPrioridad] = useState('Normal');
  const [obsLab, setObsLab] = useState('');

  const [opcionesAnalisis, setOpcionesAnalisis] = useState([]);

  // Estados de carga, error y ÉXITO
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [mostrarExito, setMostrarExito] = useState(false);

  // Fecha mínima permitida para la próxima dosis: estrictamente mayor a hoy y a la fecha del turno
  const fechaBaseMinima = fechaTurno > hoyISO() ? fechaTurno : hoyISO();
  const minProximaDosis = sumarUnDiaISO(fechaBaseMinima);

  // Validación de URL y carga inicial de datos del turno, tipos de análisis y catálogo de vacunas
  useEffect(() => {
    if (!turnoId || !mascotaId) {
      navigate('/agenda');
      return;
    }

    const cargarDatosIniciales = async () => {
      try {
        const resAnalisis = await api.get('/api/atencion/tipos-analisis');
        setOpcionesAnalisis(resAnalisis.data || []);
        if (resAnalisis.data && resAnalisis.data.length > 0) {
          setTipoAnalisis(resAnalisis.data[0].nombre);
        }
      } catch (err) {
        console.error('Error al cargar tipos de análisis:', err);
      }

      try {
        const endpointTurnos =
          role === 'admin' ? '/api/clinica/turnos' : '/api/clinica/turnos/agenda';
        let listaTurnos = [];
        try {
          const resTurnos = await api.get(endpointTurnos);
          listaTurnos = Array.isArray(resTurnos.data) ? resTurnos.data : [];
        } catch {
          const resFallback = await api.get('/api/clinica/turnos');
          listaTurnos = Array.isArray(resFallback.data) ? resFallback.data : [];
        }

        const encontrado = listaTurnos.find(
          (t) => String(t.id_turno) === String(turnoId)
        );

        if (encontrado) {
          setTurnoInfo(encontrado);
          if (!motivo && encontrado.motivo) {
            setMotivo(encontrado.motivo);
          }

          // La fecha de aplicación es siempre la fecha del turno/consulta
          const fechaDelTurno =
            String(encontrado.fecha_hora_inicio || encontrado.fecha_hora || '').slice(0, 10) ||
            hoyISO();
          setFechaTurno(fechaDelTurno);

          const servNorm = normalizarTexto(encontrado.servicio);
          const motNorm = normalizarTexto(encontrado.motivo);
          const correspondeVacunacion =
            servNorm.includes('vacun') || motNorm.includes('vacun');

          setEsTurnoVacunacion(correspondeVacunacion);

          if (correspondeVacunacion) {
            const resVacunas = await api.get('/api/atencion/vacunas');
            const listaVacunas = Array.isArray(resVacunas.data) ? resVacunas.data : [];
            setCatalogoVacunas(listaVacunas);

            const estadoInicial = {};
            listaVacunas.forEach((v) => {
              estadoInicial[v.id_vacuna] = {
                seleccionada: false,
                fecha_aplicacion: fechaDelTurno,
                lote: '',
                proxima_dosis: '',
              };
            });
            setVacunasSeleccionadas(estadoInicial);
          }
        }
      } catch (err) {
        console.error('Error al verificar el servicio del turno o cargar vacunas:', err);
      }
    };

    cargarDatosIniciales();
  }, [turnoId, mascotaId, role, navigate]);

  const toggleSeleccionVacuna = (idVacuna) => {
    setVacunasSeleccionadas((prev) => ({
      ...prev,
      [idVacuna]: {
        ...(prev[idVacuna] || {
          lote: '',
          proxima_dosis: '',
        }),
        fecha_aplicacion: fechaTurno,
        seleccionada: !prev[idVacuna]?.seleccionada,
      },
    }));
  };

  const actualizarCampoVacuna = (idVacuna, campo, valor) => {
    setVacunasSeleccionadas((prev) => ({
      ...prev,
      [idVacuna]: {
        ...(prev[idVacuna] || {
          seleccionada: true,
          lote: '',
          proxima_dosis: '',
        }),
        fecha_aplicacion: fechaTurno,
        [campo]: valor,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const hoy = hoyISO();

    const aplicaciones = esTurnoVacunacion
      ? Object.entries(vacunasSeleccionadas)
          .filter(([, datos]) => datos?.seleccionada)
          .map(([idVacuna, datos]) => ({
            id_vacuna: parseInt(idVacuna, 10),
            fecha_aplicacion: fechaTurno,
            lote: datos.lote?.trim() || null,
            proxima_dosis: datos.proxima_dosis?.trim() || null,
          }))
      : [];

    if (esTurnoVacunacion && aplicaciones.length === 0) {
      setError('Seleccioná al menos una vacuna del catálogo para registrar la vacunación.');
      return;
    }

    for (const ap of aplicaciones) {
      if (ap.proxima_dosis && (ap.proxima_dosis <= hoy || ap.proxima_dosis <= fechaTurno)) {
        setError(
          'La fecha de la próxima dosis debe ser estrictamente posterior a la fecha actual y a la fecha del turno.'
        );
        return;
      }
    }

    setProcesando(true);

    try {
      // 1. Registrar la Consulta Médica y las vacunas aplicadas en una misma transacción
      const payloadConsulta = {
        id_mascota: parseInt(mascotaId, 10),
        id_turno: parseInt(turnoId, 10),
        motivo: motivo,
        diagnostico_preliminar: diagnostico,
        esquema_vacunas_al_dia: vacunasAlDia,
        vacunas_aplicadas: aplicaciones,
      };

      const resConsulta = await api.post('/api/atencion/consultas', payloadConsulta);
      const idConsultaCreada = resConsulta.data.id_consulta || resConsulta.data.id;

      // 2. Si se solicitó laboratorio, creamos la Orden y extraemos la Muestra
      if (derivarLab) {
        const payloadOrden = {
          id_consulta: idConsultaCreada,
          tipo_analisis: tipoAnalisis,
          prioridad: prioridad,
          observaciones: obsLab,
        };
        const resOrden = await api.post('/api/atencion/ordenes-derivacion', payloadOrden);
        const idOrdenCreada = resOrden.data.id_orden || resOrden.data.id;

        const randomNum = Math.floor(Math.random() * 1000);
        const fechaActualISO = new Date().toISOString();
        const codigoMuestra = `M-${fechaActualISO.slice(0, 10).replace(/-/g, '')}-${randomNum}`;

        const payloadMuestra = {
          orden_derivacion_id: idOrdenCreada,
          codigo: codigoMuestra,
          fecha_extraccion: fechaActualISO,
        };
        await api.post('/api/muestras/', payloadMuestra);
      }

      // 3. Marcar el turno original como 'atendido'
      await api.patch(`/api/clinica/turnos/${turnoId}/estado`, { estado: 'atendido' });

      // 4. ÉXITO
      setMostrarExito(true);
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          'Ocurrió un error al guardar la consulta. Verificá la conexión.'
      );
      setProcesando(false);
    }
  };

  const inputClass =
    'w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#129b9b]/50 mb-4 bg-gray-50 text-gray-800';

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6 relative">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/logologin.jpg')" }}
      />

      <div className="relative z-10 w-full max-w-2xl min-h-screen md:min-h-fit bg-[#129b9b] md:rounded-3xl shadow-2xl p-6 text-white">
        <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm font-semibold hover:underline bg-white/10 px-3 py-1 rounded-xl transition cursor-pointer"
          >
            ‹ Volver
          </button>
          <div className="text-center">
            <h2 className="font-bold text-xl">Atención Clínica</h2>
            {turnoInfo?.servicio && (
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-semibold">
                Servicio: {turnoInfo.servicio}
              </span>
            )}
          </div>
          <div className="w-16 text-center text-xs opacity-80">Turno #{turnoId}</div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-xl text-sm mb-4 font-semibold shadow-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-md text-gray-800">
            <h3 className="font-bold text-[#129b9b] border-b pb-2 mb-4 flex justify-between">
              <span>🩺 Diagnóstico de la Mascota</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                Mascota #{mascotaId}
              </span>
            </h3>

            <label className="block text-xs font-bold text-gray-600 mb-1">
              Motivo de la consulta
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Renguera pata trasera, decaimiento..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className={inputClass}
            />

            <label className="block text-xs font-bold text-gray-600 mb-1">
              Diagnóstico Preliminar
            </label>
            <textarea
              required
              rows="3"
              placeholder="Observaciones clínicas y posible diagnóstico..."
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              className={inputClass}
            />

            <label className="flex items-center gap-2 cursor-pointer bg-[#129b9b]/10 p-3 rounded-xl border border-[#129b9b]/20">
              <input
                type="checkbox"
                checked={vacunasAlDia}
                onChange={(e) => setVacunasAlDia(e.target.checked)}
                className="w-4 h-4 text-[#129b9b] rounded border-gray-300 focus:ring-[#129b9b]"
              />
              <span className="text-sm font-semibold text-gray-700">
                El paciente tiene el esquema de vacunas obligatorio al día.
              </span>
            </label>
          </div>

          {/* SECCIÓN DE VACUNACIÓN: Solo visible cuando el turno es de vacunación */}
          {esTurnoVacunacion && (
            <div className="bg-white p-5 rounded-2xl shadow-md text-gray-800 space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-[#129b9b]">💉 Registro de Vacunas Aplicadas</h3>
                <span className="text-[11px] bg-teal-50 text-[#0d7373] font-bold px-2.5 py-0.5 rounded-full border border-teal-200">
                  Turno de Vacunación
                </span>
              </div>

              <p className="text-xs text-gray-500">
                Seleccioná una o más vacunas del catálogo administradas durante esta atención:
              </p>

              {catalogoVacunas.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">
                  No hay vacunas cargadas en el catálogo.
                </p>
              ) : (
                <div className="space-y-3">
                  {catalogoVacunas.map((vac) => {
                    const estadoVac = vacunasSeleccionadas[vac.id_vacuna] || {
                      seleccionada: false,
                      fecha_aplicacion: fechaTurno,
                      lote: '',
                      proxima_dosis: '',
                    };

                    return (
                      <div
                        key={vac.id_vacuna}
                        className={`p-3.5 rounded-xl border transition ${
                          estadoVac.seleccionada
                            ? 'bg-teal-50/60 border-[#129b9b]'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <label className="flex items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={estadoVac.seleccionada}
                              onChange={() => toggleSeleccionVacuna(vac.id_vacuna)}
                              className="w-4 h-4 text-[#129b9b] rounded border-gray-300 focus:ring-[#129b9b]"
                            />
                            <div>
                              <span className="font-bold text-sm text-gray-800">
                                {vac.nombre}
                              </span>
                              {vac.descripcion && (
                                <p className="text-[11px] text-gray-500">{vac.descripcion}</p>
                              )}
                            </div>
                          </div>
                          {vac.precio != null && (
                            <span className="text-xs font-bold text-[#0d7373]">
                              ${Number(vac.precio).toLocaleString('es-AR')}
                            </span>
                          )}
                        </label>

                        {estadoVac.seleccionada && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-teal-200/60 text-xs">
                            <div>
                              <label className="block font-bold text-gray-600 mb-1">
                                Fecha de aplicación (Turno)
                              </label>
                              <input
                                type="date"
                                value={fechaTurno}
                                readOnly
                                disabled
                                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-100 text-gray-600 font-semibold cursor-not-allowed"
                                title="La fecha de aplicación corresponde al día del turno"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-gray-600 mb-1">
                                Lote (opcional)
                              </label>
                              <input
                                type="text"
                                placeholder="Ej: LOT-2026-A"
                                value={estadoVac.lote}
                                onChange={(e) =>
                                  actualizarCampoVacuna(vac.id_vacuna, 'lote', e.target.value)
                                }
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#129b9b]/50"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-gray-600 mb-1">
                                Próxima dosis (opcional)
                              </label>
                              <input
                                type="date"
                                min={minProximaDosis}
                                value={estadoVac.proxima_dosis}
                                onChange={(e) =>
                                  actualizarCampoVacuna(
                                    vac.id_vacuna,
                                    'proxima_dosis',
                                    e.target.value
                                  )
                                }
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#129b9b]/50"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="bg-white p-5 rounded-2xl shadow-md text-gray-800">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="font-bold text-[#129b9b]">🔬 Laboratorio y Muestras</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-bold text-gray-500">Solicitar Análisis</span>
                <input
                  type="checkbox"
                  checked={derivarLab}
                  onChange={(e) => setDerivarLab(e.target.checked)}
                  className="w-4 h-4 text-[#129b9b] rounded border-gray-300 focus:ring-[#129b9b]"
                />
              </label>
            </div>

            {derivarLab ? (
              <div className="animate-fade-in space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      Estudio Requerido
                    </label>
                    <select
                      value={tipoAnalisis}
                      onChange={(e) => setTipoAnalisis(e.target.value)}
                      className={inputClass}
                    >
                      {opcionesAnalisis.length === 0 ? (
                        <option value="">Cargando...</option>
                      ) : (
                        opcionesAnalisis.map((op) => (
                          <option key={op.id_tipo_analisis} value={op.nombre}>
                            {op.nombre}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      Prioridad Clínica
                    </label>
                    <select
                      value={prioridad}
                      onChange={(e) => setPrioridad(e.target.value)}
                      className={inputClass}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Urgente">Urgente</option>
                    </select>
                  </div>
                </div>

                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Indicaciones al Laboratorio Central
                </label>
                <textarea
                  rows="2"
                  placeholder="Ej: Extraer en tubo con EDTA, mantener refrigerado..."
                  value={obsLab}
                  onChange={(e) => setObsLab(e.target.value)}
                  className={inputClass}
                />

                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 text-xs text-amber-800 rounded-r-xl">
                  <strong>Aviso:</strong> Al confirmar esta consulta, el sistema registrará
                  automáticamente la extracción de la muestra (Trazabilidad inicial) vinculada a
                  esta orden.
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic text-center py-4">
                No se derivarán muestras biológicas en esta consulta.
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={procesando || mostrarExito}
              className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={procesando || mostrarExito}
              className="px-6 py-2.5 bg-white text-[#0d7373] hover:bg-gray-100 rounded-xl text-sm font-extrabold transition shadow-lg disabled:opacity-60 cursor-pointer"
            >
              {procesando ? 'Guardando Atención...' : 'Finalizar Consulta ✓'}
            </button>
          </div>
        </form>
      </div>

      {/* MODAL DE ÉXITO */}
      {mostrarExito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-sm">
              ✓
            </div>
            <h2 className="text-xl font-extrabold text-gray-800 mb-2">¡Consulta Finalizada!</h2>
            <p className="text-sm text-gray-500 mb-6">
              Los datos médicos, vacunas y derivaciones se guardaron correctamente.
            </p>
            <div className="flex justify-center items-center gap-2 text-[#129b9b] font-semibold text-sm">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Volviendo al inicio...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroConsultaPage;