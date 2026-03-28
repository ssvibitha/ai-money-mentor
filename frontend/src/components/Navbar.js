import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user')) || {};

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  return (
    <nav className="vittora-navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <img src="/logo.jpeg" alt="Vittora Logo" className="logo-img" />
          <span className="logo-text">Vittora</span>
        </Link>
        
        <div className="nav-links">
          <Link to="/fire" className="nav-link">FIRE Planner</Link>
          <Link to="/tax" className="nav-link">Tax Wizard</Link>
          <Link to="/score" className="nav-link">Money Score</Link>
        </div>

        <div className="nav-actions">
          {isLoggedIn ? (
            <div className="user-menu">
              <span className="welcome-text">Hi, {user.name?.split(' ')[0]}</span>
              <Link to="/dashboard" className="dashboard-btn">Dashboard</Link>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          ) : (
            <div className="auth-btns">
              <Link to="/login" className="login-link">Login</Link>
              <Link to="/signup" className="signup-btn">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
