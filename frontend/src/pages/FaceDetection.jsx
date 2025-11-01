import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastNotification';
import '../styles/faceDetection.css';

const FaceDetection = () => {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detections, setDetections] = useState([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [faceName, setFaceName] = useState('');
  const [selectedFaceIndex, setSelectedFaceIndex] = useState(null);
  
  const navigate = useNavigate();
  const toast = useToast();
  const imageRef = useRef();
  const canvasRef = useRef();

  // Cargar modelos de face-api.js
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        const MODEL_URL = '/models'; // Debes colocar los modelos en public/models
        
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
        ]);
        
        setModelsLoaded(true);
        console.log('✅ Modelos cargados');
      } catch (error) {
        console.error('Error al cargar modelos:', error);
        alert('Error al cargar los modelos de reconocimiento facial');
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  // Manejar selección de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setImagePreview(reader.result);
        setDetections([]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Detectar rostros en la imagen (solo frontend)
  const detectFacesLocal = async () => {
    if (!image || !modelsLoaded) return;

    try {
      setLoading(true);
      const img = await faceapi.fetchImage(imagePreview);
      
      const detections = await faceapi
        .detectAllFaces(img)
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions()
        .withAgeAndGender();

      setDetections(detections);
      drawDetections(img, detections);
      
    } catch (error) {
      console.error('Error al detectar rostros:', error);
      alert('Error al detectar rostros');
    } finally {
      setLoading(false);
    }
  };

  // Dibujar detecciones en el canvas
  const drawDetections = (img, detections) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const displaySize = { width: img.width, height: img.height };
    
    faceapi.matchDimensions(canvas, displaySize);
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar cajas de detección
    faceapi.draw.drawDetections(canvas, resizedDetections);
    
    // Dibujar landmarks
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    
    // Dibujar expresiones y edad/género
    resizedDetections.forEach(detection => {
      const box = detection.detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: `${Math.round(detection.age)} años, ${detection.gender}`
      });
      drawBox.draw(canvas);

      // Mostrar expresión dominante
      const expressions = detection.expressions;
      const maxExpression = Object.keys(expressions).reduce((a, b) => 
        expressions[a] > expressions[b] ? a : b
      );
      
      const expressionText = `${maxExpression}: ${Math.round(expressions[maxExpression] * 100)}%`;
      ctx.fillStyle = 'white';
      ctx.fillRect(box.x, box.y + box.height + 5, 200, 25);
      ctx.fillStyle = 'black';
      ctx.font = '14px Arial';
      ctx.fillText(expressionText, box.x + 5, box.y + box.height + 20);
    });
  };

  // Abrir modal para registrar rostro
  const openRegisterModal = (index) => {
    setSelectedFaceIndex(index);
    setShowRegisterModal(true);
    setFaceName('');
  };

  // Registrar rostro
  const handleRegisterFace = async () => {
    if (!faceName.trim()) {
      toast.warning('Por favor ingresa un nombre');
      return;
    }

    if (selectedFaceIndex === null || !detections[selectedFaceIndex]) {
      toast.error('No se encontró el rostro seleccionado');
      return;
    }

    if (!imageFile) {
      toast.error('No se encontró la imagen original');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const detection = detections[selectedFaceIndex];

      // Verificar que el descriptor existe
      if (!detection.descriptor) {
        toast.error('No se pudo obtener el descriptor facial');
        return;
      }

      // Obtener expresión dominante
      const expressions = detection.expressions;
      const maxExpression = Object.entries(expressions).reduce((a, b) => 
        a[1] > b[1] ? a : b
      )[0];

      // Preparar FormData
      const formData = new FormData();
      formData.append('file0', imageFile, imageFile.name || 'face.jpg');
      formData.append('name', faceName.trim());
      formData.append('descriptor', JSON.stringify(Array.from(detection.descriptor)));
      formData.append('age', Math.round(detection.age));
      formData.append('gender', detection.gender);
      formData.append('expression', maxExpression);

      const response = await fetch('http://localhost:5000/api/face-data/save', {
        method: 'POST',
        headers: {
          'Authorization': token
        },
        body: formData
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success('¡Rostro registrado exitosamente! 🎉');
        setShowRegisterModal(false);
        setFaceName('');
      } else {
        toast.error(data.message || 'Error al registrar el rostro');
      }

    } catch (error) {
      console.error('Error al registrar rostro:', error);
      toast.error('Error al registrar el rostro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="face-detection-page">
      <div className="face-detection-container">
        <div className="face-detection-header">
          <h2>🎭 Detección de Rostros</h2>
          <p className="subtitle">Analiza expresiones, edad y género en fotografías</p>
        </div>

        {!modelsLoaded && (
          <div className="loading-models">
            <div className="spinner"></div>
            <p>Cargando modelos de IA...</p>
          </div>
        )}

        {modelsLoaded && (
          <>
            <div className="upload-section">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                id="imageInput"
                style={{ display: 'none' }}
              />
              <label htmlFor="imageInput" className="upload-btn">
                📷 Seleccionar Imagen
              </label>
            </div>

            {imagePreview && (
              <div className="image-container">
                <img 
                  ref={imageRef}
                  src={imagePreview} 
                  alt="Preview" 
                  className="preview-image"
                />
                <canvas ref={canvasRef} className="detection-canvas" />
              </div>
            )}

            {image && (
              <div className="actions">
                <button onClick={detectFacesLocal} disabled={loading} className="action-btn detect-btn">
                  {loading ? '⏳ Detectando...' : '🎯 Detectar Rostros'}
                </button>
                <button 
                  onClick={() => navigate('/registered-faces')} 
                  className="action-btn view-btn"
                >
                  👥 Ver Rostros Registrados
                </button>
              </div>
            )}

            {detections.length > 0 && (
              <div className="results">
                <h3>📊 Análisis Completado</h3>
                <div className="results-summary">
                  <div className="summary-card">
                    <span className="summary-number">{detections.length}</span>
                    <span className="summary-label">Rostro{detections.length !== 1 ? 's' : ''} detectado{detections.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                
                <div className="detections-grid">
                  {detections.map((detection, idx) => {
                    // Encontrar la expresión dominante
                    const expressions = detection.expressions;
                    const maxExpression = Object.entries(expressions).reduce((a, b) => 
                      a[1] > b[1] ? a : b
                    );
                    
                    const expressionLabels = {
                      neutral: { emoji: '😐', label: 'Neutral' },
                      happy: { emoji: '😊', label: 'Feliz' },
                      sad: { emoji: '😢', label: 'Triste' },
                      angry: { emoji: '😠', label: 'Enojado' },
                      fearful: { emoji: '😨', label: 'Temeroso' },
                      disgusted: { emoji: '🤢', label: 'Disgustado' },
                      surprised: { emoji: '😮', label: 'Sorprendido' }
                    };

                    return (
                      <div key={idx} className="detection-card">
                        <div className="card-header">
                          <h4>👤 Rostro #{idx + 1}</h4>
                          <div className="dominant-expression">
                            <span className="expression-emoji">
                              {expressionLabels[maxExpression[0]]?.emoji || '😐'}
                            </span>
                            <span className="expression-label">
                              {expressionLabels[maxExpression[0]]?.label || 'Neutral'}
                            </span>
                          </div>
                        </div>

                        <div className="card-body">
                          {/* Información básica */}
                          <div className="info-grid">
                            {detection.age && (
                              <div className="info-item">
                                <div className="info-icon">🎂</div>
                                <div className="info-content">
                                  <span className="info-label">Edad estimada</span>
                                  <span className="info-value">{Math.round(detection.age)} años</span>
                                </div>
                              </div>
                            )}
                            
                            {detection.gender && (
                              <div className="info-item">
                                <div className="info-icon">
                                  {detection.gender === 'male' ? '👨' : '👩'}
                                </div>
                                <div className="info-content">
                                  <span className="info-label">Género</span>
                                  <span className="info-value">
                                    {detection.gender === 'male' ? 'Masculino' : 'Femenino'}
                                    <span className="confidence"> ({Math.round(detection.genderProbability * 100)}%)</span>
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Expresiones faciales */}
                          {detection.expressions && (
                            <div className="expressions-section">
                              <h5>📈 Análisis de Expresiones</h5>
                              <div className="expressions-list">
                                {Object.entries(detection.expressions)
                                  .sort(([,a], [,b]) => b - a)
                                  .map(([expr, value]) => {
                                    const exprInfo = expressionLabels[expr];
                                    const percentage = Math.round(value * 100);
                                    
                                    return (
                                      <div key={expr} className="expression-bar">
                                        <div className="expression-header">
                                          <span className="expression-name">
                                            {exprInfo?.emoji || '😐'} {exprInfo?.label || expr}
                                          </span>
                                          <span className="expression-percentage">{percentage}%</span>
                                        </div>
                                        <div className="progress-bar">
                                          <div 
                                            className="progress-fill" 
                                            style={{ 
                                              width: `${percentage}%`,
                                              background: percentage > 50 
                                                ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                                                : percentage > 30
                                                ? 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)'
                                                : 'linear-gradient(90deg, #fbc2eb 0%, #a6c1ee 100%)'
                                            }}
                                          ></div>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Botón para registrar este rostro */}
                        <div className="card-footer">
                          <button 
                            className="register-face-btn" 
                            onClick={() => openRegisterModal(idx)}
                          >
                            💾 Registrar este Rostro
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal para registrar rostro */}
      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💾 Registrar Rostro</h3>
              <button className="modal-close" onClick={() => setShowRegisterModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Ingresa un nombre para identificar este rostro en el futuro
              </p>
              <input
                type="text"
                className="face-name-input"
                placeholder="Ej: Juan Pérez, María García..."
                value={faceName}
                onChange={(e) => setFaceName(e.target.value)}
                maxLength={50}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn cancel-btn" 
                onClick={() => setShowRegisterModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="modal-btn save-btn" 
                onClick={handleRegisterFace}
                disabled={loading || !faceName.trim()}
              >
                {loading ? '⏳ Guardando...' : '✅ Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceDetection;
