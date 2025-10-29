# 🎭 Sistema de Reconocimiento Facial - Documentación

## 📋 Índice
1. [Descripción General](#descripción-general)
2. [Instalación](#instalación)
3. [Arquitectura](#arquitectura)
4. [API Endpoints](#api-endpoints)
5. [Componentes Frontend](#componentes-frontend)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [Modelos de IA](#modelos-de-ia)

---

## 📝 Descripción General

Sistema completo de reconocimiento facial implementado con **face-api.js** que permite:

### Funcionalidades Principales:
- ✅ **Detección de rostros** en imágenes
- ✅ **Reconocimiento facial** (identificar usuarios registrados)
- ✅ **Análisis de expresiones** faciales
- ✅ **Estimación de edad y género**
- ✅ **Detección de puntos de referencia** faciales (68 landmarks)
- ✅ **Etiquetado de personas** en publicaciones
- ✅ **Búsqueda por rostros**

---

## 🚀 Instalación

### Dependencias instaladas:
```bash
npm install face-api.js canvas multer
```

### Modelos descargados:
Los modelos se descargan automáticamente en:
- **Backend:** `backend/models/face-api-models/`
- **Frontend:** `frontend/public/models/`

Para re-descargar modelos:
```bash
node backend/models/downloadModels.js
```

---

## 🏗️ Arquitectura

### Backend
```
backend/
├── models/
│   ├── faceDescriptor.js          # Modelo de datos para descriptores faciales
│   ├── face-api-models/            # Modelos de IA
│   └── downloadModels.js           # Script de descarga
├── services/
│   └── faceRecognitionService.js  # Lógica de negocio
├── controllers/
│   └── faceRecognition.js         # Controladores de endpoints
└── rutas/
    └── faceRecognition.js         # Definición de rutas
```

### Frontend
```
frontend/
├── src/
│   ├── components/
│   │   └── FaceRecognition.jsx    # Componente principal
│   └── styles/
│       └── faceRecognition.css    # Estilos
└── public/
    └── models/                     # Modelos de IA (frontend)
```

---

## 🔌 API Endpoints

### Base URL: `http://localhost:5000/api/face-recognition`

### 1. Detectar Rostros
```http
POST /detect
Authorization: Bearer <token>
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,..."
}
```

**Respuesta:**
```json
{
  "message": "✅ Se detectaron 2 rostro(s)",
  "faces": [
    {
      "box": { "x": 100, "y": 150, "width": 200, "height": 250 },
      "landmarks": [...],
      "descriptor": [0.123, -0.456, ...],
      "expressions": {
        "happy": 0.95,
        "sad": 0.02,
        "neutral": 0.03
      },
      "age": 28,
      "gender": "female",
      "genderProbability": 0.98
    }
  ],
  "count": 2
}
```

### 2. Registrar Rostro de Usuario
```http
POST /register
Authorization: Bearer <token>
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,...",
  "label": "perfil_principal"
}
```

**Respuesta:**
```json
{
  "message": "✅ Rostro registrado correctamente",
  "label": "perfil_principal"
}
```

### 3. Reconocer Rostros
```http
POST /recognize
Authorization: Bearer <token>
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,...",
  "threshold": 0.6
}
```

**Respuesta:**
```json
{
  "message": "✅ Análisis completado: 1 rostro(s) detectado(s)",
  "faces": [
    {
      "box": { "x": 100, "y": 150, "width": 200, "height": 250 },
      "matches": [
        {
          "user": {
            "name": "Juan",
            "lastname": "Pérez",
            "nickname": "juanp"
          },
          "label": "perfil_principal",
          "distance": 0.35,
          "similarity": 65
        }
      ]
    }
  ],
  "count": 1
}
```

### 4. Obtener Descriptores del Usuario
```http
GET /descriptors
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "message": "✅ Se encontraron 3 descriptor(es)",
  "descriptors": [
    {
      "id": "507f1f77bcf86cd799439011",
      "label": "perfil_principal",
      "created_at": "2025-10-28T10:30:00.000Z",
      "hasImage": true
    }
  ],
  "count": 3
}
```

### 5. Eliminar Descriptores
```http
DELETE /descriptors
Authorization: Bearer <token>
```

### 6. Analizar Publicación
```http
POST /analyze/:publicationId
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "message": "✅ Análisis completado: 3 rostro(s) detectado(s) en total",
  "publicationId": "507f1f77bcf86cd799439011",
  "images": [
    {
      "imageId": "507f1f77bcf86cd799439012",
      "faces": [...],
      "faceCount": 2
    }
  ],
  "totalFaces": 3
}
```

---

## 🎨 Componentes Frontend

### FaceRecognition Component

```jsx
import FaceRecognition from './components/FaceRecognition';

function App() {
  const [showFaceRecognition, setShowFaceRecognition] = useState(false);

  return (
    <>
      <button onClick={() => setShowFaceRecognition(true)}>
        🎭 Reconocimiento Facial
      </button>

      {showFaceRecognition && (
        <FaceRecognition onClose={() => setShowFaceRecognition(false)} />
      )}
    </>
  );
}
```

### Características del Componente:
- ✅ 3 pestañas: Detectar, Registrar, Reconocer
- ✅ Detección local (navegador) y remota (servidor)
- ✅ Canvas interactivo con visualización de rostros
- ✅ Análisis de expresiones en tiempo real
- ✅ Responsive y con buen diseño

---

## 📚 Ejemplos de Uso

### 1. Registrar rostro al crear perfil
```javascript
// En el componente de perfil
const registerProfileFace = async (imageBase64) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:5000/api/face-recognition/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    body: JSON.stringify({
      image: imageBase64,
      label: 'foto_perfil'
    })
  });

  const data = await response.json();
  console.log(data.message);
};
```

### 2. Auto-etiquetado en publicaciones
```javascript
// Al crear una publicación
const analyzeAndTagPublication = async (publicationId) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    `http://localhost:5000/api/face-recognition/analyze/${publicationId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': token
      }
    }
  );

  const data = await response.json();
  // Mostrar sugerencias de etiquetado basadas en data.faces
};
```

### 3. Búsqueda por rostro
```javascript
// Buscar publicaciones con una persona específica
const findPublicationsWithPerson = async (faceImageBase64) => {
  const token = localStorage.getItem('token');
  
  // 1. Reconocer el rostro
  const recognition = await fetch('http://localhost:5000/api/face-recognition/recognize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    body: JSON.stringify({ image: faceImageBase64 })
  });

  const { faces } = await recognition.json();
  
  // 2. Obtener el usuario identificado
  if (faces[0]?.matches?.length > 0) {
    const userId = faces[0].matches[0].user._id;
    
    // 3. Buscar publicaciones del usuario
    // Implementar endpoint personalizado
  }
};
```

---

## 🧠 Modelos de IA

### Modelos Utilizados:

1. **SSD MobileNet v1** - Detección de rostros
   - Rápido y eficiente
   - Ideal para aplicaciones web

2. **Face Landmark 68** - Puntos de referencia
   - 68 puntos faciales
   - Ojos, cejas, nariz, boca, contorno

3. **Face Recognition** - Reconocimiento facial
   - Descriptores de 128 dimensiones
   - Comparación por distancia euclidiana

4. **Face Expression** - Expresiones
   - 7 expresiones: happy, sad, angry, fearful, disgusted, surprised, neutral

5. **Age Gender** - Edad y género
   - Estimación de edad
   - Clasificación de género con probabilidad

### Umbrales de Similitud:
- **< 0.4**: Muy alta similitud (misma persona)
- **0.4 - 0.6**: Alta similitud (probable coincidencia)
- **0.6 - 0.8**: Similitud media (posible coincidencia)
- **> 0.8**: Baja similitud (diferente persona)

---

## 🔒 Consideraciones de Privacidad

⚠️ **Importante:**
1. Informar a los usuarios sobre el uso de reconocimiento facial
2. Obtener consentimiento explícito
3. Permitir eliminar datos faciales en cualquier momento
4. No compartir descriptores faciales con terceros
5. Cumplir con GDPR y regulaciones locales

---

## 🎯 Próximas Mejoras

- [ ] Búsqueda inversa por rostro
- [ ] Filtros AR en tiempo real
- [ ] Reconocimiento en video
- [ ] Agrupación automática de fotos por persona
- [ ] Detección de máscaras faciales
- [ ] Reconocimiento de emociones en tiempo real

---

## 🆘 Solución de Problemas

### Error: "Modelos no encontrados"
```bash
node backend/models/downloadModels.js
```

### Error: "Canvas no disponible"
```bash
npm install canvas
```

### Error: "CORS bloqueado"
Verifica que el frontend esté en la lista de orígenes permitidos en `backend/index.js`

---

## 📞 Soporte

Para más información, consulta la documentación oficial de:
- [face-api.js](https://github.com/justadudewhohacks/face-api.js)
- [TensorFlow.js](https://www.tensorflow.org/js)

---

**¡Sistema de Reconocimiento Facial implementado con éxito! 🎉**
