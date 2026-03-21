import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" />} />
        <Route path="/auth" element={<AuthPage />} />
        
        <Route path="/login" element={<AuthPage />} />
        <Route path="/registro" element={<AuthPage />} />

      </Routes>
    </Router>
  );
}

export default App;