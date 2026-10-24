import { useNavigate } from 'react-router-dom';

const HomeMenu = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'cliente';
  const clientName = localStorage.getItem('clientName') || 'Usuario';
  const clientId = localStorage.getItem('clientId');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('clientName');
    localStorage.removeItem('clientId');
    navigate('/login');
  };

  const handleAccessProtected = (path) => {
    if (role === 'cliente') {
      alert('Sección reservada exclusivamente para el Personal Veterinario y de Laboratorio.');
      return;
    }
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6">
      <div className="w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl flex flex-col justify-between p-6 text-white relative">
        
        {/* Header */}
        <div className="w-full flex justify-between items-center mt-2 px-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center bg-white/10 font-bold">
              👤
            </div>
            <div className="text-left">
              <p className="text-xs font-bold leading-tight">{clientName}</p>
              {clientId && <p className="text-[10px] font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded text-cyan-100 inline-block mt-0.5">{clientId}</p>}
              {role === 'veterinario' && <p className="text-[10px] uppercase font-bold text-yellow-300">Clínica Médica</p>}
              {role === 'laboratorio' && <p className="text-[10px] uppercase font-bold text-pink-300">Laboratorio Central</p>}
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-wide">
            Vet<span className="text-[#e8a2a7]">2</span>Gö🐾
          </h1>
        </div>

        {/* Menú circular dinámico */}
        <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-full border-2 border-cyan-200/40 flex items-center justify-center my-auto mx-auto">
          
          {/* Botón Central */}
          <button 
            onClick={() => navigate(role === 'laboratorio' ? '/laboratorio' : '/turnos')}
            className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-white text-[#129b9b] shadow-2xl flex flex-col items-center justify-center border-4 border-cyan-100 z-10 active:scale-95 transition-transform"
          >
            <span className="text-3xl">{role === 'laboratorio' ? '🧪' : '🩺'}</span>
            <span className="font-bold text-sm md:text-base leading-tight mt-1 text-center">
              {role === 'laboratorio' ? 'Recepcionar\nMuestras' : 'Pedir Cita'}
            </span>
          </button>

          {/* Pets (Visible para todos) */}
          <button 
            onClick={() => navigate('/mascotas')}
            className="absolute -top-3 w-16 h-16 rounded-full bg-white text-[#129b9b] shadow-md flex flex-col items-center justify-center text-xs font-bold border-2 border-cyan-100 hover:scale-105 transition-transform"
          >
            <span>🐶</span>
            <span>Pets</span>
          </button>

          {/* Citas (Visible para todos) */}
          <button 
            onClick={() => navigate('/turnos')}
            className="absolute top-10 -right-3 w-16 h-16 rounded-full bg-white text-[#129b9b] shadow-md flex flex-col items-center justify-center text-xs font-bold border-2 border-cyan-100 hover:scale-105 transition-transform"
          >
            <span>📅</span>
            <span>Citas</span>
          </button>

          {/* Muestras (Protegido para Staff/Vet) */}
          <button 
            onClick={() => handleAccessProtected('/laboratorio')}
            className={`absolute bottom-10 -right-3 w-16 h-16 rounded-full bg-white text-[#129b9b] shadow-md flex flex-col items-center justify-center text-xs font-bold border-2 border-cyan-100 hover:scale-105 transition-transform ${role === 'cliente' ? 'opacity-40' : ''}`}
          >
            <span>🧪</span>
            <span>Muestras</span>
          </button>

          {/* Reportes (Protegido para Staff/Vet) */}
          <button 
            onClick={() => handleAccessProtected('/reportes')}
            className={`absolute top-10 -left-3 w-16 h-16 rounded-full bg-white text-[#129b9b] shadow-md flex flex-col items-center justify-center text-xs font-bold border-2 border-cyan-100 hover:scale-105 transition-transform ${role === 'cliente' ? 'opacity-40' : ''}`}
          >
            <span>📊</span>
            <span>Reportes</span>
          </button>
        </div>

        {/* Botón inferior rosado con la PATITA 🐾 para CERRAR SESIÓN */}
        <div className="w-full bg-white rounded-t-3xl p-3 flex justify-center -mb-6 shadow-lg">
          <button 
            onClick={handleLogout}
            title="Cerrar sesión"
            className="w-14 h-14 bg-[#f1adb6] hover:bg-[#e89ca6] rounded-full flex items-center justify-center shadow-lg text-2xl transition-transform active:scale-90"
          >
            🐾
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeMenu;