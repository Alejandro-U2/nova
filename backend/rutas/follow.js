const express = require('express');
const followController = require('../controllers/follow');
const { auth } = require('../middlewares/auth');
const router = express.Router();

// Rutas de prueba
router.get('/prueba-follow', followController.pruebaFollow);

// Seguir a un usuario
router.post('/follow/:id', auth, followController.followUser);

// Dejar de seguir a un usuario
router.delete('/unfollow/:id', auth, followController.unfollowUser);

// Obtener lista de usuarios que sigue (seguidos)
router.get('/following', auth, followController.following); // Sin parámetros, del usuario autenticado
router.get('/following/:id', auth, followController.following); // Con ID específico
router.get('/following/:id/:page', auth, followController.following); // Con ID y página

// Obtener lista de seguidores
router.get('/followers', auth, followController.followers); // Sin parámetros, del usuario autenticado
router.get('/followers/:id', auth, followController.followers); // Con ID específico
router.get('/followers/:id/:page', auth, followController.followers); // Con ID y página

// Obtener contadores de seguidos y seguidores
router.get('/counters', auth, followController.counters); // Del usuario autenticado
router.get('/counters/:id', auth, followController.counters); // De un usuario específico

// Obtener contadores individuales (para frontend)
router.get('/followers/:id/count', auth, followController.followersCount);
router.get('/following/:id/count', auth, followController.followingCount);

// Verificar si un usuario sigue a otro
router.get('/check/:id', auth, followController.checkFollow);

module.exports = router;