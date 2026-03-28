import { Link, useLocation } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  const location = useLocation();

  const productLinks = [
    { name: "Home", path: "/" },
    { name: "FIRE Planner", path: "/fire" },
    { name: "Tax Wizard", path: "/tax" },
    { name: "Health Score", path: "/dashboard" },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* BRAND SECTION - CENTERED */}
        <div className="footer-brand-center">
          <div className="footer-brand" onClick={scrollToTop} role="button" tabIndex={0}>
            <img 
              src="/logo.jpeg" 
              alt="Vittora Logo" 
              className="footer-logo"
              loading="lazy"
            />
            <span className="footer-name">Vittora</span>
          </div>
        </div>

        {/* PRODUCT LINKS - CENTERED */}
        <div className="footer-links-center">
          <div className="footer-link-group">
            {productLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`footer-link ${isActive(link.path) ? "active" : ""}`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* DISCLAIMER */}
        <div className="footer-bottom">
          <span className="footer-disclaimer">
            This platform is intended for informational purposes only and does not constitute financial advice.
          </span>
        </div>

        {/* COPYRIGHT */}
        <div className="footer-bottom">
          <span className="copyright">
            © {new Date().getFullYear()} Vittora.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;