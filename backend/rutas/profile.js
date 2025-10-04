const express = require("express");
const profileController = require("../controllers/profile");
const router = express.Router();
const { auth } = require("../middlewares/auth");

// Ruta de prueba (protegida)
router.get("/test", auth, profileController.testProfile);

// Obtener mi perfil (usuario autenticado)
router.get("/me", auth, profileController.getMyProfile);

// Actualizar mi perfil (usuario autenticado)
router.put("/me", auth, profileController.updateProfile);

// Obtener todos los perfiles (con paginación y búsqueda)
router.get("/all", profileController.getAllProfiles);

// Obtener perfil por ID de usuario
router.get("/user/:userId", profileController.getProfileById);

module.exports = router;