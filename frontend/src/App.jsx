import { useState } from 'react';
import { 
  Dog, 
  Stethoscope, 
  FlaskConical, 
  BarChart3, 
  CheckCircle2, 
  AlertTriangle,
  Plus,
  FileText,
  Activity,
  ShieldCheck
} from 'lucide-react';
import './App.css';

export default function App() {
  const [vistaActual, setVistaActual] = useState('mascotas');

  return (
    <div className="flex min-h-screen bg-teal-50/40 font-sans text-slate-700">
      
      {/* PANEL LATERAL CON ESTILO VERDE AGUA / TURQUESA */}
      <aside className="w-64 bg-teal-700 text-white flex flex-col justify-between p-5 shadow-xl">
        <div>
          {/* LOGO E IDENTIDAD */}
          <div className="flex items-center gap-3 pb-6 mb-6 border-b border-teal-600/60">
            <div className="bg-white text-teal-700 p-2.5 rounded-2xl shadow-md flex items-center justify-center font-bold">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-white">VetLab</h1>
              <p className="text-xs text-teal-100 font-medium">Red & Laboratorio</p>
            </div>
          </div>

          {/* MENÚ DE NAVEGACIÓN */}
          <nav className="space-y-2">
            <button 
              onClick={() => setVistaActual('mascotas')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                vistaActual === 'mascotas' 
                  ? 'bg-white text-teal-800 shadow-md' 
                  : 'text-teal-100 hover:bg-teal-600/50'
              }`}
            >
              <Dog className="w-5 h-5" />
              <span>Mascotas & Clientes</span>
            </button>

            <button 
              onClick={() => setVistaActual('consultas')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                vistaActual === 'consultas' 
                  ? 'bg-white text-teal-800 shadow-md' 
                  : 'text-teal-100 hover:bg-teal-600/50'
              }`}
            >
              <Stethoscope className="w-5 h-5" />
              <span>Consultas Médicas</span>
            </button>

            <button 
              onClick={() => setVistaActual('muestras')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                vistaActual === 'muestras' 
                  ? 'bg-white text-teal-800 shadow-md' 
                  : 'text-teal-100 hover:bg-teal-600/50'
              }`}
            >
              <FlaskConical className="w-5 h-5" />
              <span>Muestras Biológicas</span>
            </button>

            <button 
              onClick={() => setVistaActual('reportes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                vistaActual === 'reportes' 
                  ? 'bg-white text-teal-800 shadow-md' 
                  : 'text-teal-100 hover:bg-teal-600/50'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Reportes</span>
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-teal-600/60 flex items-center gap-2 text-xs text-teal-100 font-medium">
          <ShieldCheck className="w-4 h-4 text-teal-200" />
          <span>Sistema Trazable 100%</span>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-teal-900 tracking-tight">
              {vistaActual === 'mascotas' && 'Mis Pacientes y Mascotas'}
              {vistaActual === 'consultas' && 'Consultas y Derivaciones'}
              {vistaActual === 'muestras' && 'Trazabilidad de Muestras Biológicas'}
              {vistaActual === 'reportes' && 'Centro de Reportes'}
            </h2>
            <p className="text-sm text-teal-700/70 font-medium mt-0.5">
              Gestión clínica y derivación de laboratorio
            </p>
          </div>

          <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2.5 rounded-full shadow-md shadow-teal-600/20 flex items-center gap-2 text-sm transition-all">
            <Plus className="w-4 h-4" />
            <span>Nuevo Registro</span>
          </button>
        </header>

        {/* VISTA DE MASCOTAS ESTILO TARJETAS COMO LA IMAGEN */}
        {vistaActual === 'mascotas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* TARJETA NEFER */}
            <div className="bg-teal-500/10 border border-teal-200 p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
              <div className="space-y-1">
                <span className="bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Gato Carey
                </span>
                <h3 className="text-xl font-extrabold text-teal-950 pt-1">Nefer</h3>
                <p className="text-xs text-teal-700 font-medium">Edad: 2 años • Hembra (Esterilizada)</p>
              </div>
              <div className="w-20 h-20 bg-teal-200/80 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                🐱
              </div>
            </div>

            {/* TARJETA CURRITO */}
            <div className="bg-teal-500/10 border border-teal-200 p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
              <div className="space-y-1">
                <span className="bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Perro Mestizo
                </span>
                <h3 className="text-xl font-extrabold text-teal-950 pt-1">Currito</h3>
                <p className="text-xs text-teal-700 font-medium">Edad: 4 años • Macho</p>
              </div>
              <div className="w-20 h-20 bg-teal-200/80 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                🐶
              </div>
            </div>
          </div>
        )}

        {/* VISTA DE MUESTRAS */}
        {vistaActual === 'muestras' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-teal-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">Muestra #101 - Nefer (Gato)</h4>
                  <p className="text-xs text-teal-600 font-semibold mt-0.5">Precinto P-9876 • Estado: INTACTO</p>
                </div>
              </div>
              <span className="text-xs font-bold px-4 py-1.5 rounded-full bg-teal-100 text-teal-800">
                En tránsito
              </span>
            </div>

            <div className="bg-rose-50/60 p-5 rounded-3xl border border-rose-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">Muestra #103 - Currito (Perro)</h4>
                  <p className="text-xs text-rose-600 font-semibold mt-0.5">Precinto P-1122 • Estado: ROTO</p>
                </div>
              </div>
              <span className="text-xs font-bold px-4 py-1.5 rounded-full bg-rose-100 text-rose-700">
                Muestra Rechazada
              </span>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}