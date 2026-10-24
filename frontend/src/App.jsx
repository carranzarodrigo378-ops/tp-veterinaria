import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import HomeMenu from './pages/HomeMenu';
import PetsPage from './pages/PetsPage';
import TurnosPage from './pages/TurnosPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<HomeMenu />} />
        <Route path="/mascotas" element={<PetsPage />} />
        <Route path="/turnos" element={<TurnosPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;