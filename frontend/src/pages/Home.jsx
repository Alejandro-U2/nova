import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import '../styles/home.css';
import './Home.css'; // Importando estilos minimalistas

export default function Home() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Obtener datos del usuario desde localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Posts de ejemplo (temporal)
    setPosts([
      {
        id: 1,
        author: 'Usuario Demo',
        content: '¡Bienvenido a Nova! Esta es una publicación de ejemplo.',
        time: '2 horas ago',
        likes: 12,
        comments: 3
      },
      {
        id: 2,
        author: 'Nova Team',
        content: 'Estamos trabajando en nuevas funcionalidades. ¡Mantente atento! 🚀',
        time: '5 horas ago',
        likes: 25,
        comments: 7
      },
      {
        id: 3,
        author: 'Desarrollador',
        content: 'El sistema está funcionando correctamente. Prueba todas las funciones disponibles.',
        time: '1 día ago',
        likes: 8,
        comments: 2
      }
    ]);
  }, []);

  return (
    <div className="home-container">
      <Navbar />
      
      <main className="home-content">
        <div className="welcome-section">
          <h1>¡Bienvenido{user?.name ? `, ${user.name}` : ''}!</h1>
          <p>Aquí tienes un resumen de lo que está pasando en Nova</p>
        </div>

        <div className="content-grid">
          <div className="main-feed">
            <div className="create-post">
              <h3>¿Qué estás pensando?</h3>
              <textarea 
                placeholder="Comparte algo interesante..."
                rows="3"
              ></textarea>
              <button className="post-btn">Publicar</button>
            </div>

            <div className="posts-feed">
              <h3>Publicaciones Recientes</h3>
              {posts.map(post => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="post-author">
                      <div className="author-avatar">
                        {post.author.charAt(0)}
                      </div>
                      <div className="author-info">
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
          </div>

          <div className="sidebar">
            <div className="stats-card">
              <h3>Estadísticas</h3>
              <div className="stat-item">
                <span className="stat-label">Publicaciones</span>
                <span className="stat-value">12</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Seguidores</span>
                <span className="stat-value">85</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Siguiendo</span>
                <span className="stat-value">42</span>
              </div>
            </div>

            <div className="suggestions-card">
              <h3>Sugerencias</h3>
              <ul>
                <li>📝 Completa tu perfil</li>
                <li>🔍 Busca nuevos amigos</li>
                <li>📱 Descarga la app móvil</li>
                <li>🔔 Activa las notificaciones</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}