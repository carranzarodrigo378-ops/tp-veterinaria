import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SesionExpiradaModal = () => {
  const [abierto, setAbierto] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Si estamos en la pantalla de login, apagamos el vigilante
    if (location.pathname === '/login') return;

    // 1. Escuchar si Axios avisa que el backend rechazó el token
    const handleExpirada = () => setAbierto(true);
    window.addEventListener('sesion-expirada', handleExpirada);

    // 2. El Vigilante Automático: revisa el tiempo cada 5 segundos
    const intervalo = setInterval(() => {
      const expiracion = localStorage.getItem('token_expiration');
      
      if (expiracion && Date.now() > Number(expiracion)) {
        setAbierto(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener('sesion-expirada', handleExpirada);
      clearInterval(intervalo);
    };
  }, [location.pathname]);

  const irAlLogin = () => {
    setAbierto(false);
    localStorage.clear(); // Limpiamos la sesión vieja
    navigate('/login');
  };

  // Si no está abierto, no renderiza nada en la pantalla
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-sm border border-red-100">
          !
        </div>
        <h2 className="text-xl font-extrabold text-gray-800 mb-2">Sesión Expirada</h2>
        <p className="text-sm text-gray-500 mb-6">
          Tu tiempo de sesión ha terminado por seguridad. Por favor, volvé a ingresar.
        </p>
        <button
          onClick={irAlLogin}
          className="w-full py-3 bg-[#129b9b] hover:bg-[#0d7373] text-white rounded-xl text-sm font-extrabold transition shadow-lg cursor-pointer"
        >
          Ir al Inicio de Sesión
        </button>
      </div>
    </div>
  );
};

export default SesionExpiradaModal;