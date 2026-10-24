import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PetsPage = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'cliente';
  const clientName = localStorage.getItem('clientName') || 'Cliente';
  const currentClientId = localStorage.getItem('clientId') || 'VET-1001';

  // Control de token expirado en 10 min
  useEffect(() => {
    const expiration = localStorage.getItem('token_expiration');
    if (!expiration || Date.now() > parseInt(expiration, 10)) {
      alert('Tu sesión ha expirado (límite de 10 minutos). Por favor ingresá nuevamente.');
      localStorage.clear();
      navigate('/login');
    }
  }, [navigate]);

  const [selectedPet, setSelectedPet] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // Estados para modales de nuevo historial y tratamiento
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [showTratamientoModal, setShowTratamientoModal] = useState(false);

  // Base de datos persistente de mascotas
  const [allPets, setAllPets] = useState(() => {
    const guardadas = localStorage.getItem('pets_db');
    if (guardadas) return JSON.parse(guardadas);

    return [
      { 
        id: 1, 
        ownerId: 'VET-1001',
        ownerName: 'Vicky Pérez',
        name: 'Nefer', 
        chip: '98514100998', 
        birth: '15/05/2019', 
        age: '2 años', 
        species: 'Gato', 
        breed: 'Gato Carey', 
        sex: 'Hembra', 
        sterilized: 'Sí', 
        peso: '3.8 kg',
        descripcion: 'Felino mestizo Carey en excelente estado.',
        ultimaModificacion: '24/10/2026, 14:30 hs',
        historial: [
          { fecha: '12/10/2026, 10:15 hs', tipo: 'Vacunación Triple Felina', vet: 'Dra. Silva', nota: 'Aplicación sin reacciones adversas.' }
        ],
        tratamientos: [
          { medicamento: 'Pipeta Antipulgas', dosis: '1 mensual', estado: 'Activo', fechaRegistro: '12/10/2026, 10:20 hs', vet: 'Dra. Silva' }
        ],
        img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400' 
      },
      { 
        id: 2, 
        ownerId: 'VET-1001',
        ownerName: 'Vicky Pérez',
        name: 'Currito', 
        chip: '98514100223', 
        birth: '10/01/2021', 
        age: '1 año', 
        species: 'Gato', 
        breed: 'Común Europeo', 
        sex: 'Macho', 
        sterilized: 'No', 
        peso: '4.2 kg',
        descripcion: 'Gato muy activo.',
        ultimaModificacion: '20/10/2026, 11:00 hs',
        historial: [],
        tratamientos: [],
        img: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=400' 
      }
    ];
  });

  // Guardado persistente
  const guardarMascotas = (nuevasMascotas) => {
    setAllPets(nuevasMascotas);
    localStorage.setItem('pets_db', JSON.stringify(nuevasMascotas));
  };

  // Filtrado por rol
  const myPets = role === 'veterinario' 
    ? allPets 
    : allPets.filter(pet => pet.ownerId === currentClientId);

  // Estados de formularios
  const [newPet, setNewPet] = useState({ name: '', species: 'Perro', breed: '', age: '' });
  const [editFormData, setEditFormData] = useState({ name: '', breed: '', age: '' });

  const [newHistorial, setNewHistorial] = useState({ tipo: 'Consulta General', vet: clientName, nota: '' });
  const [newTratamiento, setNewTratamiento] = useState({ medicamento: '', dosis: '', vet: clientName });

  const handleOnlyLetters = (text, setter) => {
    const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    setter(filteredText);
  };

  // Función de obtención de fecha y hora actual formateada
  const getFechaHoraActual = () => {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-AR');
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    return `${fecha}, ${horas}:${minutos} hs`;
  };

  // 1. Guardar cambios en la edición básica (Nombre, Raza, Edad)
  const handleSaveInfoEdit = (e) => {
    e.preventDefault();
    if (!editFormData.name.trim() || !editFormData.breed.trim()) {
      alert('Nombre y Raza son obligatorios.');
      return;
    }

    const fechaHoy = getFechaHoraActual();
    const actualizadas = allPets.map(p => {
      if (p.id === selectedPet.id) {
        return {
          ...p,
          name: editFormData.name.trim(),
          breed: editFormData.breed.trim(),
          age: editFormData.age ? `${editFormData.age} años` : p.age,
          ultimaModificacion: fechaHoy
        };
      }
      return p;
    });

    guardarMascotas(actualizadas);
    setSelectedPet(actualizadas.find(p => p.id === selectedPet.id));
    setIsEditingInfo(false);
  };

  // 2. Agregar nueva entrada al Historial Médico
  const handleAddHistorial = (e) => {
    e.preventDefault();
    if (!newHistorial.vet.trim() || !newHistorial.nota.trim()) {
      alert('Debés ingresar el Nombre del Veterinario y el Detalle de la consulta.');
      return;
    }

    const fechaHoy = getFechaHoraActual();
    const nuevaEntrada = {
      fecha: fechaHoy,
      tipo: newHistorial.tipo,
      vet: newHistorial.vet.trim(),
      nota: newHistorial.nota.trim()
    };

    const actualizadas = allPets.map(p => {
      if (p.id === selectedPet.id) {
        return {
          ...p,
          ultimaModificacion: fechaHoy,
          historial: [nuevaEntrada, ...p.historial]
        };
      }
      return p;
    });

    guardarMascotas(actualizadas);
    setSelectedPet(actualizadas.find(p => p.id === selectedPet.id));
    setShowHistorialModal(false);
    setNewHistorial({ tipo: 'Consulta General', vet: clientName, nota: '' });
  };

  // 3. Agregar nuevo Tratamiento
  const handleAddTratamiento = (e) => {
    e.preventDefault();
    if (!newTratamiento.vet.trim() || !newTratamiento.medicamento.trim()) {
      alert('Debés ingresar el Nombre del Veterinario y el Medicamento.');
      return;
    }

    const fechaHoy = getFechaHoraActual();
    const nuevoTrat = {
      medicamento: newTratamiento.medicamento.trim(),
      dosis: newTratamiento.dosis.trim() || 'Según indicación',
      estado: 'Activo',
      fechaRegistro: fechaHoy,
      vet: newTratamiento.vet.trim()
    };

    const actualizadas = allPets.map(p => {
      if (p.id === selectedPet.id) {
        return {
          ...p,
          ultimaModificacion: fechaHoy,
          tratamientos: [nuevoTrat, ...p.tratamientos]
        };
      }
      return p;
    });

    guardarMascotas(actualizadas);
    setSelectedPet(actualizadas.find(p => p.id === selectedPet.id));
    setShowTratamientoModal(false);
    setNewTratamiento({ medicamento: '', dosis: '', vet: clientName });
  };

  // 4. Crear nueva mascota desde cliente o veterinario
  const handleCreatePet = (e) => {
    e.preventDefault();
    if (!newPet.name.trim() || !newPet.breed.trim()) {
      alert('Por favor completá los campos obligatorios (*)');
      return;
    }

    const fechaHoy = getFechaHoraActual();
    const created = {
      id: Date.now(),
      ownerId: currentClientId,
      ownerName: clientName,
      name: newPet.name.trim(),
      chip: `PEND-${Math.floor(1000 + Math.random() * 9000)}`,
      birth: 'Reciente',
      age: newPet.age ? `${newPet.age} años` : 'Desconocida',
      species: newPet.species,
      breed: newPet.breed.trim(),
      sex: 'Por definir',
      sterilized: 'No',
      peso: 'Sin registrar',
      descripcion: `Registrada por ${clientName} (${currentClientId}).`,
      ultimaModificacion: fechaHoy,
      historial: [],
      tratamientos: [],
      img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400'
    };

    guardarMascotas([...allPets, created]);
    setShowAddModal(false);
    setNewPet({ name: '', species: 'Perro', breed: '', age: '' });
  };

  // Vista de Detalle de Ficha
  if (selectedPet) {
    return (
      <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6">
        <div className="w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl text-white flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="relative h-48 w-full">
              <img src={selectedPet.img} alt={selectedPet.name} className="w-full h-full object-cover" />
              <button 
                onClick={() => { setSelectedPet(null); setIsEditingInfo(false); }}
                className="absolute top-4 left-4 bg-white/80 text-[#129b9b] w-9 h-9 rounded-full font-bold flex items-center justify-center shadow hover:bg-white"
              >
                ←
              </button>
              <span className="absolute bottom-3 right-4 bg-[#62c4c4] px-4 py-1 rounded-full text-xs font-semibold shadow">
                {selectedPet.name} 🐾
              </span>
            </div>

            {/* Pestañas de navegación */}
            <div className="flex border-b border-white/20 bg-[#0e7e7e]">
              <button onClick={() => setActiveTab('info')} className={`flex-1 py-2.5 text-xs font-bold ${activeTab === 'info' ? 'bg-white text-[#129b9b]' : 'text-white'}`}>Información</button>
              <button onClick={() => setActiveTab('historial')} className={`flex-1 py-2.5 text-xs font-bold ${activeTab === 'historial' ? 'bg-white text-[#129b9b]' : 'text-white'}`}>Historial</button>
              <button onClick={() => setActiveTab('tratamientos')} className={`flex-1 py-2.5 text-xs font-bold ${activeTab === 'tratamientos' ? 'bg-white text-[#129b9b]' : 'text-white'}`}>Tratamientos</button>
            </div>

            <div className="p-4">
              {/* PESTAÑA INFORMACIÓN */}
              {activeTab === 'info' && (
                <div className="space-y-3">
                  <div className="bg-white text-gray-800 p-4 rounded-2xl shadow-md text-xs space-y-2">
                    <div className="flex justify-between items-center mb-2 border-b pb-2">
                      <h3 className="text-[#129b9b] font-bold text-sm">Ficha de Identificación</h3>
                      
                      {/* Botón de Edición Exclusivo Veterinario */}
                      {role === 'veterinario' && !isEditingInfo && (
                        <button 
                          onClick={() => {
                            setEditFormData({
                              name: selectedPet.name,
                              breed: selectedPet.breed,
                              age: parseInt(selectedPet.age) || ''
                            });
                            setIsEditingInfo(true);
                          }}
                          className="bg-cyan-100 hover:bg-cyan-200 text-[#129b9b] font-bold px-2.5 py-1 rounded-lg text-[10px]"
                        >
                          ✏️ Editar Ficha
                        </button>
                      )}
                    </div>

                    {isEditingInfo ? (
                      /* Formulario de Edición de Nombre, Raza y Edad */
                      <form onSubmit={handleSaveInfoEdit} className="space-y-2 bg-cyan-50 p-3 rounded-xl border border-cyan-200 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Nombre *</label>
                          <input 
                            type="text" 
                            required
                            value={editFormData.name}
                            onChange={(e) => handleOnlyLetters(e.target.value, (v) => setEditFormData({ ...editFormData, name: v }))}
                            className="w-full bg-white p-2 rounded-lg border border-gray-200"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Raza *</label>
                          <input 
                            type="text" 
                            required
                            value={editFormData.breed}
                            onChange={(e) => handleOnlyLetters(e.target.value, (v) => setEditFormData({ ...editFormData, breed: v }))}
                            className="w-full bg-white p-2 rounded-lg border border-gray-200"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Edad (en años)</label>
                          <input 
                            type="number" 
                            min="0"
                            value={editFormData.age}
                            onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                            className="w-full bg-white p-2 rounded-lg border border-gray-200"
                          />
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button 
                            type="button" 
                            onClick={() => setIsEditingInfo(false)}
                            className="w-1/2 bg-gray-200 text-gray-700 py-1.5 rounded-lg font-bold"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit" 
                            className="w-1/2 bg-[#129b9b] text-white py-1.5 rounded-lg font-bold shadow"
                          >
                            Guardar
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Vista de Solo Lectura */
                      <>
                        <div className="flex justify-between border-b pb-1"><span className="text-gray-400">Dueño / Código:</span><span className="font-bold text-[#129b9b]">{selectedPet.ownerName} ({selectedPet.ownerId})</span></div>
                        <div className="flex justify-between border-b pb-1"><span className="text-gray-400">Nombre:</span><span className="font-bold text-gray-800">{selectedPet.name}</span></div>
                        <div className="flex justify-between border-b pb-1"><span className="text-gray-400">Especie / Raza:</span><span className="font-semibold">{selectedPet.species} - {selectedPet.breed}</span></div>
                        <div className="flex justify-between border-b pb-1"><span className="text-gray-400">Edad:</span><span className="font-semibold">{selectedPet.age}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Nº de chip:</span><span className="font-semibold">{selectedPet.chip}</span></div>
                      </>
                    )}

                    <div className="pt-2 text-[10px] text-gray-400 border-t flex justify-between">
                      <span>Última modificación:</span>
                      <span className="font-mono font-bold text-gray-600">{selectedPet.ultimaModificacion || 'Sin cambios'}</span>
                    </div>
                  </div>

                  <div className="bg-white text-gray-800 p-4 rounded-2xl shadow-md">
                    <h4 className="text-xs font-bold text-gray-500 mb-1">Descripción & Diagnóstico General</h4>
                    <p className="text-xs text-gray-700">{selectedPet.descripcion}</p>
                  </div>
                </div>
              )}

              {/* PESTAÑA HISTORIAL CLINICO */}
              {activeTab === 'historial' && (
                <div className="space-y-3">
                  {role === 'veterinario' && (
                    <button 
                      onClick={() => setShowHistorialModal(true)}
                      className="w-full bg-white hover:bg-gray-50 text-[#129b9b] font-bold py-2.5 rounded-2xl shadow text-xs border border-cyan-100 flex items-center justify-center gap-1"
                    >
                      <span>➕</span> Agregar Registro / Nota Clínica
                    </button>
                  )}

                  {selectedPet.historial.length > 0 ? (
                    selectedPet.historial.map((h, idx) => (
                      <div key={idx} className="bg-white text-gray-800 p-3.5 rounded-2xl shadow-md text-xs space-y-1">
                        <div className="flex justify-between text-[#129b9b] font-bold border-b pb-1">
                          <span>{h.tipo}</span>
                          <span className="text-gray-400 text-[10px] font-mono font-normal">{h.fecha}</span>
                        </div>
                        <p className="text-gray-700 pt-1"><strong>Vet a cargo:</strong> {h.vet}</p>
                        <p className="text-gray-600 italic bg-gray-50 p-2 rounded-lg border border-gray-100">"{h.nota}"</p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white text-gray-500 p-4 rounded-2xl text-center text-xs">Sin registros de consulta médica aún.</div>
                  )}
                </div>
              )}

              {/* PESTAÑA TRATAMIENTOS */}
              {activeTab === 'tratamientos' && (
                <div className="space-y-3">
                  {role === 'veterinario' && (
                    <button 
                      onClick={() => setShowTratamientoModal(true)}
                      className="w-full bg-white hover:bg-gray-50 text-[#129b9b] font-bold py-2.5 rounded-2xl shadow text-xs border border-cyan-100 flex items-center justify-center gap-1"
                    >
                      <span>💊</span> Prescribir Tratamiento
                    </button>
                  )}

                  {selectedPet.tratamientos.length > 0 ? (
                    selectedPet.tratamientos.map((t, idx) => (
                      <div key={idx} className="bg-white text-gray-800 p-3.5 rounded-2xl shadow-md text-xs space-y-1">
                        <div className="flex justify-between items-center border-b pb-1">
                          <p className="font-bold text-[#129b9b]">{t.medicamento}</p>
                          <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full text-[10px]">{t.estado}</span>
                        </div>
                        <p className="text-gray-600"><strong>Dosis / Indicación:</strong> {t.dosis}</p>
                        <div className="flex justify-between text-[10px] text-gray-400 pt-1">
                          <span>Prescripto por: <strong>{t.vet}</strong></span>
                          <span className="font-mono">{t.fechaRegistro}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white text-gray-500 p-4 rounded-2xl text-center text-xs">Sin tratamientos activos asignados.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal 1: Agregar Nota al Historial */}
        {showHistorialModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white text-gray-800 p-5 rounded-3xl w-full max-w-xs space-y-3 shadow-2xl relative">
              <h3 className="font-bold text-[#129b9b] text-center text-base">Nueva Consulta / Nota</h3>
              
              <form onSubmit={handleAddHistorial} className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Veterinario Atendió *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej: Dra. Silva"
                    value={newHistorial.vet}
                    onChange={(e) => setNewHistorial({ ...newHistorial, vet: e.target.value })}
                    className="w-full border border-gray-200 p-2.5 rounded-xl font-medium focus:outline-none focus:border-[#129b9b]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Tipo de Atención</label>
                  <select 
                    value={newHistorial.tipo}
                    onChange={(e) => setNewHistorial({ ...newHistorial, tipo: e.target.value })}
                    className="w-full border border-gray-200 p-2.5 rounded-xl bg-white focus:outline-none"
                  >
                    <option value="Consulta General">Consulta General 🩺</option>
                    <option value="Control de Síntomas">Control de Síntomas 🤒</option>
                    <option value="Vacunación">Vacunación 💉</option>
                    <option value="Urgencia Clinica">Urgencia Clínica 🚨</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Detalle / Síntomas y Diagnóstico *</label>
                  <textarea 
                    rows="3"
                    required
                    placeholder="Ej: Presenta episodios de vómitos. Se indica hidratación y reposo alimentario..."
                    value={newHistorial.nota}
                    onChange={(e) => setNewHistorial({ ...newHistorial, nota: e.target.value })}
                    className="w-full border border-gray-200 p-2.5 rounded-xl focus:outline-none resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-2 pt-1">
                  <button 
                    type="button" 
                    onClick={() => setShowHistorialModal(false)}
                    className="w-1/2 bg-gray-100 text-gray-600 py-2 rounded-xl font-bold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="w-1/2 bg-[#129b9b] text-white py-2 rounded-xl font-bold shadow"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Prescribir Tratamiento */}
        {showTratamientoModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white text-gray-800 p-5 rounded-3xl w-full max-w-xs space-y-3 shadow-2xl relative">
              <h3 className="font-bold text-[#129b9b] text-center text-base">Nuevo Tratamiento</h3>
              
              <form onSubmit={handleAddTratamiento} className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Veterinario Prescriptor *</label>
                  <input 
                    type="text" 
                    required
                    value={newTratamiento.vet}
                    onChange={(e) => setNewTratamiento({ ...newTratamiento, vet: e.target.value })}
                    className="w-full border border-gray-200 p-2.5 rounded-xl font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Medicamento / Solución *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej: Antiemético / Gotas digestivas"
                    value={newTratamiento.medicamento}
                    onChange={(e) => setNewTratamiento({ ...newTratamiento, medicamento: e.target.value })}
                    className="w-full border border-gray-200 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Dosis y Frecuencia</label>
                  <input 
                    type="text" 
                    placeholder="Ej: 5 gotas cada 8 horas por 3 días"
                    value={newTratamiento.dosis}
                    onChange={(e) => setNewTratamiento({ ...newTratamiento, dosis: e.target.value })}
                    className="w-full border border-gray-200 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button 
                    type="button" 
                    onClick={() => setShowTratamientoModal(false)}
                    className="w-1/2 bg-gray-100 text-gray-600 py-2 rounded-xl font-bold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="w-1/2 bg-[#129b9b] text-white py-2 rounded-xl font-bold shadow"
                  >
                    Prescribir
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Listado general de Mascotas
  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6">
      <div className="w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl p-5 text-white flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => navigate('/home')} className="text-sm font-semibold hover:underline">‹ Back</button>
            <div className="text-center">
              <h2 className="font-bold text-lg">Mascotas ({myPets.length})</h2>
              {role === 'cliente' && <p className="text-[10px] text-cyan-200 font-mono">{clientName} ({currentClientId})</p>}
              {role === 'veterinario' && <p className="text-[10px] text-yellow-300 font-bold">Vista Global (Staff)</p>}
            </div>
            <div className="w-6"></div>
          </div>

          <div className="space-y-3">
            {myPets.length > 0 ? (
              myPets.map((pet) => (
                <div 
                  key={pet.id} 
                  onClick={() => setSelectedPet(pet)}
                  className="bg-[#62c4c4] p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-[#5bb8b8] shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-base">{pet.name}</p>
                      {role === 'veterinario' && (
                        <span className="text-[9px] bg-white text-[#129b9b] font-bold px-1.5 py-0.5 rounded">
                          {pet.ownerName} ({pet.ownerId})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-cyan-100">{pet.species} • {pet.breed}</p>
                  </div>
                  <div className="w-16 h-14 rounded-xl overflow-hidden border-2 border-white/50">
                    <img src={pet.img} alt={pet.name} className="w-full h-full object-cover" />
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white/10 p-6 rounded-2xl text-center text-xs">
                No tienes mascotas registradas aún bajo el código {currentClientId}.
              </div>
            )}

            <div 
              onClick={() => setShowAddModal(true)}
              className="bg-[#62c4c4] p-4 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-[#5bb8b8] border-2 border-dashed border-white/40 transition-all"
            >
              <span className="text-sm font-bold text-white">+ Agregar Nueva Mascota</span>
            </div>
          </div>
        </div>

        {/* Modal Registro de Nueva Mascota */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white text-gray-800 p-5 rounded-3xl w-full max-w-xs space-y-3 shadow-2xl relative">
              <h3 className="font-bold text-[#129b9b] text-center text-base">Registrar Mascota</h3>
              
              <form onSubmit={handleCreatePet} className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Nombre de la mascota *</label>
                  <input 
                    type="text"
                    placeholder="Ej: Nefer" 
                    required
                    value={newPet.name}
                    onChange={(e) => handleOnlyLetters(e.target.value, (val) => setNewPet({ ...newPet, name: val }))}
                    className="w-full border border-gray-200 p-2.5 rounded-xl focus:outline-none focus:border-[#129b9b]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Tipo de animal *</label>
                  <select 
                    required
                    value={newPet.species}
                    onChange={(e) => setNewPet({ ...newPet, species: e.target.value })}
                    className="w-full border border-gray-200 p-2.5 rounded-xl bg-white focus:outline-none"
                  >
                    <option value="Perro">Perro 🐶</option>
                    <option value="Gato">Gato 🐱</option>
                    <option value="Ave">Ave 🦜</option>
                    <option value="Conejo">Conejo 🐰</option>
                    <option value="Otro">Otro 🐾</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Raza *</label>
                  <input 
                    type="text"
                    placeholder="Ej: Carey, Caniche" 
                    required
                    value={newPet.breed}
                    onChange={(e) => handleOnlyLetters(e.target.value, (val) => setNewPet({ ...newPet, breed: val }))}
                    className="w-full border border-gray-200 p-2.5 rounded-xl focus:outline-none focus:border-[#129b9b]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Edad (en años)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="Ej: 2" 
                    value={newPet.age}
                    onChange={(e) => setNewPet({ ...newPet, age: e.target.value })}
                    className="w-full border border-gray-200 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="w-1/2 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-bold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="w-1/2 bg-[#129b9b] text-white py-2.5 rounded-xl font-bold shadow"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetsPage;