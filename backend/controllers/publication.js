const Publication = require("../models/publication");
const Profile = require("../models/profile");
const User = require("../models/user");
const ImageService = require("../services/imageService");

// Crear nueva publicación
const createPublication = async (req, res) => {
  try {
    console.log('Iniciando creación de publicación...');
    console.log('Datos recibidos:', req.body);
    console.log('Usuario:', req.user);

    const userId = req.user.id;
    const { description, image, imageType = 'url' } = req.body;

    if (!image) {
      return res.status(400).json({
        message: "❌ La imagen es obligatoria"
      });
    }

    console.log('Creando publicación en la base de datos...');

    // Crear la publicación sin procesamiento de imagen por ahora
    const publication = new Publication({
      user: userId,
      description: description || "",
      image: image,
      thumbnail: image, // Usar la misma imagen como thumbnail temporalmente
      imageType: imageType
    });

    console.log('Guardando publicación...');
    await publication.save();
    console.log('Publicación guardada exitosamente');

    // Obtener la publicación con datos del usuario
    console.log('Obteniendo datos del usuario...');
    const populatedPublication = await Publication.findById(publication._id)
      .populate('user', 'name lastname nickname email');

    console.log('Publicación creada exitosamente');
    return res.status(201).json({
      message: "✅ Publicación creada exitosamente",
      publication: populatedPublication
    });
  } catch (error) {
    console.error('Error detallado al crear publicación:', error);
    return res.status(500).json({
      message: "❌ Error al crear la publicación",
      error: error.message,
      stack: error.stack
    });
  }
};

// Obtener feed de publicaciones (página de inicio)
const getFeedPublications = async (req, res) => {
  try {
    console.log('Obteniendo feed de publicaciones...');
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Obtener publicaciones sin populate por ahora
    const publications = await Publication.find({ isPublic: true })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log(`Encontradas ${publications.length} publicaciones`);

    // Enriquecer manualmente con datos de usuario
    const publicationsWithUsers = await Promise.all(
      publications.map(async (pub) => {
        try {
          const user = await User.findById(pub.user).select('name lastname nickname email');
          const profile = await Profile.findOne({ user: pub.user }).select('avatar name');
          
          return {
            _id: pub._id,
            description: pub.description,
            image: pub.image,
            thumbnail: pub.thumbnail,
            imageType: pub.imageType,
            created_at: pub.created_at,
            likes: pub.likes || [],
            comments: pub.comments || [],
            user: user,
            userProfile: profile
          };
        } catch (error) {
          console.log('Error obteniendo datos para publicación:', pub._id);
          return {
            _id: pub._id,
            description: pub.description,
            image: pub.image,
            thumbnail: pub.thumbnail,
            imageType: pub.imageType,
            created_at: pub.created_at,
            likes: pub.likes || [],
            comments: pub.comments || [],
            user: null,
            userProfile: null
          };
        }
      })
    );

    const total = await Publication.countDocuments({ isPublic: true });

    return res.status(200).json({
      message: "✅ Feed obtenido exitosamente",
      publications: publicationsWithUsers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener feed:', error);
    return res.status(500).json({
      message: "❌ Error al obtener el feed",
      error: error.message
    });
  }
};

// Obtener publicaciones de un usuario específico
const getUserPublications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "❌ Usuario no encontrado"
      });
    }

    const publications = await Publication.find({ 
      user: userId, 
      isPublic: true 
    })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Publication.countDocuments({ 
      user: userId, 
      isPublic: true 
    });

    return res.status(200).json({
      message: "✅ Publicaciones del usuario obtenidas exitosamente",
      publications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener publicaciones del usuario:', error);
    return res.status(500).json({
      message: "❌ Error al obtener las publicaciones",
      error: error.message
    });
  }
};

// Obtener publicaciones del usuario autenticado
const getMyPublications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const publications = await Publication.find({ 
      user: userId 
    })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name lastname nickname email');

    const total = await Publication.countDocuments({ 
      user: userId 
    });

    return res.status(200).json({
      message: "✅ Mis publicaciones obtenidas exitosamente",
      publications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener mis publicaciones:', error);
    return res.status(500).json({
      message: "❌ Error al obtener las publicaciones",
      error: error.message
    });
  }
};

// Dar/quitar like a una publicación
const toggleLike = async (req, res) => {
  try {
    const userId = req.user.id;
    const { publicationId } = req.params;

    const publication = await Publication.findById(publicationId);
    if (!publication) {
      return res.status(404).json({
        message: "❌ Publicación no encontrada"
      });
    }

    // Verificar si ya dio like
    const existingLike = publication.likes.find(
      like => like.user.toString() === userId
    );

    if (existingLike) {
      // Quitar like
      publication.likes = publication.likes.filter(
        like => like.user.toString() !== userId
      );
    } else {
      // Agregar like
      publication.likes.push({ user: userId });
    }

    await publication.save();

    return res.status(200).json({
      message: existingLike ? "✅ Like removido" : "✅ Like agregado",
      likesCount: publication.likes.length,
      isLiked: !existingLike
    });
  } catch (error) {
    console.error('Error al procesar like:', error);
    return res.status(500).json({
      message: "❌ Error al procesar el like",
      error: error.message
    });
  }
};

// Agregar comentario a una publicación
const addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { publicationId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        message: "❌ El comentario no puede estar vacío"
      });
    }

    const publication = await Publication.findById(publicationId);
    if (!publication) {
      return res.status(404).json({
        message: "❌ Publicación no encontrada"
      });
    }

    publication.comments.push({
      user: userId,
      text: text.trim()
    });

    await publication.save();

    // Obtener el comentario recién agregado con datos del usuario (simplificado)
    const user = await User.findById(userId).select('name lastname nickname');
    const newComment = {
      _id: publication.comments[publication.comments.length - 1]._id,
      user: user,
      text: text.trim(),
      created_at: publication.comments[publication.comments.length - 1].created_at
    };

    return res.status(201).json({
      message: "✅ Comentario agregado exitosamente",
      comment: newComment,
      commentsCount: publication.comments.length
    });
  } catch (error) {
    console.error('Error al agregar comentario:', error);
    return res.status(500).json({
      message: "❌ Error al agregar el comentario",
      error: error.message
    });
  }
};

// Función de prueba
const testPublication = (req, res) => {
  return res.status(200).json({
    message: "✅ Ruta de publicaciones funcionando correctamente",
    user: req.user
  });
};

module.exports = {
  testPublication,
  createPublication,
  getFeedPublications,
  getUserPublications,
  getMyPublications,
  toggleLike,
  addComment
};