import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import '../styles/faceRecognition.css';

const FaceRecognition = ({ onClose }) => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detections, setDetections] = useState([]);
  
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



  return (
    <div className="face-recognition-modal">
      <div className="face-recognition-container">
        <div className="face-recognition-header">
          <h2>🎭 Reconocimiento Facial</h2>
          <button onClick={onClose} className="close-btn">✕</button>
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
                <button onClick={detectFacesLocal} disabled={loading} className="action-btn">
                  {loading ? '⏳ Detectando...' : '🎯 Detectar Rostros'}
                </button>
              </div>
            )}

            {detections.length > 0 && (
              <div className="results">
                <h3>📊 Resultados - {detections.length} rostro{detections.length !== 1 ? 's detectados' : ' detectado'}</h3>
                {detections.map((detection, idx) => (
                  <div key={idx} className="detection-result">
                    <h4>👤 Rostro #{idx + 1}</h4>
                    {detection.age && (
                      <p><strong>Edad estimada:</strong> {Math.round(detection.age)} años</p>
                    )}
                    {detection.gender && (
                      <p><strong>Género:</strong> {detection.gender === 'male' ? 'Masculino' : 'Femenino'} ({Math.round(detection.genderProbability * 100)}% confianza)</p>
                    )}
                    {detection.expressions && (
                      <div className="expressions">
                        <p><strong>Expresiones detectadas:</strong></p>
                        <ul>
                          {Object.entries(detection.expressions)
                            .sort(([,a], [,b]) => b - a)
                            .map(([expr, value]) => {
                              const expressionLabels = {
                                neutral: 'Neutral',
                                happy: 'Feliz',
                                sad: 'Triste',
                                angry: 'Enojado',
                                fearful: 'Temeroso',
                                disgusted: 'Disgustado',
                                surprised: 'Sorprendido'
                              };
                              return (
                                <li key={expr}>
                                  {expressionLabels[expr] || expr}: {Math.round(value * 100)}%
                                </li>
                              );
                            })}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FaceRecognition;
