import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const [loginNombre, setLoginNombre] = useState('');
  const [loginApellido, setLoginApellido] = useState('');
  const [loginCodigo, setLoginCodigo] = useState('');

  const [regNombre, setRegNombre] = useState('');
  const [regApellido, setRegApellido] = useState('');
  const [regEmail, setRegEmail] = useState('');

  const [codigoGenerado, setCodigoGenerado] = useState(null);

  // Función para guardar sesión con expiración de 10 minutos
  const guardarSesionConExpiracion = (role, clientName, clientId = null) => {
    const ahora = Date.now();
    const tiempoExpiracion = ahora + 10 * 60 * 1000; // 10 minutos en ms

    localStorage.setItem('token', 'demo_token');
    localStorage.setItem('token_expiration', tiempoExpiracion.toString());
    localStorage.setItem('role', role);
    localStorage.setItem('clientName', clientName);
    
    if (clientId) {
      localStorage.setItem('clientId', clientId);
    } else {
      localStorage.removeItem('clientId');
    }

    navigate('/home');
  };

  const handleLoginCliente = (e) => {
    e.preventDefault();
    if (!loginNombre.trim() || !loginApellido.trim() || !loginCodigo.trim()) {
      alert('Por favor completá Nombre, Apellido y tu Código.');
      return;
    }

    guardarSesionConExpiracion(
      'cliente', 
      `${loginNombre.trim()} ${loginApellido.trim()}`, 
      loginCodigo.trim().toUpperCase()
    );
  };

  const handleRegisterCliente = (e) => {
    e.preventDefault();
    if (!regNombre.trim() || !regApellido.trim() || !regEmail.trim()) return;

    const nuevoCodigo = `VET-${Math.floor(1000 + Math.random() * 9000)}`;
    setCodigoGenerado(nuevoCodigo);
  };

  const handleEntrarConCodigoNuevo = () => {
    guardarSesionConExpiracion(
      'cliente', 
      `${regNombre.trim()} ${regApellido.trim()}`, 
      codigoGenerado
    );
  };

  const handleStartVeterinario = () => {
    guardarSesionConExpiracion('veterinario', 'Dra. María Silva (Clínica Norte)');
  };

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6">
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

        {/* Únicamente 2 Botones Principales en el Inicio */}
        <div className="w-full space-y-3 mb-4">
          <button 
            onClick={() => setShowClienteModal(true)} 
            className="w-full bg-[#f1adb6] hover:bg-[#e89ca6] text-white font-bold py-3.5 rounded-full shadow-lg tracking-wider text-xs md:text-sm transition-transform active:scale-95"
          >
            INGRESAR COMO CLIENTE
          </button>
          
          <button 
            onClick={handleStartVeterinario} 
            className="w-full bg-white hover:bg-gray-50 text-[#129b9b] font-bold py-3.5 rounded-full shadow-lg tracking-wider text-xs md:text-sm transition-transform active:scale-95"
          >
            INGRESAR COMO VETERINARIO
          </button>
        </div>

        {/* Modal de Acceso para Clientes */}
        {showClienteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white text-gray-800 p-6 rounded-3xl w-full max-w-xs shadow-2xl relative space-y-4">
              <button 
                onClick={() => { setShowClienteModal(false); setCodigoGenerado(null); }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>

              <h3 className="font-bold text-[#129b9b] text-center text-base">Acceso Cliente</h3>

              {codigoGenerado ? (
                <div className="text-center space-y-3 bg-cyan-50 p-4 rounded-2xl border border-cyan-100">
                  <span className="text-3xl">🎉</span>
                  <p className="text-xs text-gray-700 font-medium">¡Registro exitoso! Tu código de cliente es:</p>
                  <p className="text-xl font-mono font-extrabold text-[#129b9b] bg-white py-2 rounded-xl shadow-inner border border-cyan-200">
                    {codigoGenerado}
                  </p>
                  <button 
                    onClick={handleEntrarConCodigoNuevo}
                    className="w-full bg-[#129b9b] text-white font-bold py-2.5 rounded-full text-xs shadow hover:bg-[#0d7878]"
                  >
                    CONTINUAR A MI CUENTA
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
                    <button 
                      onClick={() => setActiveTab('login')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'login' ? 'bg-white text-[#129b9b] shadow' : 'text-gray-500'}`}
                    >
                      Ingresar
                    </button>
                    <button 
                      onClick={() => setActiveTab('register')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'register' ? 'bg-white text-[#129b9b] shadow' : 'text-gray-500'}`}
                    >
                      Primera vez
                    </button>
                  </div>

                  {activeTab === 'login' && (
                    <form onSubmit={handleLoginCliente} className="space-y-2.5 text-xs">
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          placeholder="Nombre *"
                          required
                          value={loginNombre}
                          onChange={(e) => setLoginNombre(e.target.value)}
                          className="w-full border border-gray-200 p-2.5 rounded-xl focus:outline-none focus:border-[#129b9b]"
                        />
                        <input 
                          type="text" 
                          placeholder="Apellido *"
                          required
                          value={loginApellido}
                          onChange={(e) => setLoginApellido(e.target.value)}
                          className="w-full border border-gray-200 p-2.5 rounded-xl focus:outline-none focus:border-[#129b9b]"
                        />
                        <input 
                          type="text" 
                          placeholder="Código de cliente (ej: VET-1001) *"
                          required
                          value={loginCodigo}
                          onChange={(e) => setLoginCodigo(e.target.value)}
                          className="w-full border border-gray-200 p-2.5 rounded-xl font-mono uppercase focus:outline-none focus:border-[#129b9b]"
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="w-full bg-[#f1adb6] hover:bg-[#e89ca6] text-white font-bold py-3 rounded-full shadow text-xs tracking-wider transition-transform active:scale-95 mt-2"
                      >
                        INGRESAR
                      </button>
                    </form>
                  )}

                  {activeTab === 'register' && (
                    <form onSubmit={handleRegisterCliente} className="space-y-2.5 text-xs">
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          placeholder="Nombre *"
                          required
                          value={regNombre}
                          onChange={(e) => setRegNombre(e.target.value)}
                          className="w-full border border-gray-200 p-2.5 rounded-xl focus:outline-none focus:border-[#129b9b]"
                        />
                        <input 
                          type="text" 
                          placeholder="Apellido *"
                          required
                          value={regApellido}
                          onChange={(e) => setRegApellido(e.target.value)}
                          className="w-full border border-gray-200 p-2.5 rounded-xl focus:outline-none focus:border-[#129b9b]"
                        />
                        <input 
                          type="email" 
                          placeholder="Email *"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full border border-gray-200 p-2.5 rounded-xl focus:outline-none focus:border-[#129b9b]"
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="w-full bg-[#129b9b] hover:bg-[#0d7878] text-white font-bold py-3 rounded-full shadow text-xs tracking-wider transition-transform active:scale-95 mt-2"
                      >
                        REGISTRARME Y OBTENER CÓDIGO
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;