import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Signup.css';
import API_BASE_URL from '../apiConfig';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    try {
      const signupUrl = API_BASE_URL ? `${API_BASE_URL}/api/signup` : '/api/signup';
      const response = await fetch(signupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <Navbar />

      <div className="signup-content">
        {/* Left Side - Features Section */}
        <div className="signup-left">
          <div className="left-content">
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-emoji">🔥</div>
                <h3 className="feature-card-title">FIRE Planner</h3>
                <p className="feature-card-description">
                  Enter your income, expenses, and goals — get a personalized month-by-month 
                  retirement roadmap instantly.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-emoji">🧾</div>
                <h3 className="feature-card-title">Tax Wizard</h3>
                <p className="feature-card-description">
                  Enter your salary details and instantly find out which tax regime saves you 
                  more money this year.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-emoji">❤️</div>
                <h3 className="feature-card-title">Money Health Score</h3>
                <p className="feature-card-description">
                  Answer 6 quick questions and get a score that shows exactly how healthy your 
                  finances are right now.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Form Section */}
        <div className="signup-right">
          <div className="form-wrapper">
            <div className="form-header">
              <h2 className="form-title">Create Account</h2>
              <p className="form-subtitle">Get started with your free account</p>
            </div>
            
            <form onSubmit={handleSubmit} className="signup-form">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    required
                    className="form-input"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
              
              {error && (
                <div className="alert alert-error">
                  <span className="alert-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              
              {success && (
                <div className="alert alert-success">
                  <span className="alert-icon">✓</span>
                  <span>{success}</span>
                </div>
              )}
              
              <button 
                type="submit" 
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
            
            <div className="form-footer">
              <p className="footer-text">
                Already have an account?{' '}
                <Link to="/login" className="footer-link">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;