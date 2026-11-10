import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const TurnosPage = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Obtener la fecha actual en formato YYYY-MM-DD para bloquear días pasados
  const today = new Date().toISOString().split('T')[0];

  // Lista dinámicamente obtenida desde el Backend
  const [misMascotas, setMisMascotas] = useState([]);

  const [formData, setFormData] = useState({
    mascotaId: '',
    servicio: 'Consulta General',
    fecha: today,
    hora: '09:00',
    motivo: '',
  });

  // Estado para el formulario rápido de nueva mascota
  const [isAddingPet, setIsAddingPet] = useState(false);
  const [nuevaMascota, setNuevaMascota] = useState({ nombre: '', especie: 'Perro', raza: '' });

  // 1. Cargar las mascotas del cliente logueado
  const cargarMascotas = async () => {
    const clientId = localStorage.getItem('clientId');
    if (!clientId) return;

    try {
      const res = await api.get(`/api/mascotas/cliente/${clientId}`);
      const lista = res.data || [];
      setMisMascotas(lista);

      // Asignar la primera mascota por defecto si no hay ninguna elegida
      if (lista.length > 0 && !formData.mascotaId) {
        setFormData((prev) => ({ ...prev, mascotaId: String(lista[0].id) }));
      }
    } catch (err) {
      console.error('Error al cargar mascotas:', err);
    }
  };

  useEffect(() => {
    cargarMascotas();
  }, []);

  const handleMascotaChange = (e) => {
    const value = e.target.value;
    if (value === 'NUEVA') {
      setIsAddingPet(true);
    } else {
      setIsAddingPet(false);
      setFormData({ ...formData, mascotaId: value });
    }
  };

  // 2. Crear nueva mascota y guardarla en el Backend
  const handleCrearMascotaYAsignar = async (e) => {
    e.preventDefault();
    if (!nuevaMascota.nombre.trim()) return;

    const clientId = localStorage.getItem('clientId');
    setCargando(true);
    setError('');

    try {
      // POST al endpoint de mascotas
      const res = await api.post('/api/mascotas', {
        nombre: nuevaMascota.nombre.trim(),
        especie: nuevaMascota.especie,
        raza: nuevaMascota.raza.trim() || 'Desconocida',
        id_cliente: clientId ? parseInt(clientId, 10) : null,
      });

      const petCreada = res.data;

      // Actualizar lista de mascotas local y seleccionar la nueva
      const listaActualizada = [...misMascotas, petCreada];
      setMisMascotas(listaActualizada);
      setFormData({ ...formData, mascotaId: String(petCreada.id) });

      // Resetear estado de agregar
      setIsAddingPet(false);
      setNuevaMascota({ nombre: '', especie: 'Perro', raza: '' });
    } catch (err) {
      console.error('Error al guardar mascota:', err);
      setError('No se pudo guardar la mascota. Intente nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  // 3. Confirmar Cita / Solicitar Turno en Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mascotaId) {
      setError('Por favor seleccione una mascota');
      return;
    }

    setCargando(true);
    setError('');

    try {
      const clientId = localStorage.getItem('clientId');
      await api.post('/api/turnos', {
        id_cliente: clientId ? parseInt(clientId, 10) : null,
        id_mascota: parseInt(formData.mascotaId, 10),
        servicio: formData.servicio,
        fecha: formData.fecha,
        hora: formData.hora,
        motivo: formData.motivo,
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Error al solicitar turno:', err);
      setError(err.response?.data?.detail || 'Error al agendar la cita');
    } finally {
      setCargando(false);
    }
  };

  const mascotaSeleccionada =
    misMascotas.find((m) => String(m.id) === String(formData.mascotaId))?.nombre || 'Mascota';

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6">
      <div className="w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl p-5 text-white flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => navigate('/home')}
              className="text-sm font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              ‹ Volver
            </button>
            <h2 className="font-bold text-lg">Pedir Cita</h2>
            <div className="w-6"></div>
          </div>

          {error && (
            <div className="bg-red-500/80 text-white p-2.5 rounded-xl text-xs text-center mb-3">
              {error}
            </div>
          )}

          {submitted ? (
            /* Confirmación */
            <div className="bg-white text-gray-800 p-6 rounded-2xl shadow-lg text-center mt-6 space-y-4">
              <span className="text-5xl">🎉</span>
              <h3 className="text-[#129b9b] text-xl font-bold">¡Cita Programada!</h3>
              <p className="text-xs text-gray-600">
                Tu turno para <strong className="text-[#129b9b]">{mascotaSeleccionada}</strong> ha sido agendado con éxito.
              </p>

              <div className="bg-cyan-50 p-3 rounded-xl text-xs text-left space-y-1 text-gray-700 border border-cyan-100">
                <p><strong>Servicio:</strong> {formData.servicio}</p>
                <p><strong>Fecha:</strong> {formData.fecha}</p>
                <p><strong>Hora:</strong> {formData.hora} hs</p>
                {formData.motivo && <p><strong>Motivo:</strong> {formData.motivo}</p>}
              </div>

              <button
                onClick={() => setSubmitted(false)}
                className="w-full bg-[#129b9b] text-white py-2.5 rounded-full font-bold text-xs hover:bg-[#0e7e7e] transition-colors cursor-pointer"
              >
                Solicitar otro turno
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Selector de Mascota */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-cyan-100">
                  Seleccionar Mascota
                </label>
                <select
                  value={isAddingPet ? 'NUEVA' : formData.mascotaId}
                  onChange={handleMascotaChange}
                  className="w-full bg-white text-gray-800 rounded-xl p-3 text-xs font-medium focus:outline-none border-0"
                >
                  {misMascotas.length === 0 && !isAddingPet && (
                    <option value="" disabled>-- No tenés mascotas registradas --</option>
                  )}
                  {misMascotas.map((m) => (
                    <option key={m.id} value={m.id}>
                      🐾 {m.nombre} ({m.especie})
                    </option>
                  ))}
                  <option value="NUEVA" className="font-bold text-[#129b9b]">
                    ➕ Registrar nueva mascota...
                  </option>
                </select>
              </div>

              {/* Formulario rápido desplegable si no tiene o quiere agregar una nueva */}
              {isAddingPet && (
                <div className="bg-white/10 p-3 rounded-2xl border border-white/30 space-y-2 text-xs">
                  <p className="font-bold text-pink-200">Registrar nueva mascota:</p>
                  <input
                    type="text"
                    placeholder="Nombre de la mascota *"
                    required
                    value={nuevaMascota.nombre}
                    onChange={(e) => setNuevaMascota({ ...nuevaMascota, nombre: e.target.value })}
                    className="w-full bg-white text-gray-800 p-2 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={nuevaMascota.especie}
                      onChange={(e) => setNuevaMascota({ ...nuevaMascota, especie: e.target.value })}
                      className="bg-white text-gray-800 p-2 rounded-lg"
                    >
                      <option value="Perro">Perro</option>
                      <option value="Gato">Gato</option>
                      <option value="Otro">Otro</option>
                    </select>
                    <button
                      type="button"
                      disabled={cargando}
                      onClick={handleCrearMascotaYAsignar}
                      className="bg-[#f1adb6] hover:bg-[#e89ca6] text-white font-bold rounded-lg px-2 py-1 cursor-pointer"
                    >
                      {cargando ? 'Guardando...' : 'Guardar y Elegir'}
                    </button>
                  </div>
                </div>
              )}

              {/* Tipo de Servicio */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-cyan-100">Tipo de Servicio</label>
                <select
                  value={formData.servicio}
                  onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                  className="w-full bg-white text-gray-800 rounded-xl p-3 text-xs font-medium focus:outline-none border-0"
                >
                  <option value="Consulta General">Consulta General 🩺</option>
                  <option value="Vacunación">Vacunación / Desparasitación 💉</option>
                  <option value="Control de Rutina">Control de Rutina 📋</option>
                  <option value="Urgencia">Urgencia 🚨</option>
                </select>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-cyan-100">Fecha</label>
                  <input
                    type="date"
                    required
                    min={today}
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full bg-white text-gray-800 rounded-xl p-3 text-xs font-medium focus:outline-none border-0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-cyan-100">Hora (09:00 a 20:00)</label>
                  <input
                    type="time"
                    required
                    min="09:00"
                    max="20:00"
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    className="w-full bg-white text-gray-800 rounded-xl p-3 text-xs font-medium focus:outline-none border-0"
                  />
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-cyan-100">Motivo de la visita</label>
                <textarea
                  rows="3"
                  placeholder="Describí los síntomas o el motivo del turno..."
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  className="w-full bg-white text-gray-800 rounded-xl p-3 text-xs font-medium focus:outline-none border-0 resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isAddingPet || cargando || misMascotas.length === 0}
                className="w-full bg-[#f1adb6] hover:bg-[#e89ca6] disabled:bg-gray-400 text-white font-bold py-3.5 rounded-full shadow-lg text-xs tracking-wider transition-transform active:scale-95 mt-2 cursor-pointer"
              >
                {cargando ? 'PROCESANDO...' : 'CONFIRMAR CITA'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TurnosPage;