import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import HomeMenu from './pages/HomeMenu';
import PetsPage from './pages/PetsPage';
import TurnosPage from './pages/TurnosPage';
import LaboratorioHub from './pages/LaboratorioHub';
import LaboratorioPage from './pages/LaboratorioPage';
import LaboratorioOnly from './pages/LaboratorioOnly';
import ReportesPage from './pages/ReportesPage';
import AgendaVeterinaria from './pages/AgendaVeterinaria';
import RegistroVeterinarioPage from './pages/RegistroVeterinarioPage';
import RegistroConsultaPage from './pages/RegistroConsultaPage';
import SesionExpiradaModal from './pages/SesionExpiradaModal';
import HistorialTurnosPage from './pages/HistorialTurnosPage';

function App() {
  return (
    <BrowserRouter>
    <SesionExpiradaModal />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<HomeMenu />} />
        <Route path="/mascotas" element={<PetsPage />} />
        <Route path="/turnos" element={<TurnosPage />} />
        <Route path="/agenda" element={<AgendaVeterinaria />} />
        <Route path="/laboratorio-hub" element={<LaboratorioHub />} />
        <Route path="/muestras" element={<LaboratorioPage />} />
        <Route path="/laboratorio" element={<LaboratorioOnly />} />
        <Route path="/historial-turnos" element={<HistorialTurnosPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/registro-veterinario" element={<RegistroVeterinarioPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />

        <Route path="/consulta/nueva" element={<RegistroConsultaPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;