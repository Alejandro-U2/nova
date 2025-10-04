import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import '../styles/profile.css';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    coverPhoto: '',
    avatar: ''
  });
  const [uploadMethod, setUploadMethod] = useState({
    coverPhoto: 'url', // 'url' o 'file'
    avatar: 'url'      // 'url' o 'file'
  });
  const [selectedFiles, setSelectedFiles] = useState({
    coverPhoto: null,
    avatar: null
  });

  // Función para obtener el perfil desde el backend
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No hay token de autenticación');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/profile/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setEditForm({
          name: data.profile.name || '',
          bio: data.profile.bio || '',
          coverPhoto: data.profile.coverPhoto || '',
          avatar: data.profile.avatar || ''
        });
      } else {
        console.error('Error al obtener el perfil:', response.statusText);
      }
    } catch (error) {
      console.error('Error al conectar con el servidor:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Obtener datos del usuario desde localStorage para info básica
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Obtener el perfil desde el backend
    fetchProfile();
  }, []);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No hay token de autenticación');
        return;
      }

      // Preparar los datos para enviar
      let dataToSend = { ...editForm };

      // Si hay archivos seleccionados, convertirlos a base64
      if (selectedFiles.coverPhoto && uploadMethod.coverPhoto === 'file') {
        dataToSend.coverPhoto = await convertFileToBase64(selectedFiles.coverPhoto);
      }
      if (selectedFiles.avatar && uploadMethod.avatar === 'file') {
        dataToSend.avatar = await convertFileToBase64(selectedFiles.avatar);
      }

      const response = await fetch('http://localhost:5000/api/profile/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setIsEditing(false);
        console.log('Perfil actualizado exitosamente');
      } else {
        console.error('Error al actualizar el perfil:', response.statusText);
      }
    } catch (error) {
      console.error('Error al conectar con el servidor:', error);
    }
  };

  const handleInputChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleMethodChange = (field, method) => {
    setUploadMethod({
      ...uploadMethod,
      [field]: method
    });
    // Limpiar el campo correspondiente
    if (method === 'url') {
      setSelectedFiles({
        ...selectedFiles,
        [field]: null
      });
    } else {
      setEditForm({
        ...editForm,
        [field]: ''
      });
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFiles({
        ...selectedFiles,
        [field]: file
      });
      
      // Convertir archivo a base64 para preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditForm({
          ...editForm,
          [field]: event.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  if (loading) {
    return (
      <div className="profile-container">
        <Navbar />
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  // Usar datos del perfil del backend si están disponibles, sino usar datos básicos del usuario
  const displayData = profile || user || {};

  return (
    <div className="profile-container">
      <Navbar />

      <div className="profile-content">
        {/* Portada */}
        <div className="profile-cover">
          <img
            src={displayData.coverPhoto || "https://picsum.photos/1200/300"}
            alt="Foto de portada"
            className="cover-image"
          />
        </div>

        {/* Info usuario con avatar al lado */}
        <div className="profile-info-section inline">
          <div className="avatar-container-inline">
            {displayData.avatar ? (
              <img src={displayData.avatar} alt="Avatar" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar">
                {displayData.name?.charAt(0) || user?.name?.charAt(0) || "U"}
              </div>
            )}
          </div>

          <div className="user-details">
            <h2 className="user-name">{displayData.name || user?.name || "Usuario"}</h2>
            <p className="user-bio">{displayData.bio || "Sin biografía"}</p>
          </div>

          <div className="profile-actions">
            <button className="primary-btn">+ Añadir a historia</button>
            <button className="secondary-btn" onClick={handleEditToggle}>
              Editar perfil
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-number">12</span>
            <span className="stat-label">Publicaciones</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">85</span>
            <span className="stat-label">Seguidores</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">42</span>
            <span className="stat-label">Siguiendo</span>
          </div>
        </div>

        {/* Actividad */}
        <div className="recent-activity">
          <h3 className="section-title">Actividad reciente</h3>
          <div className="activity-list">
            <div className="activity-item">
              <p className="activity-text">
                "¡Hola mundo! Esta es mi primera publicación en Nova."
              </p>
              <span className="activity-date">Hace 2 días</span>
            </div>
            <div className="activity-item">
              <p className="activity-text">
                "Explorando las nuevas funcionalidades de la plataforma."
              </p>
              <span className="activity-date">Hace 1 semana</span>
            </div>
            <div className="activity-item">
              <p className="activity-text">
                "¡Qué gran comunidad estamos construyendo aquí!"
              </p>
              <span className="activity-date">Hace 2 semanas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de edición */}
      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="edit-header">
              <h2 className="edit-title">Editar perfil</h2>
              <button className="close-btn" onClick={handleEditToggle}>
                ✕
              </button>
            </div>

            <div className="edit-form">
              {/* Foto de portada */}
              <div className="form-group">
                <label className="form-label">Foto de portada</label>
                <div className="upload-method-selector">
                  <button 
                    type="button"
                    className={`method-btn ${uploadMethod.coverPhoto === 'url' ? 'active' : ''}`}
                    onClick={() => handleMethodChange('coverPhoto', 'url')}
                  >
                    URL
                  </button>
                  <button 
                    type="button"
                    className={`method-btn ${uploadMethod.coverPhoto === 'file' ? 'active' : ''}`}
                    onClick={() => handleMethodChange('coverPhoto', 'file')}
                  >
                    Archivo
                  </button>
                </div>
                
                {uploadMethod.coverPhoto === 'url' ? (
                  <input
                    type="url"
                    name="coverPhoto"
                    value={editForm.coverPhoto}
                    onChange={handleInputChange}
                    className="form-input-url"
                    placeholder="https://ejemplo.com/portada.jpg"
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'coverPhoto')}
                    className="form-input"
                  />
                )}
              </div>

              {/* Foto de perfil */}
              <div className="form-group">
                <label className="form-label">Foto de perfil</label>
                <div className="upload-method-selector">
                  <button 
                    type="button"
                    className={`method-btn ${uploadMethod.avatar === 'url' ? 'active' : ''}`}
                    onClick={() => handleMethodChange('avatar', 'url')}
                  >
                    URL
                  </button>
                  <button 
                    type="button"
                    className={`method-btn ${uploadMethod.avatar === 'file' ? 'active' : ''}`}
                    onClick={() => handleMethodChange('avatar', 'file')}
                  >
                    Archivo
                  </button>
                </div>
                
                {uploadMethod.avatar === 'url' ? (
                  <input
                    type="url"
                    name="avatar"
                    value={editForm.avatar}
                    onChange={handleInputChange}
                    className="form-input-url"
                    placeholder="https://ejemplo.com/avatar.jpg"
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'avatar')}
                    className="form-input"
                  />
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Tu nombre"
                />
              </div>

             
              <div className="form-group">
                <label className="form-label">Biografía</label>
                <textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Cuéntanos algo sobre ti..."
                  rows="4"
                />
              </div>

              <div className="form-actions">
                <button className="save-btn" onClick={handleSave}>
                  Guardar cambios
                </button>
                <button className="cancel-btn" onClick={handleEditToggle}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
