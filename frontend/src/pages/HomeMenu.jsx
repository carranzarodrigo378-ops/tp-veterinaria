import { useNavigate } from 'react-router-dom';

const HomeMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6">
      <div className="w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl flex flex-col justify-between p-6 text-white relative">
        
        {/* Header */}
        <div className="w-full flex justify-between items-center mt-2 px-2">
          <div className="w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center bg-white/10 cursor-pointer">
            👤
          </div>
          <h1 className="text-3xl font-extrabold tracking-wide">
            Vet<span className="text-[#e8a2a7]">2</span>Gö🐾
          </h1>
          <div className="w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center bg-white/10 cursor-pointer">
            🔗
          </div>
        </div>

        {/* Menú circular */}
        <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-full border-2 border-cyan-200/40 flex items-center justify-center my-auto mx-auto">
          <button 
            onClick={() => navigate('/turnos')}
            className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-white text-[#129b9b] shadow-2xl flex flex-col items-center justify-center border-4 border-cyan-100 z-10 active:scale-95 transition-transform"
          >
            <span className="text-3xl">🩺</span>
            <span className="font-bold text-base md:text-lg leading-tight mt-1">Pedir Cita</span>
          </button>

          <button 
            onClick={() => navigate('/mascotas')}
            className="absolute -top-3 w-16 h-16 rounded-full bg-white text-[#129b9b] shadow-md flex flex-col items-center justify-center text-xs font-bold border-2 border-cyan-100 hover:scale-105 transition-transform"
          >
            <span>🐶</span>
            <span>Pets</span>
          </button>

          <button 
            onClick={() => navigate('/turnos')}
            className="absolute top-10 -right-3 w-16 h-16 rounded-full bg-white text-[#129b9b] shadow-md flex flex-col items-center justify-center text-xs font-bold border-2 border-cyan-100 hover:scale-105 transition-transform"
          >
            <span>📅</span>
            <span>Citas</span>
          </button>

          <button 
            className="absolute bottom-10 -right-3 w-16 h-16 rounded-full bg-white text-[#129b9b] shadow-md flex flex-col items-center justify-center text-xs font-bold border-2 border-cyan-100 hover:scale-105 transition-transform"
          >
            <span>📦</span>
            <span>Tienda</span>
          </button>

          <button 
            className="absolute top-10 -left-3 w-16 h-16 rounded-full bg-white text-[#129b9b] shadow-md flex flex-col items-center justify-center text-xs font-bold border-2 border-cyan-100 hover:scale-105 transition-transform"
          >
            <span>🛒</span>
            <span>Cesta</span>
          </button>
        </div>

        {/* Botón inferior rosado */}
        <div className="w-full bg-white rounded-t-3xl p-3 flex justify-center -mb-6">
          <button className="w-12 h-12 bg-[#f1adb6] rounded-full flex items-center justify-center shadow-lg text-xl">
            🐾
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeMenu;