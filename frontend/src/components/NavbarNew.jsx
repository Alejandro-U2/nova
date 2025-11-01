import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/navbarNew.css";
import Loader from "./Loader";

export default function NavbarNew() {
  const [user, setUser] = useState(null);
  const [showLogoutLoader, setShowLogoutLoader] = useState(false);
  const location = useLocation(); // 👈 Detecta la ruta actual

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    setShowLogoutLoader(true);
    
    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirigir al login con parámetro para omitir el loader inicial
      window.location.href = "/login?skipLoader=1";
      console.log("Sesión cerrada exitosamente");
    }, 1200); // Mostrar el loader por 1.2 segundos
  };

  return (
    <>
      {/* Loader al cerrar sesión */}
      <Loader 
        show={showLogoutLoader} 
        text="Cerrando sesión" 
        fixed 
        image="/img/nova-bg.png"
        hideText={true}
        whiteBackground={true}
      />
      
      <div className={`navbar ${showLogoutLoader ? 'hide-navbar' : ''}`}>
        <Link to="/home" className="logo-link">
          <img src="/img/nova-bg.png" alt="Nova" className="logo-img" />
        </Link>

      <div className="nav-center">
        <ul>
          <li>
            <Link
              to="/home"
              className={location.pathname === "/home" ? "active" : ""}
            >
              <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="nav-text">Inicio</span>
            </Link>
          </li>
          <li>
            <Link
              to="/search"
              className={location.pathname === "/search" ? "active" : ""}
            >
              <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="nav-text">Buscar</span>
            </Link>
          </li>
          <li>
            <Link
              to="/crear"
              className={location.pathname === "/crear" ? "active" : ""}
            >
              <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="nav-text">Crear</span>
            </Link>
          </li>
          <li>
            <Link
              to="/face-detection"
              className={location.pathname === "/face-detection" ? "active" : ""}
            >
              <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 14c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="18" cy="6" r="2" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span className="nav-text">Rostros</span>
            </Link>
          </li>
          <li>
            <Link
              to="/profile"
              className={location.pathname === "/profile" ? "active" : ""}
            >
              <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="nav-text">Perfil</span>
            </Link>
          </li>
        </ul>
      </div>

      <div className="user-area">
        <Link to="/profile" className="user-profile">
          <div className="user-avatar">{user?.name?.charAt(0) || "U"}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || "Usuario"}</div>
            <div className="user-status">● En línea</div>
          </div>
        </Link>

        <button className="logout-btn" onClick={handleLogout}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="16 17 21 12 16 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="21" y1="12" x2="9" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Salir</span>
        </button>
      </div>
    </div>
    </>
  );
}
