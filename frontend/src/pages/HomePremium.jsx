import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/homePremium.css';
const HomePremium = () => {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [user, setUser] = useState(null);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const navigate = useNavigate();

  // Verificar autenticación
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  // Cargar publicaciones
  const loadPublications = async (pageNum = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/publications/feed`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar publicaciones');
      }

      const data = await response.json();
      console.log('Datos recibidos:', data); // Para debugging
      console.log('Publicaciones:', data.publications); // Para ver las publicaciones específicamente
      
      if (data.message && data.message.includes('✅')) {
        const newPublications = data.publications || [];
        
        // Log de las imágenes para debugging
        newPublications.forEach((pub, index) => {
          console.log(`Publicación ${index}:`, {
            id: pub._id,
            image: pub.image,
            description: pub.description
          });
        });
        
        if (append) {
          setPublications(prev => [...prev, ...newPublications]);
        } else {
          setPublications(newPublications);
        }
        
        // Usar la paginación del backend si está disponible
        const hasMoreData = data.pagination ? 
          data.pagination.current < data.pagination.pages : 
          newPublications.length === 10;
        setHasMore(hasMoreData);
      } else {
        throw new Error(data.message || 'Error al cargar publicaciones');
      }
    } catch (error) {
      console.error('Error loading publications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPublications();
  }, []);

  // Cargar usuarios sugeridos cuando el usuario esté disponible
  useEffect(() => {
    if (user) {
      loadSuggestedUsers();
    }
  }, [user]);

  // Cargar usuarios sugeridos
  const loadSuggestedUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrar para no mostrar al usuario actual y limitar a 5 sugerencias
        const currentUserId = user?.id || user?._id;
        const filteredUsers = data.users
          .filter(suggestedUser => suggestedUser._id !== currentUserId)
          .slice(0, 5);
        setSuggestedUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error loading suggested users:', error);
    }
  };

  // Manejar seguir usuario
  const handleFollow = async (userId) => {
    try {
      // Aquí irá la lógica para seguir usuario cuando tengamos el endpoint
      // Por ahora solo actualizar el estado local
      setFollowingUsers(prev => new Set([...prev, userId]));
      console.log(`Siguiendo usuario: ${userId}`);
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  // Manejar like de publicación
  const handleLike = async (publicationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/publications/${publicationId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Refrescar publicaciones para mostrar el nuevo estado
        loadPublications(1, false);
      }
    } catch (error) {
      console.error('Error al dar like:', error);
    }
  };

  // Cargar más publicaciones
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPublications(nextPage, true);
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1h';
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    if (diffInHours < 48) return 'Hace 1 día';
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Obtener avatar del usuario
  const getUserAvatar = (publication) => {
    // Por ahora deshabilitado hasta que se configure la ruta en el backend
    // if (publication?.userProfile?.avatar && publication.userProfile.avatar !== 'default.png') {
    //   return `http://localhost:5000/api/users/avatar/${publication.userProfile.avatar}`;
    // }
    return null;
  };

  // Obtener iniciales del usuario
  const getUserInitials = (publication) => {
    if (!publication?.user) return 'U';
    const user = publication.user;
    const name = user.name || user.nickname || 'Usuario';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="home-page">
        <div className="home-container">
          <div className="loading">
            <div className="spinner"></div>
            <h3>Cargando publicaciones...</h3>
            <p>Preparando tu feed personalizado</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page">
        <div className="home-container">
          <div className="empty">
            <div className="icon">⚠️</div>
            <h3>Error al cargar</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-container">
        {/* Banner de bienvenida */}
        <div className="welcome-banner">
          <span>🎉</span>
          <span>¡Bienvenido de vuelta, {user?.name || user?.nick || 'Usuario'}!</span>
          <span>✨</span>
        </div>

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-text">
            <h1>Descubre Nova</h1>
            <p>
              Conecta con personas increíbles, comparte momentos únicos y descubre 
              contenido inspirador en la red social del futuro.
            </p>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="number">{publications.length}</span>
              <span className="label">Publicaciones</span>
            </div>
            <div className="stat">
              <span className="number">2.4k</span>
              <span className="label">Usuarios</span>
            </div>
          </div>
        </section>

        {/* Contenido principal */}
        <div className="main-content">
          {/* Feed de publicaciones */}
          <div className="feed">
            {publications.length === 0 ? (
              <div className="empty">
                <div className="icon">📭</div>
                <h3>No hay publicaciones</h3>
                <p>¡Sé el primero en compartir algo increíble!</p>
              </div>
            ) : (
              <div className="posts">
                {publications.map((pub) => (
                  <article key={pub._id} className="post">
                    {/* Header del post */}
                    <div className="post-header">
                      <div className="user">
                        <div className="avatar">
                          {getUserAvatar(pub) ? (
                            <img 
                              src={getUserAvatar(pub)} 
                              alt={pub.user?.name || 'Usuario'} 
                            />
                          ) : (
                            <span className="avatar-text">
                              {getUserInitials(pub)}
                            </span>
                          )}
                        </div>
                        <div className="info">
                          <h4>{pub.user?.name || pub.user?.nickname || 'Usuario'}</h4>
                          <time>{formatDate(pub.created_at)}</time>
                        </div>
                      </div>
                      <button className="more">⋯</button>
                    </div>

                    {/* Imagen de la publicación */}
                    {pub.image && (
                      <div className="post-image">
                        <img 
                          src={pub.image}
                          alt={pub.description || "Publicación"}
                          onError={(e) => {
                            console.error('Error cargando imagen:', pub.image);
                            // Si falla cargar la imagen, mostrar placeholder
                            e.target.style.display = 'none';
                            const placeholder = e.target.parentNode.querySelector('.image-placeholder');
                            if (placeholder) {
                              placeholder.style.display = 'flex';
                            }
                          }}
                          onLoad={() => {
                            console.log('Imagen cargada exitosamente:', pub.image);
                          }}
                        />
                        <div 
                          className="image-placeholder"
                          style={{
                            display: 'none',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            height: '300px',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '1.2rem',
                            flexDirection: 'column',
                            textAlign: 'center',
                            padding: '2rem'
                          }}
                        >
                          <div>📷</div>
                          <div>Error al cargar imagen</div>
                          <div style={{ fontSize: '0.8rem', marginTop: '1rem', opacity: 0.7 }}>
                            URL: {pub.image}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Descripción */}
                    {pub.description && (
                      <div className="post-description">
                        <p>{pub.description}</p>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="post-actions">
                      <div className="actions">
                        <button 
                          className={`action-btn like ${pub.isLiked ? 'liked' : ''}`}
                          onClick={() => handleLike(pub._id)}
                        >
                          <span className="icon">{pub.isLiked ? '❤️' : '🤍'}</span>
                          <span className="count">{pub.likes ? pub.likes.length : 0}</span>
                        </button>
                        <button className="action-btn comment">
                          <span className="icon">💬</span>
                          <span className="count">{pub.comments ? pub.comments.length : 0}</span>
                        </button>
                        <button className="action-btn share">
                          <span className="icon">📤</span>
                          <span className="count">0</span>
                        </button>
                      </div>
                      <button className="save">🔖</button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Botón cargar más */}
            {hasMore && publications.length > 0 && (
              <div className="load-more">
                <button 
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <div className="btn-spinner"></div>
                      <span>Cargando...</span>
                    </>
                  ) : (
                    <>
                      <span>Cargar más</span>
                      <span>⬇️</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="sidebar">
            {/* Sugerencias de Usuarios */}
            <div className="sidebar-card">
              <h3>
                <span>🔥</span>
                SUGERENCIAS
              </h3>
              <div className="user-suggestions">
                {suggestedUsers.length > 0 ? (
                  suggestedUsers.map(suggestedUser => (
                    <div key={suggestedUser._id} className="user-suggestion">
                      <div className="suggestion-user-info">
                        <div className="suggestion-avatar">
                          {suggestedUser.avatar ? (
                            <img src={suggestedUser.avatar} alt={suggestedUser.name} />
                          ) : (
                            <div className="avatar-placeholder">
                              {suggestedUser.name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="suggestion-user-details">
                          <span className="suggestion-name">{suggestedUser.name}</span>
                          <span className="suggestion-nickname">@{suggestedUser.nickname || suggestedUser.name?.toLowerCase()}</span>
                        </div>
                      </div>
                      <button 
                        className={`follow-btn ${followingUsers.has(suggestedUser._id) ? 'following' : ''}`}
                        onClick={() => handleFollow(suggestedUser._id)}
                        disabled={followingUsers.has(suggestedUser._id)}
                      >
                        {followingUsers.has(suggestedUser._id) ? 'Siguiendo' : 'Seguir'}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="no-suggestions">
                    <span>No hay sugerencias disponibles</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sugerencias */}
            <div className="sidebar-card">
              <h3>
                <span>💡</span>
                Consejos
              </h3>
              <div className="suggestions">
                <div className="suggestion">
                  <span className="icon">✨</span>
                  <span>Completa tu perfil para conectar mejor con otros usuarios</span>
                </div>
                <div className="suggestion">
                  <span className="icon">📸</span>
                  <span>Comparte momentos únicos con fotos de alta calidad</span>
                </div>
                <div className="suggestion">
                  <span className="icon">🤝</span>
                  <span>Sigue a usuarios con intereses similares</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default HomePremium;