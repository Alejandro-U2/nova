const express = require('express');
const userController = require('../controllers/publication');
const router = express.Router();


//Definir rutas
router.get('/prueba-publication', userController.pruebaPublication);
//Exportar modulo
module.exports = router;