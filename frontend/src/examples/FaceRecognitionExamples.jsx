// ========================================
// EJEMPLOS PRÁCTICOS DE USO
// Sistema de Reconocimiento Facial
// ========================================

// ==========================================
// EJEMPLO 1: Botón simple en cualquier página
// ==========================================

import React, { useState } from 'react';
import FaceRecognition from '../components/FaceRecognition';

function MiPagina() {
  const [showFaceModal, setShowFaceModal] = useState(false);

  return (
    <div>
      <h1>Mi Página</h1>
      
      <button 
        onClick={() => setShowFaceModal(true)}
        className="bg-purple-600 text-white px-4 py-2 rounded"
      >
        🎭 Reconocimiento Facial
      </button>

      {showFaceModal && (
        <FaceRecognition onClose={() => setShowFaceModal(false)} />
      )}
    </div>
  );
}

// ==========================================
// EJEMPLO 2: Registrar rostro en el perfil
// ==========================================

import axios from 'axios';

const ProfilePage = () => {
  const registerMyFace = async () => {
    // 1. Obtener imagen (desde input file o camera)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const imageBase64 = event.target.result;
        const token = localStorage.getItem('token');

        try {
          // 2. Registrar el rostro
          const response = await axios.post(
            'http://localhost:5000/api/face-recognition/register',
            { 
              image: imageBase64, 
              label: 'foto_perfil_principal' 
            },
            { headers: { Authorization: token } }
          );

          alert(response.data.message);
        } catch (error) {
          alert('Error al registrar rostro');
          console.error(error);
        }
      };

      reader.readAsDataURL(file);
    };

    fileInput.click();
  };

  return (
    <div>
      <h2>Mi Perfil</h2>
      <button onClick={registerMyFace}>
        📸 Registrar mi rostro para reconocimiento
      </button>
    </div>
  );
};

// ==========================================
// EJEMPLO 3: Auto-detectar al crear publicación
// ==========================================

const CreatePublication = () => {
  const [image, setImage] = useState(null);
  const [faceInfo, setFaceInfo] = useState(null);

  const handleImageUpload = async (file) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const base64Image = e.target.result;
      setImage(base64Image);

      // Auto-detectar rostros
      const token = localStorage.getItem('token');
      
      try {
        const response = await axios.post(
          'http://localhost:5000/api/face-recognition/detect',
          { image: base64Image },
          { headers: { Authorization: token } }
        );

        setFaceInfo({
          count: response.data.count,
          faces: response.data.faces
        });

        // Mostrar información al usuario
        if (response.data.count > 0) {
          console.log(`Se detectaron ${response.data.count} rostros`);
        }
      } catch (error) {
        console.error('Error al detectar rostros:', error);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => handleImageUpload(e.target.files[0])} 
      />
      
      {faceInfo && (
        <div className="bg-blue-100 p-4 rounded">
          <p>✅ {faceInfo.count} rostro(s) detectado(s)</p>
          {faceInfo.faces.map((face, idx) => (
            <div key={idx}>
              <p>Rostro {idx + 1}: {Math.round(face.age)} años, {face.gender}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// EJEMPLO 4: Buscar publicaciones con una persona
// ==========================================

const SearchByFace = () => {
  const [searchImage, setSearchImage] = useState(null);
  const [results, setResults] = useState(null);

  const searchByFace = async () => {
    if (!searchImage) return;

    const token = localStorage.getItem('token');

    try {
      // 1. Reconocer quién es en la imagen
      const recognitionResponse = await axios.post(
        'http://localhost:5000/api/face-recognition/recognize',
        { image: searchImage, threshold: 0.6 },
        { headers: { Authorization: token } }
      );

      const faces = recognitionResponse.data.faces;

      if (faces.length === 0) {
        alert('No se detectó ningún rostro');
        return;
      }

      // 2. Obtener el mejor match
      const bestMatch = faces[0].matches?.[0];

      if (!bestMatch) {
        alert('No se encontraron coincidencias');
        return;
      }

      // 3. Buscar publicaciones de ese usuario
      // (Necesitarás crear este endpoint)
      const pubResponse = await axios.get(
        `http://localhost:5000/api/publications/user/${bestMatch.user._id}`,
        { headers: { Authorization: token } }
      );

      setResults({
        user: bestMatch.user,
        publications: pubResponse.data.publications
      });

    } catch (error) {
      console.error('Error en búsqueda:', error);
      alert('Error al buscar');
    }
  };

  return (
    <div>
      <h2>Buscar por Rostro</h2>
      <input 
        type="file" 
        onChange={(e) => {
          const reader = new FileReader();
          reader.onload = (ev) => setSearchImage(ev.target.result);
          reader.readAsDataURL(e.target.files[0]);
        }} 
      />
      <button onClick={searchByFace}>🔍 Buscar</button>

      {results && (
        <div>
          <h3>Resultados para: {results.user.name}</h3>
          {/* Mostrar publicaciones */}
        </div>
      )}
    </div>
  );
};

// ==========================================
// EJEMPLO 5: Análisis de expresiones
// ==========================================

const EmotionAnalysis = () => {
  const analyzeEmotions = async (imageBase64) => {
    const token = localStorage.getItem('token');

    const response = await axios.post(
      'http://localhost:5000/api/face-recognition/detect',
      { image: imageBase64 },
      { headers: { Authorization: token } }
    );

    const faces = response.data.faces;

    if (faces.length === 0) {
      return { emotion: 'unknown', confidence: 0 };
    }

    // Obtener la expresión dominante del primer rostro
    const expressions = faces[0].expressions;
    const dominantEmotion = Object.keys(expressions).reduce((a, b) =>
      expressions[a] > expressions[b] ? a : b
    );

    return {
      emotion: dominantEmotion,
      confidence: Math.round(expressions[dominantEmotion] * 100),
      allEmotions: expressions
    };
  };

  return (
    <div>
      {/* UI para analizar emociones */}
    </div>
  );
};

// ==========================================
// EJEMPLO 6: Etiquetado manual en publicaciones
// ==========================================

const TagPeopleInPhoto = ({ publicationId }) => {
  const [faces, setFaces] = useState([]);
  const [selectedFace, setSelectedFace] = useState(null);
  const [friendsList, setFriendsList] = useState([]);

  // Cargar rostros detectados
  const loadDetectedFaces = async () => {
    const token = localStorage.getItem('token');

    const response = await axios.post(
      `http://localhost:5000/api/face-recognition/analyze/${publicationId}`,
      {},
      { headers: { Authorization: token } }
    );

    setFaces(response.data.images[0].faces);
  };

  // Etiquetar un rostro con un usuario
  const tagFace = async (faceIndex, userId) => {
    const token = localStorage.getItem('token');

    // Actualizar la publicación con el usuario etiquetado
    // (Necesitarás crear este endpoint)
    await axios.patch(
      `http://localhost:5000/api/publications/${publicationId}/tag`,
      {
        imageIndex: 0,
        faceIndex,
        userId
      },
      { headers: { Authorization: token } }
    );

    alert('Usuario etiquetado!');
  };

  return (
    <div>
      <button onClick={loadDetectedFaces}>
        🔍 Detectar Rostros
      </button>

      {faces.map((face, idx) => (
        <div key={idx} className="border p-4 m-2">
          <p>Rostro #{idx + 1}</p>
          
          {/* Sugerencias automáticas */}
          {face.matches && face.matches.length > 0 && (
            <div>
              <p>💡 Sugerencias:</p>
              {face.matches.slice(0, 3).map((match, mIdx) => (
                <button 
                  key={mIdx}
                  onClick={() => tagFace(idx, match.user._id)}
                  className="bg-blue-500 text-white px-2 py-1 rounded m-1"
                >
                  {match.user.name} ({Math.round(match.similarity)}%)
                </button>
              ))}
            </div>
          )}

          {/* Etiquetado manual */}
          <select onChange={(e) => tagFace(idx, e.target.value)}>
            <option>Etiquetar manualmente...</option>
            {friendsList.map(friend => (
              <option key={friend._id} value={friend._id}>
                {friend.name}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// EJEMPLO 7: Verificar que solo hay un rostro
// ==========================================

const SingleFaceVerification = () => {
  const verifyOneFace = async (imageBase64) => {
    const token = localStorage.getItem('token');

    try {
      const response = await axios.post(
        'http://localhost:5000/api/face-recognition/detect',
        { image: imageBase64 },
        { headers: { Authorization: token } }
      );

      const faceCount = response.data.count;

      if (faceCount === 0) {
        return { valid: false, message: 'No se detectó ningún rostro' };
      }

      if (faceCount > 1) {
        return { valid: false, message: 'Se detectaron múltiples rostros. Usa una foto solo tuya.' };
      }

      return { valid: true, message: 'Foto válida ✅' };

    } catch (error) {
      return { valid: false, message: 'Error al verificar' };
    }
  };

  return null; // Solo función utilitaria
};

// ==========================================
// EJEMPLO 8: Obtener estadísticas de usuario
// ==========================================

const UserFaceStats = () => {
  const getMyFaceStats = async () => {
    const token = localStorage.getItem('token');

    try {
      const response = await axios.get(
        'http://localhost:5000/api/face-recognition/descriptors',
        { headers: { Authorization: token } }
      );

      return {
        totalRegistered: response.data.count,
        descriptors: response.data.descriptors
      };
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  const deleteMyFaces = async () => {
    const token = localStorage.getItem('token');

    if (window.confirm('¿Seguro que quieres eliminar todos tus datos faciales?')) {
      await axios.delete(
        'http://localhost:5000/api/face-recognition/descriptors',
        { headers: { Authorization: token } }
      );

      alert('Datos eliminados');
    }
  };

  return (
    <div>
      <button onClick={getMyFaceStats}>Ver mis rostros registrados</button>
      <button onClick={deleteMyFaces}>🗑️ Eliminar mis datos faciales</button>
    </div>
  );
};

// ==========================================
// EJEMPLO 9: Hook personalizado para detección
// ==========================================

import { useState } from 'react';

const useFaceDetection = () => {
  const [detecting, setDetecting] = useState(false);
  const [faces, setFaces] = useState([]);

  const detectFaces = async (imageBase64) => {
    setDetecting(true);
    const token = localStorage.getItem('token');

    try {
      const response = await axios.post(
        'http://localhost:5000/api/face-recognition/detect',
        { image: imageBase64 },
        { headers: { Authorization: token } }
      );

      setFaces(response.data.faces);
      return response.data.faces;
    } catch (error) {
      console.error('Error:', error);
      return [];
    } finally {
      setDetecting(false);
    }
  };

  return { detectFaces, detecting, faces };
};

// Uso:
function MiComponente() {
  const { detectFaces, detecting, faces } = useFaceDetection();

  const handleImage = async (image) => {
    const result = await detectFaces(image);
    console.log('Rostros:', result);
  };

  return (
    <div>
      {detecting && <p>Detectando...</p>}
      {faces.length > 0 && <p>Se encontraron {faces.length} rostros</p>}
    </div>
  );
}

// ==========================================
// EJEMPLO 10: Service completo
// ==========================================

// services/faceRecognitionClient.js
class FaceRecognitionClient {
  constructor() {
    this.baseURL = 'http://localhost:5000/api/face-recognition';
  }

  getToken() {
    return localStorage.getItem('token');
  }

  async detect(imageBase64) {
    const response = await axios.post(
      `${this.baseURL}/detect`,
      { image: imageBase64 },
      { headers: { Authorization: this.getToken() } }
    );
    return response.data;
  }

  async register(imageBase64, label) {
    const response = await axios.post(
      `${this.baseURL}/register`,
      { image: imageBase64, label },
      { headers: { Authorization: this.getToken() } }
    );
    return response.data;
  }

  async recognize(imageBase64, threshold = 0.6) {
    const response = await axios.post(
      `${this.baseURL}/recognize`,
      { image: imageBase64, threshold },
      { headers: { Authorization: this.getToken() } }
    );
    return response.data;
  }

  async getDescriptors() {
    const response = await axios.get(
      `${this.baseURL}/descriptors`,
      { headers: { Authorization: this.getToken() } }
    );
    return response.data;
  }

  async deleteDescriptors() {
    const response = await axios.delete(
      `${this.baseURL}/descriptors`,
      { headers: { Authorization: this.getToken() } }
    );
    return response.data;
  }

  async analyzePublication(publicationId) {
    const response = await axios.post(
      `${this.baseURL}/analyze/${publicationId}`,
      {},
      { headers: { Authorization: this.getToken() } }
    );
    return response.data;
  }
}

export default new FaceRecognitionClient();

// Uso:
import faceAPI from '../services/faceRecognitionClient';

const result = await faceAPI.detect(imageBase64);

export {
  MiPagina,
  ProfilePage,
  CreatePublication,
  SearchByFace,
  EmotionAnalysis,
  TagPeopleInPhoto,
  SingleFaceVerification,
  UserFaceStats,
  useFaceDetection,
  FaceRecognitionClient
};
