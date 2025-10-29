const faceRecognitionService = require('../services/faceRecognitionService');
const Publication = require('../models/publication');

// Detectar rostros en una imagen
const detectFaces = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        message: '❌ Se requiere una imagen'
      });
    }

    const faces = await faceRecognitionService.detectFaces(image);

    return res.status(200).json({
      message: `✅ Se detectaron ${faces.length} rostro(s)`,
      faces,
      count: faces.length
    });
  } catch (error) {
    console.error('Error al detectar rostros:', error);
    return res.status(500).json({
      message: '❌ Error al detectar rostros',
      error: error.message
    });
  }
};

// Registrar rostro de usuario (para reconocimiento futuro)
const registerUserFace = async (req, res) => {
  try {
    const userId = req.user.id;
    const { image, label } = req.body;

    if (!image) {
      return res.status(400).json({
        message: '❌ Se requiere una imagen'
      });
    }

    // Detectar rostros en la imagen
    const faces = await faceRecognitionService.detectFaces(image);

    if (faces.length === 0) {
      return res.status(400).json({
        message: '❌ No se detectó ningún rostro en la imagen'
      });
    }

    if (faces.length > 1) {
      return res.status(400).json({
        message: '❌ Se detectaron múltiples rostros. Por favor usa una imagen con un solo rostro'
      });
    }

    // Guardar el descriptor facial
    const faceLabel = label || `Face-${Date.now()}`;
    await faceRecognitionService.saveFaceDescriptor(
      userId,
      faces[0].descriptor,
      faceLabel,
      image
    );

    return res.status(201).json({
      message: '✅ Rostro registrado correctamente',
      label: faceLabel
    });
  } catch (error) {
    console.error('Error al registrar rostro:', error);
    return res.status(500).json({
      message: '❌ Error al registrar rostro',
      error: error.message
    });
  }
};

// Reconocer rostros en una imagen (comparar con BD)
const recognizeFaces = async (req, res) => {
  try {
    const { image, threshold = 0.6 } = req.body;

    if (!image) {
      return res.status(400).json({
        message: '❌ Se requiere una imagen'
      });
    }

    const recognizedFaces = await faceRecognitionService.recognizeFaces(image, threshold);

    return res.status(200).json({
      message: `✅ Análisis completado: ${recognizedFaces.length} rostro(s) detectado(s)`,
      faces: recognizedFaces,
      count: recognizedFaces.length
    });
  } catch (error) {
    console.error('Error al reconocer rostros:', error);
    return res.status(500).json({
      message: '❌ Error al reconocer rostros',
      error: error.message
    });
  }
};

// Obtener descriptores faciales del usuario actual
const getUserFaceDescriptors = async (req, res) => {
  try {
    const userId = req.user.id;
    const descriptors = await faceRecognitionService.getUserDescriptors(userId);

    return res.status(200).json({
      message: `✅ Se encontraron ${descriptors.length} descriptor(es)`,
      descriptors: descriptors.map(d => ({
        id: d._id,
        label: d.label,
        created_at: d.created_at,
        hasImage: !!d.imageUrl
      })),
      count: descriptors.length
    });
  } catch (error) {
    console.error('Error al obtener descriptores:', error);
    return res.status(500).json({
      message: '❌ Error al obtener descriptores',
      error: error.message
    });
  }
};

// Eliminar descriptor facial
const deleteFaceDescriptor = async (req, res) => {
  try {
    const userId = req.user.id;
    await faceRecognitionService.deleteUserDescriptors(userId);

    return res.status(200).json({
      message: '✅ Descriptores faciales eliminados correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar descriptores:', error);
    return res.status(500).json({
      message: '❌ Error al eliminar descriptores',
      error: error.message
    });
  }
};

// Analizar publicación (detectar y reconocer rostros)
const analyzePublication = async (req, res) => {
  try {
    const { publicationId } = req.params;

    const publication = await Publication.findById(publicationId);

    if (!publication) {
      return res.status(404).json({
        message: '❌ Publicación no encontrada'
      });
    }

    // Analizar cada imagen de la publicación
    const analysisResults = await Promise.all(
      publication.images.map(async (imageObj) => {
        try {
          const faces = await faceRecognitionService.recognizeFaces(imageObj.original);
          return {
            imageId: imageObj._id,
            faces,
            faceCount: faces.length
          };
        } catch (error) {
          console.error('Error al analizar imagen:', error);
          return {
            imageId: imageObj._id,
            error: error.message,
            faceCount: 0
          };
        }
      })
    );

    const totalFaces = analysisResults.reduce((sum, result) => sum + result.faceCount, 0);

    return res.status(200).json({
      message: `✅ Análisis completado: ${totalFaces} rostro(s) detectado(s) en total`,
      publicationId,
      images: analysisResults,
      totalFaces
    });
  } catch (error) {
    console.error('Error al analizar publicación:', error);
    return res.status(500).json({
      message: '❌ Error al analizar publicación',
      error: error.message
    });
  }
};

module.exports = {
  detectFaces,
  registerUserFace,
  recognizeFaces,
  getUserFaceDescriptors,
  deleteFaceDescriptor,
  analyzePublication
};
