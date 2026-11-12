import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';

// Ruta de la pantalla de historial (ajustala a la que uses en tu router)
const RUTA_HISTORIAL = '/historial-turnos';

// Calcula la fecha mínima requerida (hoy + 2 días) en formato YYYY-MM-DD
const calcularFechaMinima = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toLocaleDateString('en-CA');
};

// Misma regla que el backend: antes de las 15:00 → vet 1, después → vet 2
const asignarVeterinarioId = (hora) => (hora < '15:00' ? 1 : 2);

// Arma el nombre visible de un veterinario a partir de lo que devuelva la API
const nombreVeterinario = (v) => {
  if (!v) return null;
  const completo =
    v.nombre_completo || [v.nombre, v.apellido].filter(Boolean).join(' ').trim();
  return completo ? completo : null;
};

const TurnosPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [submitted, setSubmitted] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const minDate = calcularFechaMinima();

  const [misMascotas, setMisMascotas] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);

  const [formData, setFormData] = useState({
    mascotaId: '',
    servicio: 'Consulta General',
    fecha: minDate,
    hora: '09:00',
    motivo: '',
  });

  // 1. Cargar mascotas del cliente logueado
  const cargarMascotas = useCallback(async () => {
    const clientId = localStorage.getItem('clientId');
    if (!clientId) return;

    try {
      const res = await api.get(
        `/api/clinica/clientes/${clientId}/mascotas?incluir_inactivos=false`
      );
      const lista = Array.isArray(res.data) ? res.data : [];
      setMisMascotas(lista);

      if (location.state?.nuevaMascotaId) {
        setFormData((prev) => ({ ...prev, mascotaId: String(location.state.nuevaMascotaId) }));
      } else if (lista.length > 0) {
        setFormData((prev) =>
          prev.mascotaId ? prev : { ...prev, mascotaId: String(lista[0].id_mascota) }
        );
      }
    } catch (err) {
      console.error('Error al cargar mascotas:', err);
    }
  }, [location.state]);

  // 2. Cargar veterinarios para mostrar el nombre del profesional asignado
  const cargarVeterinarios = useCallback(async () => {
    try {
      const res = await api.get('/api/clinica/veterinarios');
      setVeterinarios(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      // No es crítico: si falla, se muestra un texto genérico
      console.error('Error al cargar veterinarios:', err);
    }
  }, []);

  useEffect(() => {
    cargarMascotas();
  }, [cargarMascotas]);

  useEffect(() => {
    cargarVeterinarios();
  }, [cargarVeterinarios]);

  const handleMascotaChange = (e) => {
    const value = e.target.value;
    if (value === 'IR_A_REGISTRO') {
      navigate('/mascotas', { state: { returnToTurnos: true } });
    } else {
      setFormData({ ...formData, mascotaId: value });
    }
  };

  // 3. Solicitar turno: POST /api/clinica/turnos
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mascotaId) {
      setError('Por favor seleccione una mascota');
      return;
    }

    if (formData.fecha < minDate) {
      setError('Los turnos deben solicitarse con al menos 2 días de anticipación.');
      return;
    }

    setCargando(true);
    setError('');

    try {
      const fechaHoraCombinada = `${formData.fecha}T${formData.hora}:00`;

      await api.post('/api/clinica/turnos', {
        id_mascota: parseInt(formData.mascotaId, 10),
        id_veterinario: asignarVeterinarioId(formData.hora),
        fecha_hora: fechaHoraCombinada,
        motivo: formData.motivo,
        servicio: formData.servicio,
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Error al solicitar turno:', err);
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
          ? detail.map((d) => d.msg).join(', ')
          : 'Error al agendar la cita'
      );
    } finally {
      setCargando(false);
    }
  };

  const mascotaSeleccionada =
    misMascotas.find((m) => String(m.id_mascota) === String(formData.mascotaId))?.nombre ||
    'Mascota';

  const vetAsignado = veterinarios.find(
    (v) => Number(v.id_veterinario ?? v.id) === asignarVeterinarioId(formData.hora)
  );
  const vetAsignadoNombre = nombreVeterinario(vetAsignado) || 'Asignado por la clínica';

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6 relative">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/logologin.jpg')" }}
      />

      <div className="relative z-10 w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl p-5 text-white flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => navigate('/home')}
              className="text-sm font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              ‹ Volver
            </button>
            <h2 className="font-bold text-lg">Pedir Cita</h2>
            <div className="w-10" />
          </div>

          {error && (
            <div className="bg-red-500/85 text-white p-2.5 rounded-xl text-xs text-center mb-3">
              {error}
            </div>
          )}

          {submitted ? (
            <div className="bg-white text-gray-800 p-6 rounded-2xl shadow-lg text-center mt-4 space-y-4">
              <span className="text-5xl">🎉</span>
              <h3 className="text-[#129b9b] text-xl font-bold">¡Cita Programada!</h3>
              <p className="text-xs text-gray-600">
                Tu turno para <strong className="text-[#129b9b]">{mascotaSeleccionada}</strong> ha
                sido agendado con éxito.
              </p>

              <div className="bg-cyan-50 p-3 rounded-xl text-xs text-left space-y-1 text-gray-700 border border-cyan-100">
                <p><strong>Servicio:</strong> {formData.servicio}</p>
                <p><strong>Fecha:</strong> {formData.fecha}</p>
                <p><strong>Hora:</strong> {formData.hora} hs</p>
                {formData.motivo && <p><strong>Motivo:</strong> {formData.motivo}</p>}
                <p><strong>Veterinario asignado:</strong> {vetAsignadoNombre}</p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => navigate(RUTA_HISTORIAL)}
                  className="w-full bg-[#129b9b] text-white py-2.5 rounded-full font-bold text-xs hover:bg-[#0e7e7e] transition-colors cursor-pointer"
                >
                  Ver mis turnos
                </button>
                <button
                  onClick={() => setSubmitted(false)}
                  className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-full font-bold text-xs hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Solicitar otro turno
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
                <label className="block text-xs font-semibold mb-1 text-cyan-100">
                  Tipo de Servicio
                </label>
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
                  <label className="block text-xs font-semibold mb-1 text-cyan-100">
                    Hora (09:00 a 20:00)
                  </label>
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
                <label className="block text-xs font-semibold mb-1 text-cyan-100">
                  Motivo de la visita
                </label>
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
