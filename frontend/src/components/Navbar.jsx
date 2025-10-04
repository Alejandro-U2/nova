import { Link } from "react-router-dom";
import "./Navbar.css"; // lo estilizamos aparte

export default function Navbar() {
  const handleLogout = () => {
    // Limpiar el localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirigir al login o página principal
    window.location.href = '/login'; // o usa useNavigate si tienes React Router
    
    console.log('Sesión cerrada exitosamente');
  };

  return (
    <div className="navbar">
      <h2 className="logo">Nova</h2>
      <ul>
        <li>
          <Link to="/Home">Inicio</Link>
        </li>
        <li>
          <Link to="/Search">Buscar</Link>
        </li>
        <li>
          <Link to="/Explore">Explore</Link>
        </li>
        <li>
          <Link to="/Notificaciones">Notificaciones</Link>
        </li>
        <li>
          <Link to="/Crear">Crear</Link>
        </li>
        <li>
          <Link to="/Profile">Perfil</Link>
        </li>
        <li>
          <button className="logout-btn" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </li>
      </ul>
    </div>
  );
}
