import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PetsPage = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'cliente';
  const clientName = localStorage.getItem('clientName') || 'Cliente';
  const currentClientId = localStorage.getItem('clientId') || 'VET-1001';

  const [selectedPet, setSelectedPet] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showAddModal, setShowAddModal] = useState(false);

  // Mascotas asociadas a códigos de cliente únicos
  const [allPets, setAllPets] = useState([
    { 
      id: 1, 
      ownerId: 'VET-1001',
      ownerName: 'Vicky Pérez',
      name: 'Nefer', 
      chip: '98514100998', 
      birth: '15/05/2019', 
      age: '2', 
      species: 'Gato', 
      breed: 'Gato Carey', 
      sex: 'Hembra', 
      sterilized: 'Sí', 
      peso: '3.8 kg',
      descripcion: 'Felino mestizo Carey en excelente estado.',
      historial: [{ fecha: '12/10/2026', tipo: 'Vacunación Triple Felina', vet: 'Dra. Silva', nota: 'Sin reacciones.' }],
      tratamientos: [{ medicamento: 'Pipeta Antipulgas', dosis: '1 mensual', estado: 'Activo' }],
      img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400' 
    },
    { 
      id: 2, 
      ownerId: 'VET-1001',
      ownerName: 'Vicky Pérez',
      name: 'Currito', 
      chip: '98514100223', 
      birth: '10/01/2021', 
      age: '1', 
      species: 'Gato', 
      breed: 'Común Europeo', 
      sex: 'Macho', 
      sterilized: 'No', 
      peso: '4.2 kg',
      descripcion: 'Gato muy activo.',
      historial: [],
      tratamientos: [],
      img: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=400' 
    },
    { 
      id: 3, 
      ownerId: 'VET-2002',
      ownerName: 'Juan Gómez',
      name: 'Firulais', 
      chip: '98514100777', 
      birth: '01/02/2022', 
      age: '3', 
      species: 'Perro', 
      breed: 'Golden Retriever', 
      sex: 'Macho', 
      sterilized: 'Sí', 
      peso: '28.0 kg',
      descripcion: 'Mascota de Juan Gómez.',
      historial: [],
      tratamientos: [],
      img: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400' 
    }
  ]);

  // Si es Cliente -> Muestra únicamente SUS mascotas. Si es Veterinario -> Muestra todas.
  const myPets = role === 'veterinario' 
    ? allPets 
    : allPets.filter(pet => pet.ownerId === currentClientId);

  const [newPet, setNewPet] = useState({ name: '', species: 'Perro', breed: '', age: '' });

  // Funciones de validación de solo letras
  const handleOnlyLetters = (text, setter) => {
    // Permite letras (con acentos), espacios y la letra ñ
    const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    setter(filteredText);
  };

  const handleCreatePet = (e) => {
    e.preventDefault();
    if (!newPet.name.trim() || !newPet.breed.trim() || !newPet.species) {
      alert('Por favor completá los campos obligatorios (*)');
      return;
    }

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
      historial: [],
      tratamientos: [],
      img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400'
    };

    setAllPets([...allPets, created]);
    setShowAddModal(false);
    setNewPet({ name: '', species: 'Perro', breed: '', age: '' });
  };

  if (selectedPet) {
    return (
      <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6">
        <div className="w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl text-white flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="relative h-48 w-full">
              <img src={selectedPet.img} alt={selectedPet.name} className="w-full h-full object-cover" />
              <button 
                onClick={() => setSelectedPet(null)}
                className="absolute top-4 left-4 bg-white/80 text-[#129b9b] w-9 h-9 rounded-full font-bold flex items-center justify-center shadow hover:bg-white"
              >
                ←
              </button>
              <span className="absolute bottom-3 right-4 bg-[#62c4c4] px-4 py-1 rounded-full text-xs font-semibold shadow">
                {selectedPet.name} 🐾
              </span>
            </div>

            <div className="flex border-b border-white/20 bg-[#0e7e7e]">
              <button onClick={() => setActiveTab('info')} className={`flex-1 py-2.5 text-xs font-bold ${activeTab === 'info' ? 'bg-white text-[#129b9b]' : 'text-white'}`}>Información</button>
              <button onClick={() => setActiveTab('historial')} className={`flex-1 py-2.5 text-xs font-bold ${activeTab === 'historial' ? 'bg-white text-[#129b9b]' : 'text-white'}`}>Historial</button>
              <button onClick={() => setActiveTab('tratamientos')} className={`flex-1 py-2.5 text-xs font-bold ${activeTab === 'tratamientos' ? 'bg-white text-[#129b9b]' : 'text-white'}`}>Tratamientos</button>
            </div>

            <div className="p-4">
              {activeTab === 'info' && (
                <div className="space-y-3">
                  <div className="bg-white text-gray-800 p-4 rounded-2xl shadow-md text-xs space-y-2">
                    <h3 className="text-[#129b9b] font-bold text-center text-sm mb-2">Ficha de Identificación</h3>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-gray-400">Dueño / Código:</span>
                      <span className="font-bold text-[#129b9b]">{selectedPet.ownerName} ({selectedPet.ownerId})</span>
                    </div>
                    <div className="flex justify-between border-b pb-1"><span className="text-gray-400">Nº de chip:</span><span className="font-semibold">{selectedPet.chip}</span></div>
                    <div className="flex justify-between border-b pb-1"><span className="text-gray-400">Especie / Raza:</span><span className="font-semibold">{selectedPet.species} - {selectedPet.breed}</span></div>
                    <div className="flex justify-between border-b pb-1"><span className="text-gray-400">Edad:</span><span className="font-semibold">{selectedPet.age}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Peso:</span><span className="font-semibold text-green-600">{selectedPet.peso}</span></div>
                  </div>
                  <div className="bg-white text-gray-800 p-4 rounded-2xl shadow-md">
                    <h4 className="text-xs font-bold text-gray-500 mb-1">Descripción & Observaciones</h4>
                    <p className="text-xs text-gray-700">{selectedPet.descripcion}</p>
                  </div>
                </div>
              )}

              {activeTab === 'historial' && (
                <div className="space-y-2">
                  {selectedPet.historial.length > 0 ? (
                    selectedPet.historial.map((h, idx) => (
                      <div key={idx} className="bg-white text-gray-800 p-3 rounded-2xl shadow-md text-xs">
                        <p className="font-bold text-[#129b9b]">{h.tipo} - {h.fecha}</p>
                        <p className="text-gray-500">{h.nota}</p>
                      </div>
                    ))
                  ) : <div className="bg-white text-gray-500 p-4 rounded-2xl text-center text-xs">Sin registros médicos aún.</div>}
                </div>
              )}

              {activeTab === 'tratamientos' && (
                <div className="space-y-2">
                  {selectedPet.tratamientos.length > 0 ? (
                    selectedPet.tratamientos.map((t, idx) => (
                      <div key={idx} className="bg-white text-gray-800 p-3 rounded-2xl shadow-md text-xs flex justify-between">
                        <div>
                          <p className="font-bold text-[#129b9b]">{t.medicamento}</p>
                          <p className="text-gray-500">{t.dosis}</p>
                        </div>
                        <span className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full text-[10px]">{t.estado}</span>
                      </div>
                    ))
                  ) : <div className="bg-white text-gray-500 p-4 rounded-2xl text-center text-xs">Sin tratamientos activos.</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6">
      <div className="w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl p-5 text-white flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => navigate('/home')} className="text-sm font-semibold hover:underline">‹ Back</button>
            <div className="text-center">
              <h2 className="font-bold text-lg">Mascotas ({myPets.length})</h2>
              {role === 'cliente' && <p className="text-[10px] text-cyan-200 font-mono">{clientName} ({currentClientId})</p>}
              {role === 'veterinario' && <p className="text-[10px] text-yellow-300 font-bold">Vista Global (Admin)</p>}
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

        {/* Modal de Registro con Validaciones de Letras y Números */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white text-gray-800 p-5 rounded-3xl w-full max-w-xs space-y-3 shadow-2xl relative">
              <h3 className="font-bold text-[#129b9b] text-center text-base">Registrar Mascota</h3>
              
              <form onSubmit={handleCreatePet} className="space-y-2.5 text-xs">
                {/* Nombre (Solo Letras) */}
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

                {/* Tipo de Animal / Especie (Obligatorio) */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Tipo de animal *</label>
                  <select 
                    required
                    value={newPet.species}
                    onChange={(e) => setNewPet({ ...newPet, species: e.target.value })}
                    className="w-full border border-gray-200 p-2.5 rounded-xl bg-white focus:outline-none focus:border-[#129b9b]"
                  >
                    <option value="Perro">Perro 🐶</option>
                    <option value="Gato">Gato 🐱</option>
                    <option value="Ave">Ave 🦜</option>
                    <option value="Conejo">Conejo 🐰</option>
                    <option value="Otro">Otro 🐾</option>
                  </select>
                </div>

                {/* Raza (Solo Letras) */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Raza *</label>
                  <input 
                    type="text"
                    placeholder="Ej: Carey, Caniche, Mestizo" 
                    required
                    value={newPet.breed}
                    onChange={(e) => handleOnlyLetters(e.target.value, (val) => setNewPet({ ...newPet, breed: val }))}
                    className="w-full border border-gray-200 p-2.5 rounded-xl focus:outline-none focus:border-[#129b9b]"
                  />
                </div>

                {/* Edad (Solo Números) */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Edad (en años)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="30"
                    placeholder="Ej: 2" 
                    value={newPet.age}
                    onChange={(e) => setNewPet({ ...newPet, age: e.target.value })}
                    className="w-full border border-gray-200 p-2.5 rounded-xl focus:outline-none focus:border-[#129b9b]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-xl font-bold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="w-1/2 bg-[#129b9b] hover:bg-[#0d7878] text-white py-2.5 rounded-xl font-bold shadow"
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