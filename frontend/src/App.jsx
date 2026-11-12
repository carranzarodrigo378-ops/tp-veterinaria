import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import HomeMenu from './pages/HomeMenu';
import PetsPage from './pages/PetsPage';
import TurnosPage from './pages/TurnosPage';
import LaboratorioHub from './pages/LaboratorioHub';
import LaboratorioPage from './pages/LaboratorioPage';
import ReportesPage from './pages/ReportesPage';
import AgendaVeterinaria from './pages/AgendaVeterinaria';
import RegistroVeterinarioPage from './pages/RegistroVeterinarioPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<HomeMenu />} />
        <Route path="/mascotas" element={<PetsPage />} />
        <Route path="/turnos" element={<TurnosPage />} />
        <Route path="/agenda" element={<AgendaVeterinaria />} />
        <Route path="/laboratorio-hub" element={<LaboratorioHub />} />
        <Route path="/muestras" element={<LaboratorioPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/registro-veterinario" element={<RegistroVeterinarioPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;