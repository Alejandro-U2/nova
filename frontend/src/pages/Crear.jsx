import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/crear.css';

export default function Crear() {
  const navigate = useNavigate();
  const [newPost, setNewPost] = useState({
    description: '',
    image: '',
    imageType: 'url'
  });
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Función para crear nueva publicación
  const createPublication = async () => {
    try {
      setIsPosting(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/publications/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPost)
      });

      if (response.ok) {
        setSuccess('¡Publicación creada exitosamente!');
        setNewPost({ description: '', image: '', imageType: 'url' });
        // Esperar un momento para mostrar el mensaje de éxito
        setTimeout(() => {
          navigate('/home');
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setError('Error al conectar con el servidor. Verifica que el backend esté funcionando.');
      console.error('Error al conectar con el servidor:', error);
    } finally {
      setIsPosting(false);
    }
  };

  // Función para manejar el archivo seleccionado
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewPost({
          ...newPost,
          image: event.target.result,
          imageType: 'base64'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="crear-container">
      
      <main className="crear-content">
        <div className="crear-header">
          <h1>Crear Nueva Publicación</h1>
          <p>Comparte una imagen y describe tu momento especial</p>
        </div>

        <div className="crear-form-container">
          <div className="create-post-form">
            {/* Mensajes de error y éxito */}
            {error && (
              <div className="message error-message">
                ❌ {error}
              </div>
            )}
            {success && (
              <div className="message success-message">
                ✅ {success}
              </div>
            )}
            
            <div className="form-section">
              <label htmlFor="description">Descripción</label>
              <textarea 
                id="description"
                placeholder="¿Qué quieres compartir con la comunidad?"
                value={newPost.description || ''}
                onChange={(e) => setNewPost({...newPost, description: e.target.value})}
                rows="4"
                maxLength="500"
              />
              <div className="char-counter">
                {newPost.description.length}/500 caracteres
              </div>
            </div>
            
            <div className="form-section">
              <label>Imagen</label>
              <div className="image-upload-section">
                <div className="upload-options">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="imageType"
                      value="url"
                      checked={newPost.imageType === 'url'}
                      onChange={(e) => setNewPost({...newPost, imageType: e.target.value, image: ''})}
                    />
                    <span>URL de imagen</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="imageType"
                      value="file"
                      checked={newPost.imageType === 'file'}
                      onChange={(e) => setNewPost({...newPost, imageType: e.target.value, image: ''})}
                    />
                    <span>Subir archivo</span>
                  </label>
                </div>

                {newPost.imageType === 'url' ? (
                  <div className="url-input-section">
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      value={newPost.image || ''}
                      onChange={(e) => setNewPost({...newPost, image: e.target.value})}
                      className="url-input"
                    />
                    {newPost.image && (
                      <div className="image-preview">
                        <img src={newPost.image} alt="Vista previa" onError={(e) => e.target.style.display = 'none'} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="file-input-section">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="file-input"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="file-upload-label">
                      {newPost.image ? 'Cambiar imagen' : 'Seleccionar imagen'}
                    </label>
                    {newPost.image && (
                      <div className="image-preview">
                        <img src={newPost.image} alt="Vista previa" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="cancel-btn"
                onClick={() => navigate('/home')}
                disabled={isPosting}
              >
                Cancelar
              </button>
              <button 
                className="publish-btn"
                onClick={createPublication}
                disabled={!newPost.image || !newPost.description.trim() || isPosting}
              >
                {isPosting ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>

          <div className="tips-section">
            <h3>💡 Consejos para una buena publicación</h3>
            <ul>
              <li>Usa una descripción clara y atractiva</li>
              <li>Asegúrate de que la imagen sea de buena calidad</li>
              <li>Respeta las normas de la comunidad</li>
              <li>Comparte momentos genuinos y positivos</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}