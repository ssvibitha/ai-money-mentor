import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
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

  useEffect(() => {
    if (location.pathname === "/") {
      scrollToTop();
    }
  }, [location.pathname]);

  const handleHomeClick = (e, path) => {
    if (path === "/" && location.pathname === "/") {
      e.preventDefault();
      scrollToTop();
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* BRAND SECTION - CENTERED */}
        <div className="footer-brand-center">
          <div className="footer-brand" onClick={scrollToTop} role="button" tabIndex={0}>
            <img 
              src="/logo.jpeg"  // Direct path from public folder
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
            {productLinks.map((link) => {
              const isHomeLink = link.path === "/";
              
              if (isHomeLink) {
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="footer-link"
                    onClick={(e) => handleHomeClick(e, link.path)}
                  >
                    {link.name}
                  </Link>
                );
              }
              
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`footer-link ${isActive(link.path) ? "active" : ""}`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="footer-bottom">
          <span className="copyright">
            © {new Date().getFullYear()} Vittora
          </span>
        </div>

        {/* DISCLAIMER - BELOW COPYRIGHT */}
        <div className="footer-disclaimer-wrapper">
          <span className="footer-disclaimer">
            This platform is intended for informational purposes only and does not constitute financial advice.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;