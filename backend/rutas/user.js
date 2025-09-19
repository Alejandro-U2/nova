// backend/rutas/user.js
const express = require("express");
const userController = require("../controllers/user");
const router = express.Router();

// Rutas de prueba
router.get("/prueba-usuario", userController.pruebaUser);

// Rutas reales
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/:id", userController.getUser);

module.exports = router;
