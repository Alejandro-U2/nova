import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // 👈 Importante para el botón de perfil
import API from '../service';
import '../styles/search.css';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await API.get(`/users/search?q=${encodeURIComponent(searchTerm)}`);
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('❌ Error al buscar:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetAllUsers = async () => {
    setIsLoading(true);
    try {
      const response = await API.get('/users/all');
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('❌ Error al obtener usuarios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  return (
    <div className="search-container">
      <main className="search-content">
        <div className="search-header">
          <h1>Buscar en Nova</h1>
          <p>Encuentra usuarios que te interesen</p>
        </div>

        <div className="search-box">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button className="search-btn" onClick={handleSearch}>🔍</button>
          </div>

          <div className="search-filters">
            <button
              className="filter-btn"
              onClick={handleGetAllUsers}
              style={{ backgroundColor: '#28a745', color: 'white' }}
            >
              🔧 Ver Todos (Debug)
            </button>
          </div>
        </div>

        <div className="search-results">
          {isLoading ? (
            <div className="loading-message">
              <div className="spinner"></div>
              <p>Buscando...</p>
            </div>
          ) : searchTerm && searchResults.length === 0 ? (
            <div className="no-results">
              <p>No se encontraron resultados para "{searchTerm}"</p>
              <span>Intenta con otros términos de búsqueda</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="results-container">
              <h3>
                {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} de usuarios
              </h3>

              <div className="users-results">
                {searchResults.map(user => (
                  <div key={user._id || user.id} className="user-card">
                    <div className="user-avatar">{(user.name || 'U').charAt(0).toUpperCase()}</div>
                    <div className="user-info">
                      <h4>{user.name} {user.lastname}</h4>
                      <p className="user-email">@{user.nickname}</p>
                      <p className="user-email">{user.email}</p>
                      <p className="user-bio">{user.bio || 'Sin biografía disponible'}</p>
                      <div className="user-stats">
                        <span>{user.followers || 0} seguidores</span>
                        <span>{user.following || 0} siguiendo</span>
                      </div>
                    </div>
                    <div className="user-actions">
                      <button className="action-btn">Seguir</button>

                      <Link to={`/profile/${user._id}`} className="action-btn">
                        Ver perfil
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="search-suggestions">
              <h3>Descubre nuevos usuarios</h3>
              <p>Usa el buscador para encontrar usuarios por nombre, apellido, nickname o email.</p>
              <div className="search-tips">
                <h4>Tips de búsqueda:</h4>
                <ul>
                  <li>Busca por nombre: "Juan", "María"</li>
                  <li>Busca por nickname: "@usuario123"</li>
                  <li>Busca por email: "ejemplo@correo.com"</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
