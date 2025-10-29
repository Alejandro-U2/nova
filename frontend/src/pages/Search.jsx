import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // 👈 Importante para el botón de perfil
import API from '../service';
import '../styles/search.css';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [loadingFollow, setLoadingFollow] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userStats, setUserStats] = useState({}); // Estado para almacenar estadísticas de usuarios

  // Obtener el ID del usuario actual
  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id || user._id);
      }
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
    }
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await API.get(`/users/search?q=${encodeURIComponent(searchTerm)}`);
      // Filtrar el usuario actual de los resultados
      const filteredUsers = (response.data.users || []).filter(
        user => user._id !== currentUserId && user.id !== currentUserId
      );
      setSearchResults(filteredUsers);
      
      // Cargar estadísticas para cada usuario
      loadUserStats(filteredUsers);
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
      // Filtrar el usuario actual de los resultados
      const filteredUsers = (response.data.users || []).filter(
        user => user._id !== currentUserId && user.id !== currentUserId
      );
      setSearchResults(filteredUsers);
      
      // Cargar estadísticas para cada usuario
      loadUserStats(filteredUsers);
    } catch (error) {
      console.error('❌ Error al obtener usuarios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar estadísticas de seguidores/siguiendo para cada usuario
  const loadUserStats = async (users) => {
    const token = localStorage.getItem('token');
    const statsPromises = users.map(async (user) => {
      try {
        // Solo cargar contadores (esto siempre funciona)
        const countersResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/follow/counters/${user._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        let countersData = { followers: 0, following: 0 };
        
        if (countersResponse.ok) {
          const data = await countersResponse.json();
          countersData = {
            followers: data.followers || 0,
            following: data.following || 0
          };
        }
        
        return {
          userId: user._id,
          followers: countersData.followers,
          following: countersData.following
        };
      } catch (error) {
        console.error(`Error al cargar contadores para usuario ${user._id}:`, error);
        return {
          userId: user._id,
          followers: 0,
          following: 0
        };
      }
    });
    
    const statsArray = await Promise.all(statsPromises);
    const statsMap = {};
    
    statsArray.forEach(stat => {
      statsMap[stat.userId] = {
        followers: stat.followers,
        following: stat.following
      };
    });
    
    setUserStats(statsMap);
  };

  // Cargar usuarios que ya estoy siguiendo
  const loadFollowingUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/follow/following`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 [Search] Datos de following recibidos:', data);
        
        const followingIds = new Set();
        
        if (data.following && Array.isArray(data.following)) {
          data.following.forEach(follow => {
            console.log('🔍 [Search] Analizando follow:', follow);
            
            // Manejar diferentes estructuras de datos
            if (typeof follow.followed === 'object' && follow.followed._id) {
              followingIds.add(follow.followed._id);
              console.log('✅ [Search] Usuario seguido (objeto):', follow.followed.name, 'ID:', follow.followed._id);
            } else if (typeof follow.followed === 'string') {
              followingIds.add(follow.followed);
              console.log('✅ [Search] Usuario seguido (string ID):', follow.followed);
            } else if (follow._id) {
              followingIds.add(follow._id);
              console.log('✅ [Search] Usuario seguido (follow._id):', follow._id);
            } else if (follow.user && typeof follow.user === 'object' && follow.user._id) {
              followingIds.add(follow.user._id);
              console.log('✅ [Search] Usuario seguido (follow.user._id):', follow.user._id);
            } else {
              console.log('⚠️ [Search] Formato desconocido:', follow);
            }
          });
        }
        
        console.log('🎯 [Search] Total de usuarios que sigo:', followingIds.size);
        console.log('🎯 [Search] IDs de usuarios que sigo:', Array.from(followingIds));
        setFollowingUsers(followingIds);
      }
    } catch (error) {
      console.error('❌ [Search] Error loading following users:', error);
    }
  };

  // Función para seguir/dejar de seguir usuario
  const handleFollow = async (userId) => {
    try {
      setLoadingFollow(prev => ({ ...prev, [userId]: true }));
      
      const token = localStorage.getItem('token');
      const isCurrentlyFollowing = followingUsers.has(userId);
      
      const action = isCurrentlyFollowing ? 'unfollow' : 'follow';
      const method = isCurrentlyFollowing ? 'DELETE' : 'POST';
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/follow/${action}/${userId}`, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data.message);
        
        // Actualizar el estado local
        if (isCurrentlyFollowing) {
          setFollowingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        } else {
          setFollowingUsers(prev => new Set([...prev, userId]));
        }
        
        // Disparar evento para actualizar contadores en otras páginas
        const followEvent = new CustomEvent('followStatusChanged', { 
          detail: { userId, isFollowing: !isCurrentlyFollowing } 
        });
        window.dispatchEvent(followEvent);
      } else {
        const errorData = await response.json();
        console.error('Error al seguir/dejar de seguir:', errorData.message);
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error al conectar con el servidor:', error);
      alert('Error de conexión');
    } finally {
      setLoadingFollow(prev => ({ ...prev, [userId]: false }));
    }
  };

  useEffect(() => {
    loadFollowingUsers();
    
    // Escuchar cambios de seguimiento desde otras partes de la app
    const handleFollowChange = (event) => {
      console.log('🔄 [Search] Evento de cambio de seguimiento detectado:', event.detail);
      const { userId, isFollowing } = event.detail;
      
      if (isFollowing) {
        setFollowingUsers(prev => new Set([...prev, userId]));
      } else {
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    };
    
    window.addEventListener('followStatusChanged', handleFollowChange);
    
    return () => {
      window.removeEventListener('followStatusChanged', handleFollowChange);
    };
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setUserStats({});
        return;
      }

      setIsLoading(true);
      API.get(`/users/search?q=${encodeURIComponent(searchTerm)}`)
        .then(response => {
          // Filtrar el usuario actual de los resultados
          const filteredUsers = (response.data.users || []).filter(
            user => user._id !== currentUserId && user.id !== currentUserId
          );
          setSearchResults(filteredUsers);
          
          // Cargar estadísticas para cada usuario
          loadUserStats(filteredUsers);
        })
        .catch(error => {
          console.error('❌ Error al buscar:', error);
          setSearchResults([]);
          setUserStats({});
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 300);
    
    return () => clearTimeout(delayedSearch);
  }, [searchTerm, currentUserId]);

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
            Ver Todos
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
                {searchResults.map(user => {
                  const stats = userStats[user._id] || { followers: 0, following: 0 };
                  
                  return (
                    <div key={user._id || user.id} className="user-card">
                      <div className="user-avatar">
                        <span>
                          {(user.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="user-info">
                        <h4>{user.name} {user.lastname}</h4>
                        <p className="user-email">@{user.nickname}</p>
                        <p className="user-email">{user.email}</p>
                        <p className="user-bio">{user.bio || 'Sin biografía disponible'}</p>
                        <div className="user-stats">
                          <span>{stats.followers} seguidores</span>
                          <span>{stats.following} siguiendo</span>
                        </div>
                      </div>
                      <div className="user-actions">
                        <button 
                          className={`action-btn ${followingUsers.has(user._id) ? 'following' : ''}`}
                          onClick={() => handleFollow(user._id)}
                          disabled={loadingFollow[user._id]}
                        >
                          {loadingFollow[user._id] ? 'Cargando...' : (followingUsers.has(user._id) ? 'Siguiendo' : 'Seguir')}
                        </button>

                        <Link to={`/profile/${user._id}`} className="action-btn">
                          Ver perfil
                        </Link>
                      </div>
                    </div>
                  );
                })}
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
