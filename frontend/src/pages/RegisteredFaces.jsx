import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastNotification';
import '../styles/registeredFaces.css';

const RegisteredFaces = () => {
  const [faces, setFaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFace, setSelectedFace] = useState(null);
  
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadFaces();
  }, []);

  const loadFaces = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/face-data/list', {
        method: 'GET',
        headers: {
          'Authorization': token
        }
      });

      const data = await response.json();

      if (data.status === 'success') {
        setFaces(data.faces);
      } else {
        toast.error('Error al cargar los rostros');
      }

    } catch (error) {
      console.error('Error al cargar rostros:', error);
      toast.error('Error al cargar los rostros');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (face) => {
    setSelectedFace(face);
    setShowDeleteModal(true);
  };

  const handleDeleteFace = async () => {
    if (!selectedFace) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:5000/api/face-data/delete/${selectedFace._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success('Rostro eliminado exitosamente');
        setFaces(faces.filter(f => f._id !== selectedFace._id));
        setShowDeleteModal(false);
        setSelectedFace(null);
      } else {
        toast.error(data.message || 'Error al eliminar el rostro');
      }

    } catch (error) {
      console.error('Error al eliminar rostro:', error);
      toast.error('Error al eliminar el rostro');
    } finally {
      setLoading(false);
    }
  };

  const getExpressionEmoji = (expression) => {
    const emojis = {
      neutral: '😐',
      happy: '😊',
      sad: '😢',
      angry: '😠',
      fearful: '😨',
      disgusted: '🤢',
      surprised: '😮'
    };
    return emojis[expression] || '😐';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="registered-faces-page">
      <div className="registered-faces-container">
        <div className="page-header">
          <div className="header-content">
            <button className="back-btn" onClick={() => navigate('/face-detection')}>
              ← Volver
            </button>
            <h1>👥 Rostros Registrados</h1>
            <p className="subtitle">Todos los rostros que has guardado</p>
          </div>
        </div>

        {loading && faces.length === 0 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando rostros...</p>
          </div>
        ) : faces.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No hay rostros registrados</h3>
            <p>Comienza detectando y registrando rostros en la sección de detección</p>
            <button className="primary-btn" onClick={() => navigate('/face-detection')}>
              🎭 Ir a Detección de Rostros
            </button>
          </div>
        ) : (
          <>
            <div className="faces-stats">
              <div className="stat-card">
                <span className="stat-number">{faces.length}</span>
                <span className="stat-label">Rostro{faces.length !== 1 ? 's' : ''} registrado{faces.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="faces-grid">
              {faces.map((face) => (
                <div key={face._id} className="face-card">
                  <div className="face-image-container">
                    <img 
                      src={`http://localhost:5000/uploads/faces/${face.image}`} 
                      alt={face.name}
                      className="face-image"
                    />
                    <button 
                      className="delete-btn-overlay" 
                      onClick={() => openDeleteModal(face)}
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <div className="face-info">
                    <h3 className="face-name">{face.name}</h3>
                    
                    <div className="face-details">
                      {face.age && (
                        <div className="detail-item">
                          <span className="detail-icon">🎂</span>
                          <span className="detail-text">{face.age} años</span>
                        </div>
                      )}
                      
                      {face.gender && (
                        <div className="detail-item">
                          <span className="detail-icon">
                            {face.gender === 'male' ? '👨' : '👩'}
                          </span>
                          <span className="detail-text">
                            {face.gender === 'male' ? 'Masculino' : 'Femenino'}
                          </span>
                        </div>
                      )}
                      
                      {face.expression && (
                        <div className="detail-item">
                          <span className="detail-icon">
                            {getExpressionEmoji(face.expression)}
                          </span>
                          <span className="detail-text capitalize">{face.expression}</span>
                        </div>
                      )}
                    </div>

                    <div className="face-date">
                      <span className="date-icon">📅</span>
                      <span className="date-text">{formatDate(face.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && selectedFace && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Confirmar Eliminación</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que quieres eliminar el rostro de:</p>
              <p className="face-name-highlight">{selectedFace.name}</p>
              <p className="warning-text">Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn cancel-btn" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="modal-btn delete-btn-confirm" 
                onClick={handleDeleteFace}
                disabled={loading}
              >
                {loading ? 'Eliminando...' : '🗑️ Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisteredFaces;
