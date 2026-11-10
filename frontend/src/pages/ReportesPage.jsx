import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ⚠️ Ajustá estos valores a los que acepte tu backend
const FORMATO_PDF = 'pdf';
const FORMATO_EXCEL = 'xlsx';

const TIPOS_REPORTE = {
  derivaciones: 'derivaciones',
  rechazadas: 'muestras-rechazadas',
  vacunas: 'vacunas-pendientes',
  transito: 'tiempo-transito'
};

const descargarArchivoReporte = async (formato, tipoReporte, filtros = {}) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();

  if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
  if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
  if (filtros.clinica_id) params.append('clinica_id', filtros.clinica_id);
  if (filtros.especie) params.append('especie', filtros.especie);
  if (Array.isArray(filtros.veterinarios_ids)) {
    filtros.veterinarios_ids.forEach((id) =>
      params.append('veterinarios_ids', id)
    );
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const url = `http://127.0.0.1:8000/api/reportes/exportar/${formato}/${tipoReporte}${queryString}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      alert('No se pudo generar el reporte.');
      return;
    }

    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `reporte_${tipoReporte}.${formato}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error('Error al descargar el reporte:', err);
    alert('No se pudo conectar con el servidor.');
  }
};

// Botones de descarga reutilizables
const BotonesDescarga = ({ tipoReporte }) => (
  <div className="flex gap-2 pt-2">
    <button
      onClick={() => descargarArchivoReporte(FORMATO_PDF, tipoReporte)}
      className="w-1/2 bg-[#129b9b] text-white py-1.5 rounded-xl font-bold text-xs hover:bg-[#0d7373]"
    >
      PDF
    </button>

    <button
      onClick={() => descargarArchivoReporte(FORMATO_EXCEL, tipoReporte)}
      className="w-1/2 bg-[#62c4c4] text-white py-1.5 rounded-xl font-bold text-xs hover:bg-[#5bb8b8]"
    >
      Excel
    </button>
  </div>
);

const ReportesPage = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'cliente';

  useEffect(() => {
    const expiration = localStorage.getItem('token_expiration');

    if (
      !expiration ||
      Date.now() > parseInt(expiration, 10) ||
      role !== 'veterinario'
    ) {
      navigate('/login');
    }
  }, [role, navigate]);

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6">
      <div className="w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl p-5 text-white flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => navigate('/laboratorio-hub')}
              className="text-sm font-semibold hover:underline"
            >
              ‹ Volver
            </button>
            <h2 className="font-bold text-lg">Reportes del Sistema</h2>
            <div className="w-6"></div>
          </div>

          <div className="space-y-3 text-gray-800">

            {/* 1. Derivaciones por clínica */}
            <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-1">
              <h3 className="font-bold text-[#129b9b] text-sm flex justify-between border-b pb-1">
                <span>1. Derivaciones por Clínica</span>
                <span>📊</span>
              </h3>
              <p className="text-gray-600 pt-1">
                Clínica Norte: <strong>28 atenciones (12 derivaciones)</strong>
              </p>
              <p className="text-gray-600">
                Clínica Centro: <strong>19 atenciones (7 derivaciones)</strong>
              </p>
              <BotonesDescarga tipoReporte={TIPOS_REPORTE.derivaciones} />
            </div>

            {/* 2. Muestras rechazadas */}
            <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-1">
              <h3 className="font-bold text-red-600 text-sm flex justify-between border-b pb-1">
                <span>2. Muestras Rechazadas</span>
                <span>🚨</span>
              </h3>
              <p className="text-gray-600 pt-1">
                Muestras con Precinto Roto: <strong>1 (4.1%)</strong>
              </p>
              <p className="text-gray-400 italic">
                Causa principal: Falla de aislamiento térmico.
              </p>
              <BotonesDescarga tipoReporte={TIPOS_REPORTE.rechazadas} />
            </div>

            {/* 3. Vacunas pendientes */}
            <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-1">
              <h3 className="font-bold text-[#129b9b] text-sm flex justify-between border-b pb-1">
                <span>3. Vacunas Pendientes</span>
                <span>💉</span>
              </h3>
              <p className="text-gray-600 pt-1">
                Pacientes con esquema incompleto: <strong>12%</strong>
              </p>
              <p className="text-gray-500">
                Vacuna más requerida:{' '}
                <strong>Antirrábica / Triple Felina</strong>
              </p>
              <BotonesDescarga tipoReporte={TIPOS_REPORTE.vacunas} />
            </div>

            {/* 4. Tiempo promedio de tránsito */}
            <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-1">
              <h3 className="font-bold text-[#129b9b] text-sm flex justify-between border-b pb-1">
                <span>4. Tiempo Promedio de Tránsito</span>
                <span>⏱️</span>
              </h3>
              <p className="text-gray-600 pt-1">
                Extracción a Recepción: <strong>1 h 45 min</strong>
              </p>
              <p className="text-gray-600">
                Recepción a Diagnóstico Final: <strong>3 hs 20 min</strong>
              </p>
              <BotonesDescarga tipoReporte={TIPOS_REPORTE.transito} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesPage;
