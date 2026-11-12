import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';

// Calcula la fecha mínima requerida (hoy + 2 días) en formato YYYY-MM-DD
const calcularFechaMinima = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toLocaleDateString('en-CA');
};

const TurnosPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [submitted, setSubmitted] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Fecha mínima permitida (2 días de anticipación)
  const minDate = calcularFechaMinima();

  // Lista dinámicamente obtenida desde el Backend
  const [misMascotas, setMisMascotas] = useState([]);

  const [formData, setFormData] = useState({
    mascotaId: '',
    servicio: 'Consulta General',
    fecha: minDate,
    hora: '09:00',
    motivo: '',
  });

  // 1. Cargar las mascotas del cliente logueado desde el Backend
  const cargarMascotas = async () => {
    const clientId = localStorage.getItem('clientId');
    if (!clientId) return;

    try {
      const res = await api.get(`/api/clinica/clientes/${clientId}/mascotas?incluir_inactivos=false`);
      const lista = res.data || [];
      setMisMascotas(lista);

      // Si volvemos de registrar una mascota nueva desde PetsPage, la seleccionamos
      if (location.state?.nuevaMascotaId) {
        setFormData((prev) => ({ ...prev, mascotaId: String(location.state.nuevaMascotaId) }));
      } else if (lista.length > 0 && !formData.mascotaId) {
        setFormData((prev) => ({ ...prev, mascotaId: String(lista[0].id_mascota) }));
      }
    } catch (err) {
      console.error('Error al cargar mascotas:', err);
    }
  };

  useEffect(() => {
    cargarMascotas();
  }, [location.state]);

  const handleMascotaChange = (e) => {
    const value = e.target.value;
    if (value === 'IR_A_REGISTRO') {
      navigate('/mascotas', { state: { returnToTurnos: true } });
    } else {
      setFormData({ ...formData, mascotaId: value });
    }
  };

  // 2. Confirmar Cita / Solicitar Turno en Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mascotaId) {
      setError('Por favor seleccione una mascota');
      return;
    }

    // Validación de anticipación mínima de 2 días
    if (formData.fecha < minDate) {
      setError('Los turnos deben solicitarse con al menos 2 días de anticipación.');
      return;
    }

    setCargando(true);
    setError('');

    try {
      // Unimos fecha y hora en formato ISO 8601
      const fechaHoraCombinada = `${formData.fecha}T${formData.hora}:00`;

      // Determinamos el veterinario según la hora: antes de 15:00 = Vet 1, desde 15:00 = Vet 2
      const idAsignado = formData.hora < '15:00' ? 1 : 2;

      await api.post('/api/clinica/turnos', {
        id_mascota: parseInt(formData.mascotaId, 10),
        id_veterinario: idAsignado,
        fecha_hora: fechaHoraCombinada,
        motivo: formData.motivo,
        servicio: formData.servicio,
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
    misMascotas.find((m) => String(m.id_mascota) === String(formData.mascotaId))?.nombre || 'Mascota';

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6 relative">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/logologin.jpg')" }}
      />

      <div className="relative z-10 w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl p-5 text-white flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex justify-between items-center mb-4">
            {/* Solo muestra el botón Volver arriba si el turno AÚN NO fue confirmado */}
            {!submitted ? (
              <button
                onClick={() => navigate('/home')}
                className="text-sm font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                ‹ Volver
              </button>
            ) : (
              <div className="w-12"></div>
            )}
            <h2 className="font-bold text-lg">
              {submitted ? 'Turno Solicitado' : 'Pedir Cita'}
            </h2>
            <div className="w-12"></div>
          </div>

          {error && (
            <div className="bg-red-500/80 text-white p-2.5 rounded-xl text-xs text-center mb-3">
              {error}
            </div>
          )}

          {submitted ? (
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
                <p><strong>Veterinario asignado:</strong> Vet {formData.hora < '15:00' ? 1 : 2}</p>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  onClick={() => setSubmitted(false)}
                  className="w-full bg-[#129b9b] text-white py-2.5 rounded-full font-bold text-xs hover:bg-[#0e7e7e] transition-colors cursor-pointer"
                >
                  Solicitar otro turno
                </button>

                <button
                  onClick={() => navigate('/home')}
                  className="w-full bg-gray-100 text-[#129b9b] border border-[#129b9b]/30 py-2.5 rounded-full font-bold text-xs hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Volver a menú principal
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-cyan-100">
                  Seleccionar Mascota
                </label>
                <select
                  value={formData.mascotaId}
                  onChange={handleMascotaChange}
                  className="w-full bg-white text-gray-800 rounded-xl p-3 text-xs font-medium focus:outline-none border-0 cursor-pointer"
                >
                  {misMascotas.length === 0 && (
                    <option value="" disabled>-- No tenés mascotas registradas --</option>
                  )}
                  {misMascotas.map((m) => (
                    <option key={m.id_mascota} value={m.id_mascota}>
                      🐾 {m.nombre} ({m.especie})
                    </option>
                  ))}
                  <option value="IR_A_REGISTRO" className="font-bold text-[#129b9b]">
                    ➕ Registrar nueva mascota...
                  </option>
                </select>
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-cyan-100">Fecha</label>
                  <input
                    type="date"
                    required
                    min={minDate}
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full bg-white text-gray-800 rounded-xl p-3 text-xs font-medium focus:outline-none border-0 cursor-pointer"
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
                disabled={cargando || misMascotas.length === 0}
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