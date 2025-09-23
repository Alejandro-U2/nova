import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/navbar.css';

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src="/img/Logo-nova.png" alt="Nova" className="navbar-logo" />
          <span className="navbar-title">Nova</span>
        </div>
        
        <div className="navbar-menu">
          <Link 
            to="/home" 
            className={`navbar-item ${location.pathname === '/home' ? 'active' : ''}`}
          >
            <i className="icon-home"></i>
            Inicio
          </Link>
          
          <Link 
            to="/profile" 
            className={`navbar-item ${location.pathname === '/profile' ? 'active' : ''}`}
          >
            <i className="icon-user"></i>
            Perfil
          </Link>
          
          <Link 
            to="/search" 
            className={`navbar-item ${location.pathname === '/search' ? 'active' : ''}`}
          >
            <i className="icon-search"></i>
            Buscar
          </Link>
        </div>

        <div className="navbar-actions">
          <button className="logout-btn" onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
          }}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}