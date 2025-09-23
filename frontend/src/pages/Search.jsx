import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API from '../service';
import '../styles/search.css';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchType, setSearchType] = useState('users'); // 'users' | 'posts'
  const [isLoading, setIsLoading] = useState(false);

  // Datos mock para posts (temporalmente hasta implementar búsqueda de posts)
  const mockPosts = [
    {
      id: 1,
      author: 'Ana García',
      content: 'Acabo de terminar mi nuevo proyecto en React. ¡Estoy muy emocionada por compartirlo!',
      time: '2 horas ago',
      likes: 25,
      comments: 8
    },
    {
      id: 2,
      author: 'Carlos Rodríguez',
      content: 'Tips de diseño: La simplicidad es la clave de la elegancia en el diseño UI.',
      time: '4 horas ago',
      likes: 42,
      comments: 12
    },
    {
      id: 3,
      author: 'María López',
      content: '¿Alguien más está aprendiendo algoritmos? Me encanta resolver problemas de programación.',
      time: '1 día ago',
      likes: 18,
      comments: 15
    },
    {
      id: 4,
      author: 'Diego Martín',
      content: 'Nueva actualización de Node.js disponible. ¡Muchas mejoras interesantes!',
      time: '2 días ago',
      likes: 33,
      comments: 6
    }
  ];

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    
    try {
      if (searchType === 'users') {
        // Buscar usuarios reales en la base de datos
        console.log('🔍 Buscando usuarios con término:', searchTerm);
        const response = await API.get(`/users/search?q=${encodeURIComponent(searchTerm)}`);
        console.log('📊 Respuesta del servidor:', response.data);
        setSearchResults(response.data.users || []);
      } else {
        // Por ahora mantenemos los posts mock hasta implementar la búsqueda de posts
        const filteredPosts = mockPosts.filter(post =>
          post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.author.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(filteredPosts);
      }
    } catch (error) {
      console.error('❌ Error al buscar:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener todos los usuarios (debug)
  const handleGetAllUsers = async () => {
    setIsLoading(true);
    try {
      console.log('📋 Obteniendo todos los usuarios...');
      const response = await API.get('/users/all');
      console.log('📊 Todos los usuarios:', response.data);
      setSearchResults(response.data.users || []);
      setSearchType('users');
    } catch (error) {
      console.error('❌ Error al obtener usuarios:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, searchType]);

  return (
    <div className="search-container">
      <Navbar />
      
      <main className="search-content">
        <div className="search-header">
          <h1>Buscar en Nova</h1>
          <p>Encuentra usuarios y publicaciones que te interesen</p>
        </div>

        <div className="search-box">
          <div className="search-input-container">
            <input
              type="text"
              placeholder={`Buscar ${searchType === 'users' ? 'usuarios' : 'publicaciones'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button className="search-btn" onClick={handleSearch}>
              🔍
            </button>
          </div>
          
          <div className="search-filters">
            <button
              className={`filter-btn ${searchType === 'users' ? 'active' : ''}`}
              onClick={() => setSearchType('users')}
            >
              👥 Usuarios
            </button>
            <button
              className={`filter-btn ${searchType === 'posts' ? 'active' : ''}`}
              onClick={() => setSearchType('posts')}
            >
              📝 Publicaciones
            </button>
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
                {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} 
                {searchType === 'users' ? ' de usuarios' : ' de publicaciones'}
              </h3>
              
              {searchType === 'users' ? (
                <div className="users-results">
                  {searchResults.map(user => (
                    <div key={user._id || user.id} className="user-card">
                      <div className="user-avatar">
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </div>
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
                        <button className="follow-btn">Seguir</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="posts-results">
                  {searchResults.map(post => (
                    <div key={post.id} className="post-card">
                      <div className="post-header">
                        <div className="post-author-info">
                          <div className="author-avatar">
                            {post.author.charAt(0)}
                          </div>
                          <div>
                            <h4>{post.author}</h4>
                            <span className="post-time">{post.time}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="post-content">
                        <p>{post.content}</p>
                      </div>
                      
                      <div className="post-actions">
                        <button className="action-btn">
                          ❤️ {post.likes}
                        </button>
                        <button className="action-btn">
                          💬 {post.comments}
                        </button>
                        <button className="action-btn">
                          📤 Compartir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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