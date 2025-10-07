const sharp = require('sharp');

class ImageService {
  /**
   * Genera una miniatura de una imagen
   * @param {Buffer|string} input - Buffer de la imagen o base64 string
   * @param {Object} options - Opciones para la miniatura
   * @returns {Promise<string>} - Base64 de la miniatura generada
   */
  static async generateThumbnail(input, options = {}) {
    try {
      const {
        width = 300,
        height = 300,
        quality = 80,
        format = 'jpeg'
      } = options;

      let imageBuffer;

      // Si es base64, convertir a buffer
      if (typeof input === 'string' && input.startsWith('data:')) {
        const base64Data = input.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else if (Buffer.isBuffer(input)) {
        imageBuffer = input;
      } else {
        throw new Error('Formato de imagen no soportado');
      }

      // Generar miniatura usando Sharp
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality })
        .toBuffer();

      // Convertir a base64
      const base64Thumbnail = `data:image/${format};base64,${thumbnailBuffer.toString('base64')}`;
      
      return base64Thumbnail;
    } catch (error) {
      console.error('Error al generar miniatura:', error);
      throw new Error('No se pudo generar la miniatura');
    }
  }

  /**
   * Optimiza una imagen para almacenamiento
   * @param {Buffer|string} input - Buffer de la imagen o base64 string
   * @param {Object} options - Opciones de optimización
   * @returns {Promise<string>} - Base64 de la imagen optimizada
   */
  static async optimizeImage(input, options = {}) {
    try {
      const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 85,
        format = 'jpeg'
      } = options;

      let imageBuffer;

      // Si es base64, convertir a buffer
      if (typeof input === 'string' && input.startsWith('data:')) {
        const base64Data = input.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else if (Buffer.isBuffer(input)) {
        imageBuffer = input;
      } else {
        throw new Error('Formato de imagen no soportado');
      }

      // Optimizar imagen usando Sharp
      const optimizedBuffer = await sharp(imageBuffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality })
        .toBuffer();

      // Convertir a base64
      const base64Optimized = `data:image/${format};base64,${optimizedBuffer.toString('base64')}`;
      
      return base64Optimized;
    } catch (error) {
      console.error('Error al optimizar imagen:', error);
      throw new Error('No se pudo optimizar la imagen');
    }
  }

  /**
   * Valida si una cadena es una imagen base64 válida
   * @param {string} base64String - Cadena base64 a validar
   * @returns {boolean} - True si es válida, false en caso contrario
   */
  static isValidBase64Image(base64String) {
    try {
      if (!base64String || typeof base64String !== 'string') {
        return false;
      }

      // Verificar formato base64 de imagen
      const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
      return base64Regex.test(base64String);
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene información de una imagen
   * @param {Buffer|string} input - Buffer de la imagen o base64 string
   * @returns {Promise<Object>} - Metadatos de la imagen
   */
  static async getImageInfo(input) {
    try {
      let imageBuffer;

      // Si es base64, convertir a buffer
      if (typeof input === 'string' && input.startsWith('data:')) {
        const base64Data = input.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else if (Buffer.isBuffer(input)) {
        imageBuffer = input;
      } else {
        throw new Error('Formato de imagen no soportado');
      }

      const metadata = await sharp(imageBuffer).metadata();
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha
      };
    } catch (error) {
      console.error('Error al obtener información de imagen:', error);
      throw new Error('No se pudo obtener información de la imagen');
    }
  }
}

module.exports = ImageService;