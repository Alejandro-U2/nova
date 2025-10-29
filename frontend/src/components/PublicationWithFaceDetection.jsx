import React, { useState } from 'react';
import axios from 'axios';

/**
 * Componente de ejemplo que muestra cómo integrar el reconocimiento facial
 * en el flujo de creación de publicaciones
 */
const PublicationWithFaceDetection = () => {
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const API_BASE = 'http://localhost:5000/api';

  // Manejar selección de imagen
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;
      setImage(base64Image);
      
      // Auto-detectar rostros al seleccionar imagen
      await detectFacesInImage(base64Image);
    };
    reader.readAsDataURL(file);
  };

  // Detectar rostros en la imagen
  const detectFacesInImage = async (imageBase64) => {
    try {
      setAnalyzing(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${API_BASE}/face-recognition/detect`,
        { image: imageBase64 },
        { headers: { Authorization: token } }
      );

      setDetectedFaces(response.data.faces);
      console.log('Rostros detectados:', response.data.faces);
    } catch (error) {
      console.error('Error al detectar rostros:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Crear publicación
  const createPublication = async () => {
    if (!image) {
      alert('Por favor selecciona una imagen');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // 1. Crear la publicación
      const pubResponse = await axios.post(
        `${API_BASE}/publications`,
        {
          images: [image],
          description
        },
        { headers: { Authorization: token } }
      );

      const publicationId = pubResponse.data.publication._id;

      // 2. Analizar rostros en la publicación (opcional)
      if (detectedFaces.length > 0) {
        await axios.post(
          `${API_BASE}/face-recognition/analyze/${publicationId}`,
          {},
          { headers: { Authorization: token } }
        );
      }

      alert('✅ Publicación creada con éxito');
      
      // Limpiar formulario
      setImage(null);
      setDescription('');
      setDetectedFaces([]);

    } catch (error) {
      console.error('Error al crear publicación:', error);
      alert('❌ Error al crear la publicación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">📸 Crear Publicación</h2>

      {/* Selector de imagen */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecciona una imagen
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
        />
      </div>

      {/* Preview de imagen */}
      {image && (
        <div className="mb-4">
          <img
            src={image}
            alt="Preview"
            className="w-full h-auto max-h-96 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Análisis de rostros */}
      {analyzing && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-700">🔍 Analizando rostros...</p>
        </div>
      )}

      {/* Rostros detectados */}
      {detectedFaces.length > 0 && (
        <div className="mb-4 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">
            ✅ {detectedFaces.length} rostro(s) detectado(s)
          </h3>
          <div className="space-y-2">
            {detectedFaces.map((face, idx) => (
              <div key={idx} className="text-sm text-green-700">
                <p>
                  👤 Rostro {idx + 1}:{' '}
                  {face.age && `${Math.round(face.age)} años, `}
                  {face.gender && `${face.gender}`}
                </p>
                {face.expressions && (
                  <p className="text-xs text-green-600">
                    Expresión: {Object.keys(face.expressions).reduce((a, b) =>
                      face.expressions[a] > face.expressions[b] ? a : b
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Descripción */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Escribe algo sobre esta foto..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-violet-500"
          rows={4}
        />
      </div>

      {/* Botón de publicar */}
      <button
        onClick={createPublication}
        disabled={loading || !image}
        className="w-full bg-gradient-to-r from-violet-500 to-purple-600
          text-white font-semibold py-3 px-6 rounded-lg
          hover:from-violet-600 hover:to-purple-700
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200"
      >
        {loading ? '⏳ Publicando...' : '📤 Publicar'}
      </button>

      {/* Info adicional */}
      {detectedFaces.length > 0 && (
        <div className="mt-4 text-xs text-gray-500">
          💡 Tip: Los rostros detectados se guardarán automáticamente
          con la publicación para futuras búsquedas.
        </div>
      )}
    </div>
  );
};

export default PublicationWithFaceDetection;
