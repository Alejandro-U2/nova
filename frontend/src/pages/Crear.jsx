import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastNotification';
import '../styles/crear.css';

export default function Crear() {
  const navigate = useNavigate();
  const toast = useToast();
  const [newPost, setNewPost] = useState({
    description: '',
    images: [] // Ahora es un array
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
        setIsPosting(false);
        return;
      }

      const body = {
        description: newPost.description,
        images: newPost.images // Ahora enviamos array de imágenes
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/publications/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setSuccess('¡Publicación creada exitosamente!');
        toast.success('🎉 ¡Publicación creada exitosamente!');
        setNewPost({ description: '', images: [] });
        setTimeout(() => {
          navigate('/inicio');
        }, 1500);
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.message || `Error ${response.status}: ${response.statusText}`;
        setError(errorMsg);
        toast.error(`❌ ${errorMsg}`);
      }
    } catch (error) {
      const errorMsg = 'Error al conectar con el servidor. Verifica que el backend esté funcionando.';
      setError(errorMsg);
      toast.error(`❌ ${errorMsg}`);
      console.error('Error al conectar con el servidor:', error);
    } finally {
      setIsPosting(false);
    }
  };

  // Función para manejar múltiples archivos seleccionados
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Validar número máximo de imágenes
    if (newPost.images.length + files.length > 10) {
      const errorMsg = 'Máximo 10 imágenes por publicación';
      setError(errorMsg);
      toast.warning(`⚠️ ${errorMsg}`);
      return;
    }

    // Convertir cada archivo a base64
    const promises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises)
      .then(base64Images => {
        setNewPost({
          ...newPost,
          images: [...newPost.images, ...base64Images]
        });
        setError('');
      })
      .catch(error => {
        setError('Error al cargar las imágenes');
        console.error('Error:', error);
      });
  };

  // Función para eliminar una imagen
  const removeImage = (index) => {
    setNewPost({
      ...newPost,
      images: newPost.images.filter((_, i) => i !== index)
    });
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
                value={newPost.description}
                onChange={(e) => setNewPost({...newPost, description: e.target.value})}
                rows="4"
                maxLength="500"
              />
              <div className="char-counter">
                {newPost.description.length}/500 caracteres
              </div>
            </div>
            
            <div className="form-section">
              <label>Imágenes ({newPost.images.length}/10)</label>
              <div className="image-upload-section">
                <div className="file-input-section">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input"
                    id="file-upload"
                    multiple
                    disabled={newPost.images.length >= 10}
                  />
                  <label 
                    htmlFor="file-upload" 
                    className={`file-upload-label ${newPost.images.length >= 10 ? 'disabled' : ''}`}
                  >
                    {newPost.images.length === 0 
                      ? '📸 Seleccionar imágenes' 
                      : newPost.images.length >= 10 
                        ? 'Máximo alcanzado (10)'
                        : '➕ Agregar más imágenes'}
                  </label>
                  
                  {/* Preview de imágenes */}
                  {newPost.images.length > 0 && (
                    <div className="images-preview-grid">
                      {newPost.images.map((image, index) => (
                        <div key={index} className="image-preview-item">
                          <img src={image} alt={`Vista previa ${index + 1}`} />
                          <button 
                            className="remove-image-btn"
                            onClick={() => removeImage(index)}
                            type="button"
                          >
                            ✕
                          </button>
                          <span className="image-number">{index + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                disabled={newPost.images.length === 0 || !newPost.description.trim() || isPosting}
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
