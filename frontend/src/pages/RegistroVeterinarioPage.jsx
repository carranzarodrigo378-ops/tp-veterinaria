import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const FORM_INICIAL = {
  nombre: '',
  apellido: '',
  matricula: '',
  usuario: '',
  password: '',
  confirmar: '',
};

const inputClase =
  'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#129b9b]/50';

// El backend puede devolver el error como texto (400/409) o como lista (422)
const mensajeDeError = (err) => {
  const detalle = err.response?.data?.detail;
  if (typeof detalle === 'string') return detalle;
  if (Array.isArray(detalle)) return detalle.map((d) => d.msg).join('. ');
  return 'No se pudo registrar al veterinario.';
};

const RegistroVeterinarioPage = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'cliente';

  const [form, setForm] = useState(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Solo el admin puede dar de alta veterinarios
  const expiration = localStorage.getItem('token_expiration');
  const sesionValida =
    !!expiration && Date.now() <= parseInt(expiration, 10) && role === 'admin';

  useEffect(() => {
    if (!sesionValida) navigate('/login');
  }, [sesionValida, navigate]);

  const cambiar = (campo) => (e) => setForm((prev) => ({ ...prev, [campo]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    const nombre = form.nombre.trim();
    const apellido = form.apellido.trim();
    const matricula = form.matricula.trim();
    const usuario = form.usuario.trim();

    if (!nombre  || !apellido || !matricula || !usuario || !form.password) {
      setError('Completá todos los campos.');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setEnviando(true);
      const res = await api.post('/api/auth/registro-veterinario', {
        usuario,
        password: form.password,
        nombre_completo: `${nombre} ${apellido}`,
        matricula,
      });
      setExito(typeof res.data === 'string' ? res.data : 'Veterinario registrado correctamente.');
      setForm(FORM_INICIAL);
    } catch (err) {
      console.error('Error al registrar veterinario:', err);
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  if (!sesionValida) return null;

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6 relative">
      {/* Fondo exterior */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/logologin.jpg')" }}
      />

      <div className="relative z-10 w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl p-5 text-white overflow-y-auto">
        {/* Barra superior */}
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate('/home')} className="text-sm font-semibold hover:underline">
            ‹ Volver
          </button>
          <h2 className="font-bold text-lg">Añadir Veterinario</h2>
          <div className="w-6"></div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-xl text-xs mb-3 font-medium">{error}</div>
        )}
        {exito && (
          <div className="bg-green-100 text-green-800 p-3 rounded-xl text-xs mb-3 font-medium">
            {exito}
          </div>
        )}

        <form
          onSubmit={enviar}
          className="bg-white text-gray-800 p-5 rounded-2xl shadow-lg space-y-3"
        >
          <h3 className="font-bold text-[#129b9b] text-sm border-b border-[#129b9b]/30 pb-1">
            Datos del profesional
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-gray-500 font-semibold mb-1">Nombre</label>
              <input
                type="text"
                value={form.nombre}
                onChange={cambiar('nombre')}
                placeholder="Ej: Franco"
                className={inputClase}
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 font-semibold mb-1">Apellido</label>
              <input
                type="text"
                value={form.apellido}
                onChange={cambiar('apellido')}
                placeholder="Ej: Pérez"
                className={inputClase}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 font-semibold mb-1">Matrícula</label>
            <input
              type="text"
              value={form.matricula}
              onChange={cambiar('matricula')}
              placeholder="Ej: MP-1234"
              className={inputClase}
            />
          </div>

          <h3 className="font-bold text-[#129b9b] text-sm border-b border-[#129b9b]/30 pb-1 pt-2">
            Acceso al sistema
          </h3>

          <div>
            <label className="block text-[11px] text-gray-500 font-semibold mb-1">Usuario</label>
            <input
              type="text"
              value={form.usuario}
              onChange={cambiar('usuario')}
              placeholder="Ej: vet_perez"
              autoComplete="off"
              className={inputClase}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-gray-500 font-semibold mb-1">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={cambiar('password')}
                autoComplete="new-password"
                className={inputClase}
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 font-semibold mb-1">Repetir</label>
              <input
                type="password"
                value={form.confirmar}
                onChange={cambiar('confirmar')}
                autoComplete="new-password"
                className={inputClase}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-[#129b9b] hover:bg-[#0d7373] disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition mt-2"
          >
            {enviando ? 'Registrando...' : 'Registrar veterinario'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistroVeterinarioPage;