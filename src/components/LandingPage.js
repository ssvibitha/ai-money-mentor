import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-left">
          <img src="/logo.jpeg" alt="Vittora Logo" className="navbar-logo" />
          <span className="navbar-brand">Vittora</span>
        </div>
        <div className="navbar-right">
          <Link to="/guest" className="btn btn-outline">Try without login</Link>
          <Link to="/login" className="btn btn-outline">Login</Link>
          <Link to="/signup" className="btn btn-primary">Sign Up</Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Your Personal AI Financial Advisor</h1>
          <p className="hero-subtitle">
            Get a personalized retirement plan and tax savings in under 60 seconds — free. No jargon. No advisor fees.
          </p>
          <div className="hero-actions">
            <div className="hero-buttons">
              <Link to="/fire" className="btn btn-primary btn-large">Get My FIRE Plan</Link>
              <Link to="/tax" className="btn btn-outline-primary btn-large">Calculate My Tax Savings</Link>
            </div>
            <Link to="/guest" className="text-link">
              Try without signing up <span className="text-link-arrow">→</span>
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="mockup-card">
            <div className="mockup-header">
              <h3 className="mockup-title">Your FIRE Plan Output</h3>
            </div>
            <div className="mockup-chart"></div>
            <div className="mockup-stats">
              <div className="mockup-stat">
                <div className="mockup-stat-label">Monthly SIP</div>
                <div className="mockup-stat-value">₹18,000</div>
              </div>
              <div className="mockup-stat">
                <div className="mockup-stat-label">Retire At</div>
                <div className="mockup-stat-value">48</div>
              </div>
              <div className="mockup-stat mockup-stat-full">
                <div className="mockup-stat-label">Target Corpus</div>
                <div className="mockup-stat-value">₹3.2 Cr</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS SECTION */}
      <section className="features">
        <h2 className="section-title">Everything you need to take control of your money</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🔥</div>
            <h3 className="feature-title">FIRE Planner</h3>
            <p className="feature-desc">
              Get a month-by-month roadmap to financial independence based on your income and goals.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧾</div>
            <h3 className="feature-title">Tax Wizard</h3>
            <p className="feature-desc">
              Find out instantly whether old or new tax regime saves you more money this year.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">❤️</div>
            <h3 className="feature-title">Money Health Score</h3>
            <p className="feature-desc">
              Get a 360° score of your financial health across 6 key dimensions.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="how-it-works">
        <h2 className="section-title">How it works</h2>
        <div className="steps-container">
          <div className="steps-line"></div>
          <div className="step">
            <div className="step-number">1</div>
            <h3 className="step-title">Fill your details</h3>
            <p className="step-desc">Share basic information about your income, expenses, and current savings securely.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3 className="step-title">AI analyzes your profile</h3>
            <p className="step-desc">Our intelligent engine processes your data against current tax laws and market trends.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3 className="step-title">Get your personalized plan</h3>
            <p className="step-desc">Receive actionable steps to optimize taxes, grow wealth, and achieve financial freedom.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      {/* FOOTER */}
<footer className="footer">
  <div className="footer-content">

    {/* LEFT: BRAND */}
    <div className="footer-section footer-left">
      <div className="footer-brand">
        <img src="/logo.jpeg" alt="Vittora Logo" className="footer-logo" />
        <span className="footer-name">Vittora</span>
      </div>
      <p className="footer-tagline">
        AI-powered financial planning for smarter, data-driven decisions.
      </p>
    </div>

    {/* CENTER: PRODUCT LINKS */}
    <div className="footer-section footer-links">
      <h4 className="footer-heading">Product</h4>
      <Link to="/" className="footer-link">Home</Link>
      <Link to="/fire" className="footer-link">FIRE Planner</Link>
      <Link to="/tax" className="footer-link">Tax Wizard</Link>
      <Link to="/dashboard" className="footer-link">Health Score</Link>
    </div>

    {/* CENTER: COMPANY LINKS */}
    <div className="footer-section footer-links">
      <h4 className="footer-heading">Company</h4>
      <a href="#" className="footer-link">About Us</a>
      <a href="#" className="footer-link">Careers</a>
      <a href="#" className="footer-link">Contact</a>
    </div>

    {/* RIGHT: LEGAL */}
    <div className="footer-section footer-links">
      <h4 className="footer-heading">Legal</h4>
      <a href="#" className="footer-link">Terms & Conditions</a>
      <a href="#" className="footer-link">Privacy Policy</a>
      <a href="#" className="footer-link">Disclaimer</a>
    </div>

  </div>

  {/* BOTTOM BAR */}
  <div className="footer-bottom">
    <span>© {new Date().getFullYear()} Vittora. All rights reserved.</span>
    <br />
    <span className="footer-disclaimer">
      This platform is intended for informational purposes only and does not constitute financial advice.
    </span>
  </div>
</footer>
    </div>
  );
};

export default LandingPage;
