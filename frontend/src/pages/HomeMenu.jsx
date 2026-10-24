import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HomeMenu = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'cliente';
  const clientName = localStorage.getItem('clientName') || 'Usuario';
  const clientId = localStorage.getItem('clientId');

  // Control de token expirado en 10 minutos
  useEffect(() => {
    const expiration = localStorage.getItem('token_expiration');
    const ahora = Date.now();

    if (!expiration || ahora > parseInt(expiration, 10)) {
      alert('Tu sesión ha expirado (límite de 10 minutos). Por favor ingresá nuevamente.');
      handleLogout();
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6">
      <div className="w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl flex flex-col justify-between p-6 text-white relative">
        
        {/* Header */}
        <div className="w-full flex justify-between items-center mt-2 px-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center bg-white/10 font-bold shadow-inner">
              👤
            </div>
            <div className="text-left">
              <p className="text-xs font-bold leading-tight">{clientName}</p>
              {clientId && <p className="text-[10px] font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded text-cyan-100 inline-block mt-0.5">{clientId}</p>}
              {role === 'veterinario' && <p className="text-[10px] uppercase font-bold text-yellow-300">Staff Veterinario</p>}
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-wide drop-shadow">
            Vet<span className="text-[#e8a2a7]">2</span>Gö🐾
          </h1>
        </div>

        {/* Menú Circular Interactivo */}
        <div className="relative w-72 h-72 rounded-full border-2 border-cyan-200/30 flex items-center justify-center my-auto mx-auto shadow-inner">
          
          {/* Botón Central Principal */}
          <button 
            onClick={() => navigate('/turnos')}
            className="w-36 h-36 rounded-full bg-white text-[#129b9b] shadow-2xl flex flex-col items-center justify-center border-4 border-cyan-100 z-10 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group"
          >
            <span className="text-3xl transition-transform duration-200 group-hover:scale-110">🩺</span>
            <span className="font-bold text-sm md:text-base leading-tight mt-1 text-center group-hover:text-[#0e7878]">
              {role === 'cliente' ? 'Pedir Cita' : 'Atención\nClínica'}
            </span>
          </button>

          {/* Botón Pets (Arriba) */}
          <button 
            onClick={() => navigate('/mascotas')}
            className="absolute -top-3 w-16 h-16 rounded-full bg-white text-[#129b9b] shadow-lg flex flex-col items-center justify-center text-xs font-bold border-2 border-cyan-100 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer hover:shadow-cyan-200/50"
          >
            <span className="text-base">🐶</span>
            <span>Pets</span>
          </button>

          {/* Botón Citas (Derecha Superior) */}
          <button 
            onClick={() => navigate('/turnos')}
            className="absolute top-12 -right-2 w-16 h-16 rounded-full bg-white text-[#129b9b] shadow-lg flex flex-col items-center justify-center text-xs font-bold border-2 border-cyan-100 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <span className="text-base">📅</span>
            <span>Citas</span>
          </button>

          {/* Botón Tienda (Izquierda Superior) */}
          <button 
            className="absolute top-12 -left-2 w-16 h-16 rounded-full bg-white text-[#129b9b] shadow-lg flex flex-col items-center justify-center text-xs font-bold border-2 border-cyan-100 opacity-80 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <span className="text-base">🛒</span>
            <span>Tienda</span>
          </button>

          {/* Botón Cesta (Izquierda Inferior) */}
          <button 
            className="absolute bottom-12 -left-2 w-16 h-16 rounded-full bg-white text-[#129b9b] shadow-lg flex flex-col items-center justify-center text-xs font-bold border-2 border-cyan-100 opacity-80 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <span className="text-base">📦</span>
            <span>Cesta</span>
          </button>

          {/* BOTÓN DE LABORATORIO (Alineado Simétricamente Abajo - Exclusivo Veterinario) */}
          {role === 'veterinario' && (
            <button 
              onClick={() => navigate('/laboratorio-hub')}
              className="absolute -bottom-3 w-20 h-20 rounded-full bg-yellow-300 text-[#129b9b] shadow-2xl flex flex-col items-center justify-center text-[11px] font-extrabold border-4 border-white transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer z-20"
            >
              <span className="text-xl">🧪</span>
              <span>Laboratorio</span>
            </button>
          )}
        </div>

        {/* Botón inferior rosado con la Patita 🐾 para Logout */}
        <div className="w-full bg-white rounded-t-3xl p-3 flex justify-center -mb-6 shadow-lg">
          <button 
            onClick={handleLogout}
            title="Cerrar sesión"
            className="w-14 h-14 bg-[#f1adb6] hover:bg-[#e89ca6] rounded-full flex items-center justify-center shadow-lg text-2xl transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer"
          >
            🐾
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeMenu;