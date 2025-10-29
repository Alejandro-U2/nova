const FaceData = require('../models/faceData');
const fs = require('fs');
const path = require('path');

// Guardar un nuevo rostro
const saveFace = async (req, res) => {
  try {
    console.log('📸 Recibiendo petición de guardar rostro...');
    console.log('Body:', req.body);
    console.log('File:', req.file);

    const { name, descriptor, age, gender, expression } = req.body;
    
    if (!name || !descriptor) {
      console.log('❌ Faltan datos requeridos');
      return res.status(400).json({
        status: 'error',
        message: 'Faltan datos requeridos (nombre y descriptor)'
      });
    }

    // Validar que venga una imagen
    if (!req.file) {
      console.log('❌ No se envió imagen');
      return res.status(400).json({
        status: 'error',
        message: 'No se ha enviado ninguna imagen'
      });
    }

    console.log('✅ Datos recibidos correctamente');

    const faceData = new FaceData({
      user: req.user.id,
      name,
      image: req.file.filename,
      descriptor: JSON.parse(descriptor),
      age: age ? parseInt(age) : null,
      gender,
      expression
    });

    await faceData.save();

    console.log('✅ Rostro guardado exitosamente');

    return res.status(200).json({
      status: 'success',
      message: 'Rostro registrado exitosamente',
      faceData
    });

  } catch (error) {
    console.error('❌ Error al guardar rostro:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error al guardar el rostro: ' + error.message
    });
  }
};

// Obtener todos los rostros del usuario
const getUserFaces = async (req, res) => {
  try {
    const faces = await FaceData.find({ user: req.user.id })
      .sort({ created_at: -1 });

    return res.status(200).json({
      status: 'success',
      faces
    });

  } catch (error) {
    console.error('Error al obtener rostros:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error al obtener los rostros'
    });
  }
};

// Eliminar un rostro
const deleteFace = async (req, res) => {
  try {
    const faceId = req.params.id;

    // Buscar el rostro
    const face = await FaceData.findById(faceId);

    if (!face) {
      return res.status(404).json({
        status: 'error',
        message: 'Rostro no encontrado'
      });
    }

    // Verificar que el rostro pertenece al usuario
    if (face.user.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'No tienes permiso para eliminar este rostro'
      });
    }

    // Eliminar la imagen del servidor
    const imagePath = path.join(__dirname, '../uploads/faces', face.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Eliminar el rostro de la base de datos
    await FaceData.findByIdAndDelete(faceId);

    return res.status(200).json({
      status: 'success',
      message: 'Rostro eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar rostro:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error al eliminar el rostro'
    });
  }
};

module.exports = {
  saveFace,
  getUserFaces,
  deleteFace
};
