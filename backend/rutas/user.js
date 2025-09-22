const express = require("express");
const userController = require("../controllers/user");
const router = express.Router();
const { auth } = require("../middlewares/auth");

router.get("/prueba-usuario", auth, userController.pruebaUser);
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/:id", userController.getUser);

module.exports = router;

