/**
 * Utilidades para transformaciones automáticas de imágenes
 */

/**
 * Aplica transformaciones automáticas a una imagen
 * @param {string} imageBase64 - Imagen en formato base64
 * @returns {Promise<Object>} Objeto con la imagen original y sus transformaciones
 */
export const applyImageTransformations = async (imageBase64) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        const transformations = {
          original: imageBase64,
          scaled_down: scaleImage(img, 0.5), // Reducción al 50%
          scaled_up: scaleImage(img, 1.5), // Ampliación al 150%
          grayscale: applyGrayscale(img), // Blanco y negro
          sepia: applySepia(img) // Efecto sepia
        };
        
        resolve(transformations);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };
    
    img.src = imageBase64;
  });
};

/**
 * Escala una imagen
 * @param {HTMLImageElement} img - Elemento de imagen
 * @param {number} scale - Factor de escala
 * @returns {string} Imagen escalada en base64
 */
const scaleImage = (img, scale) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  return canvas.toDataURL('image/jpeg', 0.9);
};

/**
 * Aplica filtro de escala de grises (blanco y negro)
 * @param {HTMLImageElement} img - Elemento de imagen
 * @returns {string} Imagen en blanco y negro en base64
 */
const applyGrayscale = (img) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = img.width;
  canvas.height = img.height;
  
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = gray;     // Red
    data[i + 1] = gray; // Green
    data[i + 2] = gray; // Blue
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  return canvas.toDataURL('image/jpeg', 0.9);
};

/**
 * Aplica filtro sepia
 * @param {HTMLImageElement} img - Elemento de imagen
 * @returns {string} Imagen con efecto sepia en base64
 */
const applySepia = (img) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = img.width;
  canvas.height = img.height;
  
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));     // Red
    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168)); // Green
    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131)); // Blue
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  return canvas.toDataURL('image/jpeg', 0.9);
};

/**
 * Obtiene el tamaño de una imagen en KB
 * @param {string} base64String - Imagen en base64
 * @returns {number} Tamaño en KB
 */
export const getImageSize = (base64String) => {
  const stringLength = base64String.length - 'data:image/jpeg;base64,'.length;
  const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;
  return Math.round(sizeInBytes / 1024);
};

/**
 * Información sobre las transformaciones disponibles
 */
export const transformationInfo = {
  scaled_down: {
    name: 'Reducción de escala',
    description: 'Imagen reducida al 50% del tamaño original'
  },
  scaled_up: {
    name: 'Ampliación',
    description: 'Imagen ampliada al 150% del tamaño original'
  },
  grayscale: {
    name: 'Blanco y Negro',
    description: 'Imagen convertida a escala de grises'
  },
  sepia: {
    name: 'Efecto Sepia',
    description: 'Imagen con tono vintage sepia'
  }
};
