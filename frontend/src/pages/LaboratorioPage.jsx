import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LaboratorioPage = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'cliente';

  const [muestras, setMuestras] = useState([]);
  const [searchMode, setSearchMode] = useState('listado');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Expiración token 10 min
    const expiration = localStorage.getItem('token_expiration');
    if (!expiration || Date.now() > parseInt(expiration, 10) || role !== 'veterinario') {
      navigate('/login');
      return;
    }

    const iniciales = [
      { remito: 'REM-8492', precinto: 'PRC-102938', ownerId: 'VET-1001', mascota: 'Nefer', analisis: 'Hemograma Completo', estado: 'En Tránsito', estadoPrecinto: 'Intacto', clinicaOrigen: 'Clínica Norte', fecha: '24/10/2026', resultado: 'Valores globulares dentro de rangos normales.' },
      { remito: 'REM-3310', precinto: 'PRC-992812', ownerId: 'VET-1001', mascota: 'Currito', analisis: 'Perfil Renal', estado: 'Empaquetada', estadoPrecinto: 'Intacto', clinicaOrigen: 'Clínica Centro', fecha: '24/10/2026', resultado: 'Pendiente' },
      { remito: 'REM-5521', precinto: 'PRC-441029', ownerId: 'VET-2002', mascota: 'Firulais', analisis: 'Urocultivo', estado: 'Analizada', estadoPrecinto: 'Intacto', clinicaOrigen: 'Clínica Norte', fecha: '23/10/2026', resultado: 'Negativo para bacterias.' },
    ];
    
    const guardadas = JSON.parse(localStorage.getItem('muestras_db') || '[]');
    if (guardadas.length === 0) {
      localStorage.setItem('muestras_db', JSON.stringify(iniciales));
      setMuestras(iniciales);
    } else {
      setMuestras(guardadas);
    }
  }, [role, navigate]);

  const muestrasFiltradas = muestras.filter(m => {
    if (searchMode === 'codigo') {
      if (!searchTerm.trim()) return false;
      const term = searchTerm.toLowerCase().trim();
      return (
        m.ownerId?.toLowerCase().includes(term) ||
        m.remito?.toLowerCase().includes(term) ||
        m.mascota?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const actualizarEstadoMuestra = (remitoTarget, nuevoEstado, nuevoEstadoPrecinto = null) => {
    const actualizadas = muestras.map(m => {
      if (m.remito === remitoTarget) {
        let estadoFinal = nuevoEstado;
        let precintoFinal = nuevoEstadoPrecinto || m.estadoPrecinto;

        if (precintoFinal === 'Roto / Violado') {
          estadoFinal = 'Muestra Rechazada';
        }

        return { ...m, estado: estadoFinal, estadoPrecinto: precintoFinal };
      }
      return m;
    });

    setMuestras(actualizadas);
    localStorage.setItem('muestras_db', JSON.stringify(actualizadas));
  };

  const handleDescargarPDF = (muestra) => {
    const ventanaImpresion = window.open('', '_blank');
    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>Informe de Laboratorio - ${muestra.remito}</title>
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
            <p><strong>Nº Remito Biológico:</strong> ${muestra.remito}</p>
            <p><strong>Código de Precinto:</strong> ${muestra.precinto} (${muestra.estadoPrecinto})</p>
            <p><strong>Código Dueño:</strong> ${muestra.ownerId}</p>
            <p><strong>Paciente:</strong> ${muestra.mascota}</p>
            <p><strong>Clínica Origen:</strong> ${muestra.clinicaOrigen}</p>
            <p><strong>Fecha:</strong> ${muestra.fecha}</p>
          </div>
          <div class="box">
            <h3>Resultado del Análisis (${muestra.analisis}):</h3>
            <p><strong>Estado:</strong> ${muestra.estado}</p>
            <p><strong>Informe Diagnóstico:</strong> ${muestra.resultado || 'Muestra procesada correctamente.'}</p>
          </div>
          <div class="footer">
            <p>Documento oficial emitido con cadena de custodia inmutable.</p>
          </div>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
    ventanaImpresion.print();
  };

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6">
      <div className="w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl p-5 text-white flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => navigate('/laboratorio-hub')} className="text-sm font-semibold hover:underline">‹ Volver</button>
            <h2 className="font-bold text-lg">Muestras Biológicas</h2>
            <div className="w-6"></div>
          </div>

          <div className="bg-white/10 p-1 rounded-2xl flex mb-4 text-xs font-bold">
            <button 
              onClick={() => setSearchMode('listado')}
              className={`flex-1 py-2 rounded-xl transition-all ${searchMode === 'listado' ? 'bg-white text-[#129b9b] shadow' : 'text-white'}`}
            >
              📋 Ver Lista
            </button>
            <button 
              onClick={() => setSearchMode('codigo')}
              className={`flex-1 py-2 rounded-xl transition-all ${searchMode === 'codigo' ? 'bg-white text-[#129b9b] shadow' : 'text-white'}`}
            >
              🔍 Buscar por Código
            </button>
          </div>

          {searchMode === 'codigo' && (
            <div className="mb-4">
              <input 
                type="text"
                placeholder="Ingresá Código (ej: VET-1001, REM-8492)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white text-gray-800 p-3 rounded-2xl text-xs font-medium focus:outline-none shadow"
              />
            </div>
          )}

          <div className="space-y-3">
            {muestrasFiltradas.length > 0 ? (
              muestrasFiltradas.map((m) => (
                <div key={m.remito} className="bg-white text-gray-800 p-4 rounded-2xl shadow-lg text-xs space-y-2">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <span className="font-bold text-[#129b9b]">{m.remito}</span>
                      <span className="text-[10px] text-gray-400 block font-mono">Dueño: {m.ownerId}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      m.estado === 'Muestra Rechazada' ? 'bg-red-100 text-red-700' :
                      m.estado === 'Analizada' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {m.estado}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <p><strong>Paciente:</strong> {m.mascota}</p>
                    <p><strong>Origen:</strong> {m.clinicaOrigen}</p>
                    <p className="col-span-2"><strong>Análisis:</strong> {m.analisis}</p>
                    <p className="col-span-2 font-mono text-gray-500"><strong>Precinto:</strong> {m.precinto}</p>
                  </div>

                  {m.estado !== 'Muestra Rechazada' && m.estado !== 'Analizada' && (
                    <div className="bg-cyan-50 p-2.5 rounded-xl border border-cyan-100 space-y-2 pt-2">
                      <p className="font-bold text-[#129b9b] text-[10px] uppercase">Control Sanitario:</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => actualizarEstadoMuestra(m.remito, 'Recibida', 'Intacto')}
                          className="flex-1 bg-green-600 text-white py-1.5 rounded-lg font-bold text-[10px] hover:bg-green-700"
                        >
                          ✓ Precinto Intacto
                        </button>
                        <button 
                          onClick={() => actualizarEstadoMuestra(m.remito, 'Muestra Rechazada', 'Roto / Violado')}
                          className="flex-1 bg-red-600 text-white py-1.5 rounded-lg font-bold text-[10px] hover:bg-red-700"
                        >
                          ✕ Precinto Roto
                        </button>
                      </div>

                      {m.estado === 'Recibida' && (
                        <button 
                          onClick={() => actualizarEstadoMuestra(m.remito, 'Analizada')}
                          className="w-full bg-[#129b9b] text-white py-1.5 rounded-lg font-bold text-[10px] mt-1"
                        >
                          🧪 Cargar Resultados & Finalizar
                        </button>
                      )}
                    </div>
                  )}

                  <button 
                    onClick={() => handleDescargarPDF(m)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-[#129b9b] font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-gray-200 transition-colors mt-2"
                  >
                    <span>📥</span> Descargar Informe PDF
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-white/10 p-6 rounded-2xl text-center text-xs">
                {searchMode === 'codigo' && !searchTerm 
                  ? 'Ingresá un código para buscar una muestra.' 
                  : 'No se encontraron muestras registradas.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaboratorioPage;