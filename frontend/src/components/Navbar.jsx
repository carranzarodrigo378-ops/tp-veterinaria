import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <div className="flex gap-6 font-semibold">
        <Link to="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</Link>
        <Link to="/mascotas" className="hover:text-blue-400 transition-colors">Mascotas</Link>
        <Link to="/turnos" className="hover:text-blue-400 transition-colors">Turnos</Link>
      </div>
      <button 
        onClick={handleLogout} 
        className="bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-lg text-sm transition-colors font-medium"
      >
        Cerrar Sesión
      </button>
    </nav>
  );
};

export default Navbar;