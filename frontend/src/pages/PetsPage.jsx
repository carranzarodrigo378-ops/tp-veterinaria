import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PetsPage = () => {
  const navigate = useNavigate();
  const [selectedPet, setSelectedPet] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'historial', 'tratamientos'

  const pets = [
    { 
      id: 1, 
      name: 'Nefer', 
      chip: '98514100998', 
      birth: '15/05/2019', 
      age: '2 años', 
      species: 'Gato', 
      breed: 'Gato Carey', 
      sex: 'Hembra', 
      sterilized: 'Sí', 
      peso: '3.8 kg',
      descripcion: 'Felino mestizo Carey en excelente estado de salud general. Comportamiento dócil en consulta.',
      historial: [
        { fecha: '12/10/2026', tipo: 'Vacunación Triple Felina', vet: 'Dra. Silva', nota: 'Aplicación sin reacciones adversas.' },
        { fecha: '05/03/2026', tipo: 'Control Anual', vet: 'Dr. Pérez', nota: 'Auscultación normal, dentadura limpia.' },
      ],
      tratamientos: [
        { medicamento: 'Pipeta Antipulgas', dosis: '1 pipeta mensual', estado: 'Activo' },
      ],
      img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400' 
    },
    { 
      id: 2, 
      name: 'Currito', 
      chip: '98514100223', 
      birth: '10/01/2021', 
      age: '1 año', 
      species: 'Gato', 
      breed: 'Común Europeo', 
      sex: 'Macho', 
      sterilized: 'No', 
      peso: '4.2 kg',
      descripcion: 'Gato joven muy activo. Presenta ligero sarro en premolares superiores.',
      historial: [
        { fecha: '20/08/2026', tipo: 'Desparasitación Interna', vet: 'Dra. Silva', nota: 'Comprimido administrado en clínica.' },
      ],
      tratamientos: [],
      img: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=400' 
    },
  ];

  if (selectedPet) {
    return (
      <div className="min-h-screen bg-[#0d7373] flex items-center justify-center p-0 md:p-6">
        <div className="w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl text-white flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Foto e Identificación */}
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

            {/* Pestañas de Navegación dentro de la Ficha */}
            <div className="flex border-b border-white/20 bg-[#0e7e7e]">
              <button 
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-2.5 text-xs font-bold ${activeTab === 'info' ? 'bg-white text-[#129b9b]' : 'text-white'}`}
              >
                Información
              </button>
              <button 
                onClick={() => setActiveTab('historial')}
                className={`flex-1 py-2.5 text-xs font-bold ${activeTab === 'historial' ? 'bg-white text-[#129b9b]' : 'text-white'}`}
              >
                Historial
              </button>
              <button 
                onClick={() => setActiveTab('tratamientos')}
                className={`flex-1 py-2.5 text-xs font-bold ${activeTab === 'tratamientos' ? 'bg-white text-[#129b9b]' : 'text-white'}`}
              >
                Tratamientos
              </button>
            </div>

            {/* Contenido según la Pestaña */}
            <div className="p-4">
              {activeTab === 'info' && (
                <div className="space-y-3">
                  <div className="bg-white text-gray-800 p-4 rounded-2xl shadow-md">
                    <h3 className="text-[#129b9b] font-bold text-center text-sm mb-3">Ficha de Identificación</h3>
                    <div className="text-xs space-y-2">
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-gray-400">Nº de chip:</span>
                        <span className="font-semibold">{selectedPet.chip}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-gray-400">Especie / Raza:</span>
                        <span className="font-semibold">{selectedPet.species} - {selectedPet.breed}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-gray-400">Nacimiento / Edad:</span>
                        <span className="font-semibold">{selectedPet.birth} ({selectedPet.age})</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-gray-400">Sexo / Castrado:</span>
                        <span className="font-semibold">{selectedPet.sex} | Steril: {selectedPet.sterilized}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Peso actual:</span>
                        <span className="font-semibold text-green-600">{selectedPet.peso}</span>
                      </div>
                    </div>
                  </div>

                  {/* Descripción Médica */}
                  <div className="bg-white text-gray-800 p-4 rounded-2xl shadow-md">
                    <h4 className="text-xs font-bold text-gray-500 mb-1">Descripción & Observaciones</h4>
                    <p className="text-xs text-gray-700 leading-relaxed">{selectedPet.descripcion}</p>
                  </div>
                </div>
              )}

              {activeTab === 'historial' && (
                <div className="space-y-3">
                  {selectedPet.historial.map((h, idx) => (
                    <div key={idx} className="bg-white text-gray-800 p-3.5 rounded-2xl shadow-md text-xs space-y-1">
                      <div className="flex justify-between text-[#129b9b] font-bold">
                        <span>{h.tipo}</span>
                        <span className="text-gray-400 font-normal">{h.fecha}</span>
                      </div>
                      <p className="text-gray-600"><strong>Vet:</strong> {h.vet}</p>
                      <p className="text-gray-500 italic">"{h.nota}"</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'tratamientos' && (
                <div className="space-y-3">
                  {selectedPet.tratamientos.length > 0 ? (
                    selectedPet.tratamientos.map((t, idx) => (
                      <div key={idx} className="bg-white text-gray-800 p-3.5 rounded-2xl shadow-md text-xs flex justify-between items-center">
                        <div>
                          <p className="font-bold text-[#129b9b]">{t.medicamento}</p>
                          <p className="text-gray-500">{t.dosis}</p>
                        </div>
                        <span className="bg-green-100 text-green-700 font-semibold px-2.5 py-0.5 rounded-full text-[10px]">
                          {t.estado}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white text-gray-500 p-4 rounded-2xl text-center text-xs">
                      No hay tratamientos activos asignados.
                    </div>
                  )}
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
      <div className="w-full max-w-md min-h-screen md:min-h-[680px] bg-[#129b9b] md:rounded-3xl shadow-2xl p-5 text-white flex flex-col">
        {/* Navbar */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate('/home')} className="text-sm font-semibold flex items-center gap-1 hover:underline">
            ‹ Back
          </button>
          <h2 className="font-bold text-lg">Mascotas</h2>
          <div className="w-6"></div>
        </div>

        {/* Tarjetas celestes */}
        <div className="space-y-4">
          {pets.map((pet) => (
            <div 
              key={pet.id} 
              onClick={() => setSelectedPet(pet)}
              className="bg-[#62c4c4] p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-[#5bb8b8] shadow-md transition-all"
            >
              <div>
                <p className="font-bold text-lg ml-2">{pet.name}</p>
                <p className="text-xs text-cyan-100 ml-2">{pet.breed} • {pet.peso}</p>
              </div>
              <div className="w-20 h-16 rounded-xl overflow-hidden border-2 border-white/50">
                <img src={pet.img} alt={pet.name} className="w-full h-full object-cover" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PetsPage;