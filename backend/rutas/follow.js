const express = require('express');
const userController = require('../controllers/follow');
const router = express.Router();


//Definir rutas
router.get('/prueba-follow', userController.pruebaFollow);
//Exportar modulo
module.exports = router;