const followService = require('../services/followService');

// Ruta de prueba
const pruebaFollow = (req, res) => {
    return res.status(200).json({
        status: 'success',
        message: 'Mensaje de prueba desde el controlador de seguimiento'
    });
};

// Seguir a un usuario
const followUser = async (req, res) => {
    try {
        // ID del usuario que está siguiendo (desde el token de autenticación)
        const userId = req.user.id;
        // ID del usuario a seguir (desde los parámetros de la URL)
        const { id } = req.params;

        console.log('🔔 Solicitud para seguir usuario');
        console.log('   - Usuario logueado:', userId, '(tipo:', typeof userId, ')');
        console.log('   - Usuario a seguir:', id, '(tipo:', typeof id, ')');
        console.log('   - req.params completo:', req.params);
        
        const { alreadyFollowing, follow } = await followService.followUser(userId, id);

        if (alreadyFollowing) {
            console.log('Ya existe una relación de seguimiento:', follow);
            return res.status(200).json({
                status: "success",
                message: "Ya estás siguiendo a este usuario",
                isFollowing: true,
                follow
            });
        }

        console.log('Nueva relación de seguimiento creada:', follow);

        return res.status(200).json({
            status: "success",
            message: "Ahora sigues a este usuario",
            isFollowing: true,
            follow
        });

    } catch (error) {
        console.error('Error al seguir usuario:', error);
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            status: "error",
            message: statusCode === 500 ? "Error al seguir usuario" : error.message,
            error: error.message
        });
    }
};

// Dejar de seguir a un usuario
const unfollowUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        console.log('Solicitud para dejar de seguir. Usuario logueado:', userId, 'Usuario a dejar de seguir:', id);
        const { followRelation } = await followService.unfollowUser(userId, id);

        if (!followRelation) {
            console.log('No se encontró relación de seguimiento para eliminar');
            return res.status(200).json({
                status: "success",
                message: "No estabas siguiendo a este usuario",
                isFollowing: false
            });
        }

        console.log('Relación de seguimiento eliminada:', followRelation);
        return res.status(200).json({
            status: "success",
            message: "Has dejado de seguir a este usuario",
            isFollowing: false
        });

    } catch (error) {
        console.error('Error al dejar de seguir usuario:', error);
        return res.status(500).json({
            status: "error",
            message: "Error al dejar de seguir usuario",
            error: error.message
        });
    }
};

// Obtener lista de usuarios que sigue (seguidos)
const following = async (req, res) => {
    try {
        let userId = req.user.id;
        let page = 1;
        
        // Si viene un ID en los parámetros, usar ese ID en lugar del autenticado
        if (req.params.id) {
            userId = req.params.id;
        }
        
        // Si viene un número de página, usarlo
        if (req.params.page) {
            page = parseInt(req.params.page);
            if (isNaN(page) || page < 1) page = 1;
        }

        const itemsPerPage = 10;

        console.log('Buscando usuarios que sigue el usuario:', userId);

        const {
            following: followingUsers,
            follows,
            total,
            pages,
            currentPage
        } = await followService.getFollowing({ userId, page, limit: itemsPerPage });

        return res.status(200).json({
            status: "success",
            message: "Lista de usuarios seguidos",
            following: followingUsers,
            follows, // Incluir los objetos completos también
            total,
            pages,
            currentPage
        });

    } catch (error) {
        console.error('Error al obtener usuarios seguidos:', error);
        return res.status(500).json({
            status: "error",
            message: "Error al obtener lista de seguidos",
            error: error.message
        });
    }
};

// Obtener lista de seguidores
const followers = async (req, res) => {
    try {
        let userId = req.user.id;
        let page = 1;
        
        // Si viene un ID en los parámetros, usar ese ID en lugar del autenticado
        if (req.params.id) {
            userId = req.params.id;
        }
        
        // Si viene un número de página, usarlo
        if (req.params.page) {
            page = parseInt(req.params.page);
            if (isNaN(page) || page < 1) page = 1;
        }

        const itemsPerPage = 10;

        console.log('Buscando seguidores del usuario:', userId);

        const {
            followers: followersUsers,
            follows,
            total,
            pages,
            currentPage
        } = await followService.getFollowers({ userId, page, limit: itemsPerPage });

        return res.status(200).json({
            status: "success",
            message: "Lista de seguidores",
            followers: followersUsers,
            follows, // Incluir los objetos completos también
            total,
            pages,
            currentPage
        });

    } catch (error) {
        console.error('Error al obtener seguidores:', error);
        return res.status(500).json({
            status: "error",
            message: "Error al obtener lista de seguidores",
            error: error.message
        });
    }
};

// Obtener contadores de seguidos y seguidores
const counters = async (req, res) => {
    try {
        let userId = req.user.id;
        
        // Si viene un ID en los parámetros, usar ese ID en lugar del autenticado
        if (req.params.id) {
            userId = req.params.id;
        }

        console.log('Obteniendo contadores para el usuario:', userId);

        const { followers, following } = await followService.getCounters(userId);

        console.log(`Contadores: ${followers} seguidores, ${following} seguidos`);

        return res.status(200).json({
            status: "success",
            message: "Contadores de seguimiento",
            userId,
            followers,
            following
        });

    } catch (error) {
        console.error('Error al obtener contadores:', error);
        return res.status(500).json({
            status: "error",
            message: "Error al obtener contadores de seguimiento",
            error: error.message
        });
    }
};

// Obtener contador de seguidores
const followersCount = async (req, res) => {
    try {
        const { id } = req.params;
        const { count } = await followService.getFollowersCount(id);
        
        return res.status(200).json({
            status: "success",
            count
        });
    } catch (error) {
        console.error('Error al obtener contador de seguidores:', error);
        return res.status(500).json({
            status: "error",
            message: "Error al obtener contador de seguidores",
            error: error.message
        });
    }
};

// Obtener contador de seguidos
const followingCount = async (req, res) => {
    try {
        const { id } = req.params;
        const { count } = await followService.getFollowingCount(id);
        
        return res.status(200).json({
            status: "success",
            count
        });
    } catch (error) {
        console.error('Error al obtener contador de seguidos:', error);
        return res.status(500).json({
            status: "error",
            message: "Error al obtener contador de seguidos",
            error: error.message
        });
    }
};

// Verificar si un usuario sigue a otro
const checkFollow = async (req, res) => {
    try {
        // ID del usuario autenticado (seguidor)
        const userId = req.user.id;
        // ID del usuario a verificar si es seguido
        const { id } = req.params;

        console.log('Verificando si el usuario', userId, 'sigue al usuario', id);

        const { isFollowing, follow } = await followService.checkFollow(userId, id);
        
        console.log('Resultado de la verificación:', isFollowing ? 'Sí sigue' : 'No sigue');

        return res.status(200).json({
            status: "success",
            isFollowing,
            follow: follow || null
        });
    } catch (error) {
        console.error('Error al verificar seguimiento:', error);
        return res.status(500).json({
            status: "error",
            message: "Error al verificar seguimiento",
            error: error.message
        });
    }
};

module.exports = {
    pruebaFollow,
    followUser,
    unfollowUser,
    following,
    followers,
    counters,
    followersCount,
    followingCount,
    checkFollow
};