import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/navbarNew.css";

export default function NavbarNew() {
  const [user, setUser] = useState(null);
  const location = useLocation(); // 👈 Detecta la ruta actual

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    console.log("Sesión cerrada exitosamente");
  };

  return (
    <div className="navbar">
      <h2 className="logo">Nova</h2>

      <div className="nav-center">
        <ul>
          <li>
            <Link
              to="/home"
              className={location.pathname === "/home" ? "active" : ""}
            >
              <span className="nav-icon">🏠</span>
              <span className="nav-text">Inicio</span>
            </Link>
          </li>
          <li>
            <Link
              to="/search"
              className={location.pathname === "/search" ? "active" : ""}
            >
              <span className="nav-icon">🔍</span>
              <span className="nav-text">Buscar</span>
            </Link>
          </li>
          <li>
            <Link
              to="/crear"
              className={location.pathname === "/crear" ? "active" : ""}
            >
              <span className="nav-icon">➕</span>
              <span className="nav-text">Crear</span>
            </Link>
          </li>
          <li>
            <Link
              to="/profile"
              className={location.pathname === "/profile" ? "active" : ""}
            >
              <span className="nav-icon">👤</span>
              <span className="nav-text">Perfil</span>
            </Link>
          </li>
        </ul>
      </div>

      <div className="user-area">
        <div className="user-profile">
          <div className="user-avatar">{user?.name?.charAt(0) || "U"}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || "Usuario"}</div>
            <div className="user-status">● En línea</div>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <span>🚪</span>
          <span>Salir</span>
        </button>
      </div>
    </div>
  );
}
