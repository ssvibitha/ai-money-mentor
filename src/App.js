import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import MainApp from './components/MainApp';
import TaxWizard from './components/TaxWizard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleGetStarted = () => {
    // Navigate to login or directly to main if no auth
    window.location.href = '/login';
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/app" /> : <Login onLogin={handleLogin} />} />
        <Route path="/app" element={isLoggedIn ? <MainApp setIsLoggedIn={setIsLoggedIn} /> : <Navigate to="/login" />} />
        <Route path="/tax" element={isLoggedIn ? <TaxWizard /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
