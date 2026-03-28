import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MainApp from './pages/MainApp';
import TaxWizard from './pages/TaxWizard';
import FirePlanner from './pages/FirePlanner';
import MoneyScore from './pages/MoneyScore';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  const handleLogin = (user) => {
    setIsLoggedIn(true);
  };

  return (
    <Router>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
        <Route path="/signup" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Signup />} />
        
        {/* Tools (Accessible without login as requested) */}
        <Route path="/fire" element={<FirePlanner />} />
        <Route path="/tax" element={<TaxWizard />} />
        <Route path="/score" element={<MoneyScore />} />
        
        {/* Protected Dashboard/Main App */}
        <Route path="/dashboard" element={isLoggedIn ? <MainApp setIsLoggedIn={setIsLoggedIn} /> : <Navigate to="/login" />} />
        {/* Keep /app route for backwards compatibility if needed */}
        <Route path="/app" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
