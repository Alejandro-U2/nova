import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import '../styles/profile.css';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    bio: ''
  });

  useEffect(() => {
    // Obtener datos del usuario desde localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setEditForm({
        name: parsedUser.name || '',
        email: parsedUser.email || '',
        bio: parsedUser.bio || 'Cuéntanos algo sobre ti...'
      });
    }
  }, []);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    // Aquí podrías enviar los datos al backend
    const updatedUser = { ...user, ...editForm };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="profile-container">
      <Navbar />
      
      <main className="profile-content">
        <div className="profile-header">
          <div className="profile-banner">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                {user.name?.charAt(0) || 'U'}
              </div>
              <button className="change-photo-btn">
                📷 Cambiar foto
              </button>
            </div>
          </div>
        </div>

        <div className="profile-info">
          <div className="profile-main">
            <div className="profile-details">
              {!isEditing ? (
                <div className="view-mode">
                  <h1>{user.name || 'Usuario'}</h1>
                  <p className="user-email">{user.email}</p>
                  <p className="user-bio">{user.bio || 'Cuéntanos algo sobre ti...'}</p>
                  
                  <div className="profile-stats">
                    <div className="stat">
                      <strong>12</strong>
                      <span>Publicaciones</span>
                    </div>
                    <div className="stat">
                      <strong>85</strong>
                      <span>Seguidores</span>
                    </div>
                    <div className="stat">
                      <strong>42</strong>
                      <span>Siguiendo</span>
                    </div>
                  </div>

                  <button className="edit-profile-btn" onClick={handleEditToggle}>
                    ✏️ Editar Perfil
                  </button>
                </div>
              ) : (
                <div className="edit-mode">
                  <h2>Editar Perfil</h2>
                  
                  <div className="edit-form">
                    <div className="form-group">
                      <label>Nombre:</label>
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleInputChange}
                        placeholder="Tu nombre"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Email:</label>
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleInputChange}
                        placeholder="tu@email.com"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Biografía:</label>
                      <textarea
                        name="bio"
                        value={editForm.bio}
                        onChange={handleInputChange}
                        placeholder="Cuéntanos algo sobre ti..."
                        rows="4"
                      />
                    </div>
                    
                    <div className="edit-actions">
                      <button className="save-btn" onClick={handleSave}>
                        💾 Guardar
                      </button>
                      <button className="cancel-btn" onClick={handleEditToggle}>
                        ❌ Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="profile-sidebar">
            <div className="profile-card">
              <h3>Información</h3>
              <div className="info-item">
                <span className="info-label">📅 Se unió:</span>
                <span className="info-value">Enero 2024</span>
              </div>
              <div className="info-item">
                <span className="info-label">🌍 Ubicación:</span>
                <span className="info-value">No especificada</span>
              </div>
              <div className="info-item">
                <span className="info-label">🎂 Cumpleaños:</span>
                <span className="info-value">No especificado</span>
              </div>
            </div>

            <div className="activity-card">
              <h3>Actividad Reciente</h3>
              <ul className="activity-list">
                <li>📝 Publicó una nueva entrada</li>
                <li>❤️ Le gustó una publicación</li>
                <li>👥 Siguió a 2 nuevos usuarios</li>
                <li>💬 Comentó en una publicación</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="profile-posts">
          <h3>Mis Publicaciones</h3>
          <div className="posts-grid">
            <div className="post-preview">
              <p>"¡Hola mundo! Esta es mi primera publicación en Nova."</p>
              <span className="post-date">Hace 2 días</span>
            </div>
            <div className="post-preview">
              <p>"Explorando las nuevas funcionalidades de la plataforma."</p>
              <span className="post-date">Hace 1 semana</span>
            </div>
            <div className="post-preview">
              <p>"¡Qué gran comunidad estamos construyendo aquí!"</p>
              <span className="post-date">Hace 2 semanas</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}