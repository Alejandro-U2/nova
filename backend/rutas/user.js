const express = require("express");
const userController = require("../controllers/user");
const router = express.Router();
const { auth } = require("../middlewares/auth");

router.get("/prueba-usuario", auth, userController.pruebaUser);
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/search", userController.searchUsers); // Nueva ruta para búsqueda
router.get("/all", userController.getAllUsers); // Ruta para debug - obtener todos los usuarios
router.get("/:id", userController.getUser);

module.exports = router;

