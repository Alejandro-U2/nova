const express = require('express');
const publicationController = require('../controllers/publication');
const router = express.Router();
const { auth } = require("../middlewares/auth");

// Ruta de prueba (protegida)
router.get('/test', auth, publicationController.testPublication);

// Crear nueva publicación (protegida)
router.post('/create', auth, publicationController.createPublication);

// Obtener feed de publicaciones para la página de inicio
router.get('/feed', publicationController.getFeedPublications);

// Obtener publicaciones del usuario autenticado
router.get('/my-publications', auth, publicationController.getMyPublications);

// Obtener publicaciones de un usuario específico
router.get('/user/:userId', publicationController.getUserPublications);

// Dar/quitar like a una publicación (protegida)
router.post('/:publicationId/like', auth, publicationController.toggleLike);

// Agregar comentario a una publicación (protegida)
router.post('/:publicationId/comment', auth, publicationController.addComment);

// Eliminar publicación (protegida)
router.delete('/:id', auth, publicationController.deletePublication);

module.exports = router;