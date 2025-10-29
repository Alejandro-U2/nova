# 🚀 Guía Rápida - Reconocimiento Facial

## ⚡ Inicio Rápido

### 1. Usar el Componente en el Frontend

```jsx
import { useState } from 'react';
import FaceRecognition from './components/FaceRecognition';

function MiComponente() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <button onClick={() => setShowModal(true)}>
        🎭 Abrir Reconocimiento Facial
      </button>

      {showModal && (
        <FaceRecognition onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
```

### 2. Flujo Básico de Uso

#### A. Registrar tu rostro
1. Abre el modal de reconocimiento facial
2. Ve a la pestaña "Registrar"
3. Selecciona una foto clara de tu rostro
4. Escribe una etiqueta (ej: "perfil_principal")
5. Haz clic en "Registrar Rostro"

#### B. Detectar rostros en una imagen
1. Ve a la pestaña "Detectar"
2. Selecciona una imagen
3. Haz clic en "Detectar Rostros (Local)"
4. Verás cajas alrededor de los rostros con info de edad, género y expresión

#### C. Reconocer personas conocidas
1. Ve a la pestaña "Reconocer"
2. Selecciona una imagen con personas
3. Haz clic en "Reconocer Rostros"
4. El sistema comparará con rostros registrados en la BD

---

## 📱 Integración con Publicaciones

### Ejemplo: Analizar rostros al crear publicación

```javascript
// En tu componente de crear publicación
const createPublicationWithFaceDetection = async (imageBase64, description) => {
  const token = localStorage.getItem('token');
  
  // 1. Crear la publicación normal
  const pubResponse = await fetch('http://localhost:5000/api/publications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    body: JSON.stringify({
      images: [imageBase64],
      description
    })
  });

  const { publication } = await pubResponse.json();

  // 2. Analizar rostros en la publicación
  const faceResponse = await fetch(
    `http://localhost:5000/api/face-recognition/analyze/${publication._id}`,
    {
      method: 'POST',
      headers: { 'Authorization': token }
    }
  );

  const { faces } = await faceResponse.json();
  
  // 3. Mostrar sugerencias de etiquetado
  if (faces.totalFaces > 0) {
    console.log(`Se detectaron ${faces.totalFaces} rostros`);
    // Aquí puedes mostrar UI para etiquetar personas
  }

  return publication;
};
```

---

## 🔧 APIs Útiles

### Detección Rápida
```javascript
const detectFaces = async (imageBase64) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:5000/api/face-recognition/detect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    body: JSON.stringify({ image: imageBase64 })
  });

  return await response.json();
};
```

### Registro Rápido
```javascript
const registerFace = async (imageBase64, label) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:5000/api/face-recognition/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    body: JSON.stringify({ image: imageBase64, label })
  });

  return await response.json();
};
```

### Reconocimiento Rápido
```javascript
const recognizeFaces = async (imageBase64) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:5000/api/face-recognition/recognize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    body: JSON.stringify({ 
      image: imageBase64,
      threshold: 0.6  // Ajusta según necesites
    })
  });

  return await response.json();
};
```

---

## 🎯 Casos de Uso Prácticos

### 1. Verificación de Identidad
```javascript
// Al actualizar foto de perfil
const verifyProfilePhoto = async (newPhotoBase64) => {
  const result = await recognizeFaces(newPhotoBase64);
  
  if (result.faces.length === 0) {
    alert('No se detectó ningún rostro');
    return false;
  }
  
  if (result.faces.length > 1) {
    alert('Se detectaron múltiples rostros. Usa una foto solo tuya.');
    return false;
  }

  return true;
};
```

### 2. Búsqueda de Amigos
```javascript
// Encontrar publicaciones con un amigo
const findFriendInPhotos = async (friendUserId) => {
  // Implementar endpoint personalizado que busque en publicaciones
  // donde el friendUserId esté etiquetado en faceData
};
```

### 3. Estadísticas de Fotos
```javascript
// Analizar emociones en tus publicaciones
const analyzeMyEmotions = async () => {
  // Obtener todas mis publicaciones
  // Analizar expresiones faciales
  // Generar estadísticas: % feliz, triste, etc.
};
```

---

## ⚙️ Configuración Avanzada

### Ajustar Threshold de Similitud

```javascript
// Threshold bajo = más estricto (menos falsos positivos)
const strictRecognition = await fetch('/api/face-recognition/recognize', {
  body: JSON.stringify({ 
    image: imageBase64,
    threshold: 0.4  // Solo coincidencias muy seguras
  })
});

// Threshold alto = más permisivo (más coincidencias)
const permissiveRecognition = await fetch('/api/face-recognition/recognize', {
  body: JSON.stringify({ 
    image: imageBase64,
    threshold: 0.7  // Acepta más variaciones
  })
});
```

---

## 🐛 Debugging

### Ver qué se detectó
```javascript
const debug = async (imageBase64) => {
  const result = await detectFaces(imageBase64);
  
  console.log('Rostros detectados:', result.count);
  
  result.faces.forEach((face, idx) => {
    console.log(`Rostro ${idx + 1}:`);
    console.log('- Edad:', face.age);
    console.log('- Género:', face.gender);
    console.log('- Expresión dominante:', 
      Object.keys(face.expressions).reduce((a, b) => 
        face.expressions[a] > face.expressions[b] ? a : b
      )
    );
  });
};
```

---

## ✅ Checklist de Implementación

- [x] Dependencias instaladas
- [x] Modelos descargados
- [x] Rutas configuradas en backend
- [x] Componente React creado
- [x] Estilos aplicados
- [ ] Integrar en navbar/menú principal
- [ ] Agregar a página de perfil
- [ ] Implementar en crear publicación
- [ ] Crear búsqueda por rostro
- [ ] Agregar configuración de privacidad

---

## 📝 Notas Importantes

⚠️ **El reconocimiento facial NO es 100% preciso**
- Depende de la calidad de las imágenes
- La iluminación afecta los resultados
- Diferentes ángulos pueden dar resultados distintos
- Siempre permite confirmación manual del usuario

✅ **Mejores Prácticas:**
- Usa fotos frontales y bien iluminadas para registro
- Registra múltiples fotos del mismo usuario (diferentes ángulos)
- Implementa confirmación del usuario antes de etiquetar
- Permite a los usuarios eliminar sus datos faciales

---

**¿Necesitas ayuda?** Revisa `FACE_RECOGNITION_DOCS.md` para documentación completa.
