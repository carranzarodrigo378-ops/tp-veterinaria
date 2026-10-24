import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ReportesPage = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'cliente';

  useEffect(() => {
    if (role === 'cliente') {
      navigate('/home');
    }
  }, [role, navigate]);

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6">
      <div className="w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl p-5 text-white flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => navigate('/home')} className="text-sm font-semibold hover:underline">‹ Back</button>
            <h2 className="font-bold text-lg">Reportes del Sistema</h2>
            <div className="w-6"></div>
          </div>

          <div className="space-y-3 text-gray-800">
            <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-1">
              <h3 className="font-bold text-[#129b9b] text-sm flex justify-between">
                <span>1. Derivaciones por Clínica</span>
                <span>📊</span>
              </h3>
              <p className="text-gray-500">Clínica Norte: <strong>28 atenciones (12 derivaciones)</strong></p>
              <p className="text-gray-500">Clínica Centro: <strong>19 atenciones (7 derivaciones)</strong></p>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-1">
              <h3 className="font-bold text-red-600 text-sm flex justify-between">
                <span>2. Muestras Rechazadas</span>
                <span>🚨</span>
              </h3>
              <p className="text-gray-600">Muestras con Precinto Roto: <strong>1 (4.1%)</strong></p>
              <p className="text-gray-400 italic">Causa principal: Falla en transporte térmico.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-1">
              <h3 className="font-bold text-[#129b9b] text-sm flex justify-between">
                <span>3. Vacunas Pendientes</span>
                <span>💉</span>
              </h3>
              <p className="text-gray-600">Pacientes con esquema incompleto: <strong>12%</strong></p>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-md text-xs space-y-1">
              <h3 className="font-bold text-[#129b9b] text-sm flex justify-between">
                <span>4. Tiempo Promedio de Tránsito</span>
                <span>⏱️</span>
              </h3>
              <p className="text-gray-600">Extracción a Recepción: <strong>1 h 45 min</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesPage;