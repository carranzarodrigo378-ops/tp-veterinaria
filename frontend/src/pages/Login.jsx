import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const handleStart = (role) => {
    localStorage.setItem('token', 'demo_token');
    localStorage.setItem('role', role);
    navigate('/home');
  };

  return (
    /* Contenedor exterior para centrar en pantallas grandes */
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6">
      {/* Marco mobile que se adapta en PC */}
      <div className="w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl flex flex-col justify-between p-6 text-white relative overflow-hidden">
        
        {/* Logo */}
        <div className="mt-4 md:mt-2 text-center">
          <h1 className="text-4xl font-extrabold tracking-wide flex items-center justify-center gap-1">
            Vet<span className="text-[#e8a2a7] text-3xl">2</span>Gö<span className="text-pink-300">🐾</span>
          </h1>
        </div>

        {/* Imagen central */}
        <div className="my-auto w-full flex flex-col items-center">
          <div className="w-56 h-56 md:w-60 md:h-60 rounded-full overflow-hidden border-4 border-white/20 shadow-xl mb-6">
            <img 
              src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=600" 
              alt="Veterinaria" 
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-center text-sm px-6 text-cyan-50 font-medium">
            Cuenta con un profesional veterinario cuándo y dónde quieras
          </p>
        </div>

        {/* Botones */}
        <div className="w-full space-y-3 mb-4">
          <button 
            onClick={() => handleStart('cliente')} 
            className="w-full bg-[#f1adb6] hover:bg-[#e89ca6] text-white font-bold py-3.5 rounded-full shadow-lg tracking-wider text-xs md:text-sm transition-transform active:scale-95"
          >
            INGRESAR COMO CLIENTE
          </button>
          <button 
            onClick={() => handleStart('veterinario')} 
            className="w-full bg-white hover:bg-gray-50 text-[#129b9b] font-bold py-3.5 rounded-full shadow-lg tracking-wider text-xs md:text-sm transition-transform active:scale-95"
          >
            INGRESAR COMO VETERINARIO
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;