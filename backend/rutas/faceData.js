const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FaceDataController = require('../controllers/faceData');
const check = require('../middlewares/auth');

// Asegurar que la carpeta existe
const uploadDir = './uploads/faces/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = 'face-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Aceptar solo imágenes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const uploads = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

// Definir rutas
router.post('/save', check.auth, uploads.single('file0'), FaceDataController.saveFace);
router.get('/list', check.auth, FaceDataController.getUserFaces);
router.delete('/delete/:id', check.auth, FaceDataController.deleteFace);

module.exports = router;
