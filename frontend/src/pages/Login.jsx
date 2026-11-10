import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Login = () => {
  const navigate = useNavigate();

  // Control de modales: null | 'cliente' | 'veterinario'
  const [modalTipo, setModalTipo] = useState(null);
  const [activeTabCliente, setActiveTabCliente] = useState('login');

  // Estados formulario Login Cliente
  const [loginUsuario, setLoginUsuario] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estados formulario Login Veterinario
  const [vetUsuario, setVetUsuario] = useState('');
  const [vetPassword, setVetPassword] = useState('');

  // Estados formulario Registro Cliente
  const [regUsuario, setRegUsuario] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDni, setRegDni] = useState('');
  const [regNombre, setRegNombre] = useState('');
  const [regApellido, setRegApellido] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regTelefono, setRegTelefono] = useState('');

  // Estados de control y validación
  const [cargando, setCargando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState(null);
  const [errorEmail, setErrorEmail] = useState('');

  const validarFormatoEmail = (email) => {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexEmail.test(email);
  };

  const handleEmailChange = (e) => {
    const valor = e.target.value;
    setRegEmail(valor);
    if (errorEmail && (valor === '' || validarFormatoEmail(valor.trim()))) {
      setErrorEmail('');
    }
  };

  // CAMBIO: recibe userId y lo guarda como clientId (solo si existe)
  const guardarSesion = (token, role, userName, userId) => {
    const ahora = Date.now();
    const tiempoExpiracion = ahora + 10 * 60 * 1000;

    localStorage.setItem('token', token);
    localStorage.setItem('token_expiration', tiempoExpiracion);
    localStorage.setItem('role', role);
    localStorage.setItem('clientName', userName);

    if (userId != null) {
      localStorage.setItem('clientId', userId);
    } else {
      localStorage.removeItem('clientId');
    }

    navigate('/home');
  };

  // 1. Login para Clientes
  const handleLoginCliente = async (e) => {
    e.preventDefault();
    setErrorMensaje(null);
    setCargando(true);

    try {
      const res = await api.post('/api/auth/login-json', {
        usuario: loginUsuario.trim(),
        password: loginPassword,
      });

      // CAMBIO: se extrae id_cliente y se pasa a guardarSesion
      const { access_token, rol, usuario, id_cliente } = res.data;
      guardarSesion(access_token, rol, usuario, id_cliente);
    } catch (err) {
      console.error(err);
      setErrorMensaje(err.response?.data?.detail || 'Usuario o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  // 2. Login para Veterinarios
  const handleLoginVeterinario = async (e) => {
    e.preventDefault();
    setErrorMensaje(null);
    setCargando(true);

    try {
      const res = await api.post('/api/auth/login-json', {
        usuario: vetUsuario.trim(),
        password: vetPassword,
      });

      // CAMBIO: se extrae id_cliente y se pasa a guardarSesion
      const { access_token, rol, usuario, id_cliente } = res.data;
      guardarSesion(access_token, rol, usuario, id_cliente);
    } catch (err) {
      console.error(err);
      setErrorMensaje(err.response?.data?.detail || 'Credenciales de veterinario inválidas');
    } finally {
      setCargando(false);
    }
  };

  // 3. Registro de nuevos Clientes
  const handleRegisterCliente = async (e) => {
    e.preventDefault();
    setErrorMensaje(null);

    const emailLimpio = regEmail.trim();

    if (!validarFormatoEmail(emailLimpio)) {
      setErrorEmail('No es válido, ingrese un mail válido');
      return;
    }

    setErrorEmail('');
    setCargando(true);

    try {
      await api.post('/api/auth/registro-cliente', {
        dni: regDni.trim(),
        usuario: regUsuario.trim(),
        password: regPassword,
        nombre: regNombre.trim(),
        apellido: regApellido.trim(),
        email: emailLimpio,
        telefono: regTelefono.trim(),
      });

      // Login automático tras registrarse
      const resLogin = await api.post('/api/auth/login-json', {
        usuario: regUsuario.trim(),
        password: regPassword,
      });

      // CAMBIO: se pasa también id_cliente
      guardarSesion(
        resLogin.data.access_token,
        resLogin.data.rol,
        resLogin.data.usuario,
        resLogin.data.id_cliente
      );
    } catch (err) {
      console.error(err);
      setErrorMensaje(err.response?.data?.detail || 'Error al registrar el cliente');
    } finally {
      setCargando(false);
    }
  };

  const cerrarModal = () => {
    setModalTipo(null);
    setErrorMensaje(null);
    setErrorEmail('');
    setActiveTabCliente('login');
    setLoginUsuario('');
    setLoginPassword('');
    setVetUsuario('');
    setVetPassword('');
    setRegDni('');
    setRegUsuario('');
    setRegPassword('');
    setRegNombre('');
    setRegApellido('');
    setRegEmail('');
    setRegTelefono('');
  };

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6 relative overflow-hidden">

      {/* Fondo exterior */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-70 pointer-events-none z-0"
        style={{ backgroundImage: "url('/logologin.jpg')" }}
      />

      {/* Tarjeta Central */}
      <div className="w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl flex flex-col justify-between p-6 text-white relative z-10 overflow-hidden">

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

        {/* Botones Principales */}
        <div className="w-full space-y-3 mb-4">
          <button
            onClick={() => {
              setErrorMensaje(null);
              setErrorEmail('');
              setActiveTabCliente('login');
              setModalTipo('cliente');
            }}
            className="w-full bg-[#f1adb6] hover:bg-[#e89ca6] text-white font-bold py-3.5 rounded-full shadow-lg tracking-wider text-xs md:text-sm transition-transform active:scale-95 cursor-pointer"
          >
            INGRESAR COMO CLIENTE
          </button>

          <button
            onClick={() => {
              setErrorMensaje(null);
              setErrorEmail('');
              setModalTipo('veterinario');
            }}
            className="w-full bg-white hover:bg-gray-50 text-[#129b9b] font-bold py-3.5 rounded-full shadow-lg tracking-wider text-xs md:text-sm transition-transform active:scale-95 cursor-pointer"
          >
            INGRESAR COMO VETERINARIO
          </button>
        </div>

        {/* Modal de Acceso */}
        {modalTipo && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white text-gray-800 p-6 rounded-3xl w-full max-w-xs shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
              <button
                onClick={cerrarModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>

              <h3 className="font-bold text-[#129b9b] text-center text-base">
                {modalTipo === 'veterinario'
                  ? 'Acceso Veterinario'
                  : (activeTabCliente === 'login' ? 'Acceso Cliente' : 'Crear Cuenta Cliente')}
              </h3>

              {/* Mensajes de error generales */}
              {errorMensaje && (
                <div className="bg-red-50 text-red-600 p-2 rounded-xl text-xs text-center border border-red-200">
                  {errorMensaje}
                </div>
              )}

              {/* FLUJO VETERINARIO */}
              {modalTipo === 'veterinario' && (
                <form onSubmit={handleLoginVeterinario} className="space-y-3 text-xs">
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Usuario veterinario (ej: vet_franco) *"
                      required
                      value={vetUsuario}
                      onChange={(e) => setVetUsuario(e.target.value)}
                      className="w-full border border-gray-200 p-2.5 rounded-xl focus:outline-none focus:border-[#129b9b]"
                    />
                    <input
                      type="password"
                      placeholder="Contraseña *"
                      required
                      value={vetPassword}
                      onChange={(e) => setVetPassword(e.target.value)}
                      className="w-full border border-gray-200 p-2.5 rounded-xl focus:outline-none focus:border-[#129b9b]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={cargando}
                    className="w-full bg-[#129b9b] hover:bg-[#0e7c7c] text-white font-bold py-3 rounded-full shadow text-xs tracking-wider transition-transform active:scale-95 mt-2 cursor-pointer"
                  >
                    {cargando ? 'VALIDANDO...' : 'INGRESAR AL SISTEMA'}
                  </button>
                </form>
              )}

              {/* FLUJO CLIENTE */}
              {modalTipo === 'cliente' && (
                <>
                  {activeTabCliente === 'login' && (
                    <form onSubmit={handleLoginCliente} className="space-y-2.5 text-xs">
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Usuario *"
                          required
                          value={loginUsuario}
                          onChange={(e) => setLoginUsuario(e.target.value)}
                          className="w-full border border-gray-200 p-2.5 rounded-xl focus:outline-none focus:border-[#129b9b]"
                        />
                        <input
                          type="password"
                          placeholder="Contraseña *"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full border border-gray-200 p-2.5 rounded-xl focus:outline-none focus:border-[#129b9b]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={cargando}
                        className="w-full bg-[#f1adb6] hover:bg-[#e89ca6] text-white font-bold py-3 rounded-full shadow text-xs tracking-wider transition-transform active:scale-95 mt-2 cursor-pointer"
                      >
                        {cargando ? 'INGRESANDO...' : 'INGRESAR'}
                      </button>

                      <p className="text-center text-[11px] text-gray-500 pt-2">
                        ¿No tenés una cuenta?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTabCliente('register');
                            setErrorMensaje(null);
                            setErrorEmail('');
                          }}
                          className="text-[#129b9b] font-bold hover:underline cursor-pointer"
                        >
                          Crear cuenta
                        </button>
                      </p>
                    </form>
                  )}

                  {activeTabCliente === 'register' && (
                    <form onSubmit={handleRegisterCliente} noValidate className="space-y-2 text-xs">
                      <div className="space-y-1.5">

                        <input
                          type="text"
                          placeholder="Usuario *"
                          required
                          value={regUsuario}
                          onChange={(e) => setRegUsuario(e.target.value)}
                          className="w-full border border-gray-200 p-2 rounded-xl focus:outline-none focus:border-[#129b9b]"
                        />
                        <input
                          type="password"
                          placeholder="Contraseña (mín 4 car.) *"
                          required
                          minLength={4}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full border border-gray-200 p-2 rounded-xl focus:outline-none focus:border-[#129b9b]"
                        />
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Nombre *"
                            required
                            value={regNombre}
                            onChange={(e) => setRegNombre(e.target.value)}
                            className="w-1/2 border border-gray-200 p-2 rounded-xl focus:outline-none focus:border-[#129b9b]"
                          />
                          <input
                            type="text"
                            placeholder="Apellido *"
                            required
                            value={regApellido}
                            onChange={(e) => setRegApellido(e.target.value)}
                            className="w-1/2 border border-gray-200 p-2 rounded-xl focus:outline-none focus:border-[#129b9b]"
                          />
                        </div>

                        {/* Campo Email */}
                        <div>
                          <input
                            type="email"
                            placeholder="Email *"
                            required
                            value={regEmail}
                            onChange={handleEmailChange}
                            onBlur={() => {
                              if (regEmail.trim() && !validarFormatoEmail(regEmail.trim())) {
                                setErrorEmail('No es válido, ingrese un mail válido');
                              }
                            }}
                            className={`w-full border p-2 rounded-xl focus:outline-none transition-colors ${
                              errorEmail
                                ? 'border-red-500 focus:border-red-500 bg-red-50/30'
                                : 'border-gray-200 focus:border-[#129b9b]'
                            }`}
                          />
                          {errorEmail && (
                            <p className="text-red-500 text-[10px] mt-1 pl-1 font-medium">
                              {errorEmail}
                            </p>
                          )}
                        </div>

                        <input
                          type="tel"
                          placeholder="Teléfono (opcional)"
                          value={regTelefono}
                          onChange={(e) => setRegTelefono(e.target.value)}
                          className="w-full border border-gray-200 p-2 rounded-xl focus:outline-none focus:border-[#129b9b]"
                        />
                        <input
                          type="text"
                          placeholder="DNI  "
                          required
                          maxLength={10}
                          value={regDni}
                          onChange={(e) => setRegDni(e.target.value.replace(/\D/g, ''))} // Solo números
                          className="w-full border border-gray-200 p-2 rounded-xl focus:outline-none focus:border-[#129b9b]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={cargando}
                        className="w-full bg-[#129b9b] hover:bg-[#0d7878] text-white font-bold py-2.5 rounded-full shadow text-xs tracking-wider transition-transform active:scale-95 mt-1 cursor-pointer"
                      >
                        {cargando ? 'REGISTRANDO...' : 'REGISTRARME'}
                      </button>

                      <p className="text-center text-[11px] text-gray-500 pt-2">
                        ¿Ya tenés cuenta?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTabCliente('login');
                            setErrorMensaje(null);
                            setErrorEmail('');
                          }}
                          className="text-[#129b9b] font-bold hover:underline cursor-pointer"
                        >
                          Iniciar sesión
                        </button>
                      </p>
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