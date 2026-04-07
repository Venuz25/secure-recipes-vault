import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ChefDashboard from './pages/ChefDashboard';
import UserDashboard from './pages/UserDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" />} />
        <Route path="/auth" element={<AuthPage />} />
        
        <Route path="/login" element={<AuthPage />} />
        <Route path="/registro" element={<AuthPage />} />
        <Route path="/ChefDashboard" element={<ChefDashboard />} /> 
        <Route path="/UserDashboard" element={<UserDashboard />} />
        
      </Routes>
    </Router>
  );
}

export default App;