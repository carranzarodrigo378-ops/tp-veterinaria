import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TurnosPage = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  // Obtener la fecha actual en formato YYYY-MM-DD para bloquear días pasados
  const today = new Date().toISOString().split('T')[0];

  // Lista de mascotas del cliente
  const [misMascotas, setMisMascotas] = useState([
    { id: 1, nombre: 'Nefer', especie: 'Gato' },
    { id: 2, nombre: 'Currito', especie: 'Gato' }
  ]);

  const [formData, setFormData] = useState({
    mascotaId: '1',
    servicio: 'Consulta General',
    fecha: today,
    hora: '09:00',
    motivo: '',
  });

  // Estado para el formulario rápido de nueva mascota
  const [isAddingPet, setIsAddingPet] = useState(false);
  const [nuevaMascota, setNuevaMascota] = useState({ nombre: '', especie: 'Perro', raza: '' });

  const handleMascotaChange = (e) => {
    const value = e.target.value;
    if (value === 'NUEVA') {
      setIsAddingPet(true);
    } else {
      setIsAddingPet(false);
      setFormData({ ...formData, mascotaId: value });
    }
  };

  const handleCrearMascotaYAsignar = (e) => {
    e.preventDefault();
    if (!nuevaMascota.nombre.trim()) return;

    const petCreada = {
      id: Date.now(),
      nombre: nuevaMascota.nombre,
      especie: nuevaMascota.especie
    };

    setMisMascotas([...misMascotas, petCreada]);
    setFormData({ ...formData, mascotaId: String(petCreada.id) });
    setIsAddingPet(false);
    setNuevaMascota({ nombre: '', especie: 'Perro', raza: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const mascotaSeleccionada = misMascotas.find(m => String(m.id) === String(formData.mascotaId))?.nombre || 'Mascota';

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6">
      <div className="w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl p-5 text-white flex flex-col justify-between overflow-y-auto">
        
        <div>
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => navigate('/home')} className="text-sm font-semibold flex items-center gap-1 hover:underline">
              ‹ Back
            </button>
            <h2 className="font-bold text-lg">Pedir Cita</h2>
            <div className="w-6"></div>
          </div>

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
                className="w-full bg-[#129b9b] text-white py-2.5 rounded-full font-bold text-xs hover:bg-[#0e7e7e] transition-colors"
              >
                Solicitar otro turno
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Selector de Mascota */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-cyan-100">Seleccionar Mascota</label>
                <select 
                  value={isAddingPet ? 'NUEVA' : formData.mascotaId}
                  onChange={handleMascotaChange}
                  className="w-full bg-white text-gray-800 rounded-xl p-3 text-xs font-medium focus:outline-none border-0"
                >
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
                    placeholder="Nombre de la mascota"
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
                      onClick={handleCrearMascotaYAsignar}
                      className="bg-[#f1adb6] text-white font-bold rounded-lg px-2 py-1"
                    >
                      Guardar y Elegir
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

              {/* Fecha (Validada: min={today}) y Hora (Validada: 09:00 a 20:00) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-cyan-100">Fecha</label>
                  <input 
                    type="date"
                    required
                    min={today} /* Previene fechas pasadas */
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
                    min="09:00" /* Horario mínimo */
                    max="20:00" /* Horario máximo */
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    className="w-full bg-white text-gray-800 rounded-xl p-3 text-xs font-medium focus:outline-none border-0"
                  />
                </div>
              </div>

              {/* Descripción de la visita */}
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
                disabled={isAddingPet}
                className="w-full bg-[#f1adb6] hover:bg-[#e89ca6] disabled:bg-gray-400 text-white font-bold py-3.5 rounded-full shadow-lg text-xs tracking-wider transition-transform active:scale-95 mt-2"
              >
                CONFIRMAR CITA
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TurnosPage;