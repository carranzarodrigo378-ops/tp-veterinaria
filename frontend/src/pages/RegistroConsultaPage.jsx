import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';

const RegistroConsultaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const turnoId = searchParams.get('turno');
  const mascotaId = searchParams.get('mascota');

  // Estados del formulario clínico
  const [motivo, setMotivo] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [vacunasAlDia, setVacunasAlDia] = useState(true);

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

  // Validación de URL y Carga inicial de Tipos de Análisis
  useEffect(() => {
    if (!turnoId || !mascotaId) {
      navigate('/agenda');
      return;
    }

    const fetchTiposAnalisis = async () => {
      try {
        const res = await api.get('/api/atencion/tipos-analisis');
        setOpcionesAnalisis(res.data);
        if (res.data && res.data.length > 0) {
          setTipoAnalisis(res.data[0].nombre);
        }
      } catch (err) {
        console.error("Error al cargar tipos de análisis:", err);
      }
    };

    fetchTiposAnalisis();
  }, [turnoId, mascotaId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setProcesando(true);

    try {
      // 1. Registrar la Consulta Médica
      const payloadConsulta = {
        id_mascota: parseInt(mascotaId, 10),
        motivo: motivo,
        diagnostico_preliminar: diagnostico,
        esquema_vacunas_al_dia: vacunasAlDia,
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
        const codigoMuestra = `M-${fechaActualISO.slice(0,10).replace(/-/g, '')}-${randomNum}`;

        const payloadMuestra = {
          orden_derivacion_id: idOrdenCreada,
          codigo: codigoMuestra,
          fecha_extraccion: fechaActualISO,
        };
        await api.post('/api/muestras/', payloadMuestra);
      }

      // 3. Marcar el turno original como 'atendido' (con PATCH como corregimos antes)
      await api.patch(`/api/clinica/turnos/${turnoId}/estado`, { estado: 'atendido' });

      // 4. ÉXITO: Mostramos el modal lindo y redirigimos a /home a los 2 segundos
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

  const inputClass = "w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#129b9b]/50 mb-4 bg-gray-50 text-gray-800";

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
          <h2 className="font-bold text-xl text-center">Atención Clínica</h2>
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
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">Mascota #{mascotaId}</span>
            </h3>

            <label className="block text-xs font-bold text-gray-600 mb-1">Motivo de la consulta</label>
            <input
              type="text"
              required
              placeholder="Ej: Renguera pata trasera, decaimiento..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className={inputClass}
            />

            <label className="block text-xs font-bold text-gray-600 mb-1">Diagnóstico Preliminar</label>
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
              <span className="text-sm font-semibold text-gray-700">El paciente tiene el esquema de vacunas obligatorio al día.</span>
            </label>
          </div>

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
                    <label className="block text-xs font-bold text-gray-600 mb-1">Estudio Requerido</label>
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
                    <label className="block text-xs font-bold text-gray-600 mb-1">Prioridad Clínica</label>
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

                <label className="block text-xs font-bold text-gray-600 mb-1">Indicaciones al Laboratorio Central</label>
                <textarea
                  rows="2"
                  placeholder="Ej: Extraer en tubo con EDTA, mantener refrigerado..."
                  value={obsLab}
                  onChange={(e) => setObsLab(e.target.value)}
                  className={inputClass}
                />
                
                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 text-xs text-amber-800 rounded-r-xl">
                  <strong>Aviso:</strong> Al confirmar esta consulta, el sistema registrará automáticamente la extracción de la muestra (Trazabilidad inicial) vinculada a esta orden.
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

      {/* MODAL DE ÉXITO LINDÍSIMO */}
      {mostrarExito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-sm">
              ✓
            </div>
            <h2 className="text-xl font-extrabold text-gray-800 mb-2">¡Consulta Finalizada!</h2>
            <p className="text-sm text-gray-500 mb-6">Los datos médicos y las derivaciones se guardaron correctamente.</p>
            <div className="flex justify-center items-center gap-2 text-[#129b9b] font-semibold text-sm">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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