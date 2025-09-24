import { Link } from "react-router-dom";
import "./Navbar.css"; // Corrected import path

export default function Navbar() {
  return (
    <div className="navbar">
      <h2 className="logo">Nova</h2>
      <ul>
        <li>
          <Link to="/inicio">Inicio</Link>
        </li>
        <li>
          <Link to="/buscar">Buscar</Link>
        </li>
        <li>
          <Link to="/explore">Explore</Link>
        </li>
        <li>
          <Link to="/notificaciones">Notificaciones</Link>
        </li>
        <li>
          <Link to="/crear">Crear</Link>
        </li>
        <li>
          <Link to="/perfil">Perfil</Link>
        </li>
      </ul>
    </div>
  );
}
