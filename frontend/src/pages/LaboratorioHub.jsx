import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LaboratorioHub = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'cliente';

  useEffect(() => {
    // Control de expiración de token de 10 min
    const expiration = localStorage.getItem('token_expiration');
    if (!expiration || Date.now() > parseInt(expiration, 10) || role !== 'veterinario') {
      navigate('/login');
    }
  }, [role, navigate]);

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6">
      <div className="w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl p-6 text-white flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => navigate('/home')} className="text-sm font-semibold hover:underline">‹ Volver al Menú</button>
            <h2 className="font-bold text-lg">Módulo Laboratorio</h2>
            <div className="w-6"></div>
          </div>

          <p className="text-xs text-cyan-100 text-center mb-8">
            Gestión de muestras biológicas derivables y analítica del sistema.
          </p>

          {/* Accesos Principales */}
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/muestras')}
              className="w-full bg-white text-gray-800 p-5 rounded-2xl shadow-xl flex items-center justify-between hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-center gap-4 text-left">
                <span className="text-3xl bg-cyan-100 p-2.5 rounded-xl">🧪</span>
                <div>
                  <h3 className="font-bold text-[#129b9b] text-sm">Muestras Biológicas</h3>
                  <p className="text-[11px] text-gray-500">Trazabilidad, precintos sanitarios y descargas en PDF.</p>
                </div>
              </div>
              <span className="text-gray-400 font-bold group-hover:translate-x-1 transition-transform">›</span>
            </button>

            <button 
              onClick={() => navigate('/reportes')}
              className="w-full bg-white text-gray-800 p-5 rounded-2xl shadow-xl flex items-center justify-between hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-center gap-4 text-left">
                <span className="text-3xl bg-yellow-100 p-2.5 rounded-xl">📊</span>
                <div>
                  <h3 className="font-bold text-[#129b9b] text-sm">Reportes de Negocio</h3>
                  <p className="text-[11px] text-gray-500">Muestras rechazadas, tiempos de tránsito y vacunas.</p>
                </div>
              </div>
              <span className="text-gray-400 font-bold group-hover:translate-x-1 transition-transform">›</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaboratorioHub;