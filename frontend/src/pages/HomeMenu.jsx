import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HomeMenu = () => {
  const navigate = useNavigate();
  const rawRole = localStorage.getItem('role') || 'cliente';
  const role = rawRole.toLowerCase();
  const clientName = localStorage.getItem('clientName') || 'Usuario';
  const clientId = localStorage.getItem('clientId');

  // Control de token expirado en 10 minutos
  useEffect(() => {
    const expiration = localStorage.getItem('token_expiration');
    const ahora = Date.now();

    if (!expiration || ahora > parseInt(expiration, 10)) {
      alert('Tu sesión ha expirado (límite de 10 minutos). Por favor ingresá nuevamente.');
      handleLogout();
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Íconos vectoriales orgánicos y profesionales
  const icons = {
    calendar: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5m-16.5 0v11.25c0 .621.504 1.125 1.125 1.125h14.25c.621 0 1.125-.504 1.125-1.125V8.25m-16.5 0V6a2.25 2.25 0 012.25-2.25h12A2.25 2.25 0 0119.5 6v2.25" />
      </svg>
    ),
    petCard: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h6m-9-9h12a1.5 1.5 0 011.5 1.5v13.5A1.5 1.5 0 0118 22.5H6a1.5 1.5 0 01-1.5-1.5V7.5A1.5 1.5 0 016 4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5V3a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0115 3v1.5" />
      </svg>
    ),
    stethoscope: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 9.75v-3a2.25 2.25 0 00-2.25-2.25h-1.5A2.25 2.25 0 0013.5 6.75v6a4.5 4.5 0 01-9 0v-6A2.25 2.25 0 002.25 4.5H.75" />
        <circle cx="19.5" cy="12.75" r="3" />
      </svg>
    ),
    lab: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75h4.5m-3.75 0v3.75l-4.5 9A2.25 2.25 0 008 19.5h8a2.25 2.25 0 002-3l-4.5-9V3.75" />
      </svg>
    ),
    userPlus: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 8.25v6m3-3h-6m-4.5 6.75A6.75 6.75 0 003 18v.75h10.5V18a6.75 6.75 0 00-1.8-4.65M10.5 9.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
      </svg>
    ),
    analytics: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    arrow: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    )
  };

  const roleMenus = {
    cliente: [
      {
        id: 'turnos-cliente',
        tag: 'Turnos',
        title: 'Pedir Cita Médica',
        description: 'Solicitud para control preventivo, consultas o urgencias',
        icon: icons.stethoscope,
        path: '/turnos',
      },
      {
        id: 'mascotas-cliente',
        tag: 'Pacientes',
        title: 'Mis Mascotas',
        description: 'Fichas clínicas, esquemas de vacunas y fechas programadas',
        icon: icons.petCard,
        path: '/mascotas',
      },
    ],
    veterinario: [
      {
        id: 'atencion-vete',
        tag: 'Consultorio',
        title: 'Atención Clínica',
        description: 'Consultas agendadas hoy, diagnósticos y recetas digitales',
        icon: icons.stethoscope,
        path: '/turnos',
      },
      {
        id: 'pacientes-vete',
        tag: 'Expedientes',
        title: 'Registro de Mascotas',
        description: 'Historias clínicas completas y antecedentes veterinarios',
        icon: icons.petCard,
        path: '/mascotas',
      },
      {
        id: 'laboratorio-vete',
        tag: 'Diagnóstico',
        title: 'Laboratorio Hub',
        description: 'Ingreso de muestras biológicas y seguimiento de análisis',
        icon: icons.lab,
        path: '/laboratorio-hub',
        highlight: true,
      },
    ],
    admin: [
      {
        id: 'add-vete-admin',
        tag: 'Personal',
        title: 'Añadir Veterinario',
        description: 'Alta de profesionales, matrículas y asignación de permisos',
        icon: icons.userPlus,
        path: '/registro-veterinario',
        actionHighlight: true,
      },
      {
        id: 'agenda-admin',
        tag: 'Gestión',
        title: 'Calendario de Turnos',
        description: 'Supervisión de agendas, guardias y reasignaciones activas',
        icon: icons.calendar,
        path: '/turnos',
      },
      {
        id: 'pacientes-admin',
        tag: 'Padrón',
        title: 'Registro de Mascotas',
        description: 'Directorio general de tutores y animales en el sistema',
        icon: icons.petCard,
        path: '/mascotas',
      },
      {
        id: 'lab-admin',
        tag: 'Servicios',
        title: 'Laboratorio Hub',
        description: 'Monitoreo de órdenes, derivaciones y entregas de resultados',
        icon: icons.lab,
        path: '/laboratorio-hub',
      },
      {
        id: 'reportes-admin',
        tag: 'Métricas',
        title: 'Reportes y Estadísticas',
        description: 'Auditoría, atenciones mensuales y balance operativo',
        icon: icons.analytics,
        path: '/reportes',
      },
    ],
  };

  const userMenuItems = roleMenus[role] || roleMenus['cliente'];

  const getRoleBadge = () => {
    if (role === 'admin') return { label: 'Administrador', color: 'bg-rose-500/90 text-white' };
    if (role === 'veterinario') return { label: 'Staff Veterinario', color: 'bg-amber-400 text-slate-900' };
    return { label: 'Cliente', color: 'bg-white/20 text-cyan-100' };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* 1. Imagen de fondo en toda la pantalla */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none z-0"
        style={{ backgroundImage: "url('/fondoo.jpeg')" }}
      />

      {/* 2. Capa sutil de desenfoque y contraste */}
      <div className="fixed inset-0 bg-slate-900/5 backdrop-blur-[1px] pointer-events-none z-0" />

      {/* Header Superior */}
      <header className="w-full bg-[#0d7373] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex justify-between items-center">
          <div 
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide">
              Vet<span className="text-[#f1adb6]">2</span>Gö
            </h1>
            <span className="text-2xl">🐾</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full border border-white/40 flex items-center justify-center bg-white/10 text-sm shadow-inner">
                👤
              </div>
              <div className="text-left">
                <p className="text-sm font-bold leading-tight">{clientName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>
                  {clientId && (
                    <span className="text-[10px] font-mono bg-white/15 px-1.5 py-0.5 rounded-sm text-cyan-100">
                      #{clientId}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 hover:bg-[#f1adb6] hover:text-[#0d7373] transition-all duration-200 text-xs font-bold border border-white/20 shadow-sm cursor-pointer ml-2"
              title="Cerrar sesión"
            >
              <span>🐾</span>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 items-stretch relative z-10">
        
        {/* Columna Izquierda: Opciones rediseñadas con estilo profesional, sobrio y orgánico */}
        <section className="w-full lg:w-1/2 bg-white/95 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/90 flex flex-col justify-between">
          <div className="flex-1 flex flex-col">
            <div className="mb-5 pb-3 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {role === 'admin' ? 'Consola de Gestión' : 'Panel de Operaciones'}
              </span>
              <h2 className="text-2xl font-bold text-slate-800 mt-0.5">
                ¿Qué querés gestionar hoy?
              </h2>
            </div>

            <div className="flex flex-col gap-3 flex-1 justify-start">
              {userMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full text-left rounded-lg p-3.5 transition-all duration-200 flex items-center justify-between group cursor-pointer border ${
                    item.actionHighlight
                      ? 'bg-emerald-50/60 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/90'
                      : item.highlight
                      ? 'bg-amber-50/60 border-amber-300 hover:border-amber-400 hover:bg-amber-50/90'
                      : 'bg-stone-50/60 border-slate-200 hover:bg-white hover:border-[#0d7373] hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                      item.actionHighlight
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                        : item.highlight
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : 'bg-teal-50 border-teal-100 text-[#0d7373] group-hover:bg-[#0d7373] group-hover:text-white'
                    }`}>
                      {item.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                        item.actionHighlight
                          ? 'text-emerald-700'
                          : item.highlight
                          ? 'text-amber-700'
                          : 'text-[#0d7373]'
                      }`}>
                        {item.tag}
                      </span>
                      <h3 className="text-sm font-bold leading-snug text-slate-900 group-hover:text-[#0d7373] transition-colors truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-slate-400 group-hover:text-[#0d7373] group-hover:translate-x-1 transition-all shrink-0">
                    {icons.arrow}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pie de la columna izquierda */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-slate-600">
                {role === 'admin' ? 'Modo Supervisor Activo' : 'Sesión Activa'}
              </span>
            </div>
            <span className="font-medium text-slate-400">
              Vet2Gö Plataforma
            </span>
          </div>
        </section>

        {/* Columna Derecha: Tarjeta Hero Original con gradiente y frescura */}
        <section className="w-full lg:w-1/2 bg-gradient-to-br from-[#0d7373] via-[#129b9b] to-[#1bb3b3] rounded-3xl p-8 md:p-12 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
          
          <div className="absolute -top-12 -right-12 text-[180px] text-white/5 select-none pointer-events-none">
            🐾
          </div>
          <div className="absolute -bottom-16 -left-10 text-[200px] text-white/5 select-none pointer-events-none">
            🐶
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <span className="bg-white/15 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-extrabold tracking-widest uppercase border border-white/20">
              Atención Veterinaria Integral
            </span>
          </div>

          <div className="relative z-10 my-auto py-8">
            <h2 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight drop-shadow-sm">
              Cuidamos siempre <br />
              de tu <span className="text-[#f1adb6] underline decoration-wavy decoration-[#f1adb6]/60">mejor amigo</span>.
            </h2>
            <p className="mt-5 text-cyan-50 text-base md:text-lg max-w-lg font-normal leading-relaxed">
              En <strong className="font-bold">Vet2Gö</strong> combinamos tecnología ágil, calidez humana y medicina preventiva para acompañar cada etapa de la vida de tu mascota.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/15">
            <div className="bg-black/15 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
              <span className="text-2xl">⚡</span>
              <h4 className="font-extrabold text-sm mt-1">Atención Rápida</h4>
              <p className="text-[11px] text-cyan-100 mt-0.5">Gestión de turnos al instante sin demoras.</p>
            </div>
            
            <div className="bg-black/15 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
              <span className="text-2xl">📋</span>
              <h4 className="font-extrabold text-sm mt-1">Ficha Digital</h4>
              <p className="text-[11px] text-cyan-100 mt-0.5">Historiales de vacunas y controles al día.</p>
            </div>

            <div className="bg-black/15 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
              <span className="text-2xl">💚</span>
              <h4 className="font-extrabold text-sm mt-1">Compromiso Total</h4>
              <p className="text-[11px] text-cyan-100 mt-0.5">Profesionales certificados cuidando su salud.</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default HomeMenu;