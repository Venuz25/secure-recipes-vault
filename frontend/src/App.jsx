import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirigir la raíz o cualquier ruta de auth a la página unificada */}
        <Route path="/" element={<Navigate to="/auth" />} />
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Puedes mantener estas por compatibilidad, pero que apunten al mismo componente */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/registro" element={<AuthPage />} />

        {/* Tus rutas protegidas */}
        {/* <Route path="/home" element={<Home />} /> */}
      </Routes>
    </Router>
  );
}

export default App;