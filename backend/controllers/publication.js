const Publication = require("../models/publication");
const Profile = require("../models/profile");
const User = require("../models/user");
const ImageService = require("../services/imageService");

// Crear nueva publicación
const createPublication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { description, images } = req.body;

    // Validar que haya al menos una imagen y máximo 10
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        message: "❌ Debes subir al menos una imagen"
      });
    }

    if (images.length > 10) {
      return res.status(400).json({
        message: "❌ Máximo 10 imágenes por publicación"
      });
    }

    // Validar que todas las imágenes sean base64 válidas
    for (const image of images) {
      if (!ImageService.isValidBase64Image(image)) {
        return res.status(400).json({
          message: "❌ Todas las imágenes deben estar en formato base64 válido"
        });
      }
    }

    // Procesar todas las imágenes
    const processedImages = await Promise.all(
      images.map(async (image) => {
        const [original, scaled, bw, sepia, cyanotype] = await Promise.all([
          ImageService.optimizeImage(image),
          ImageService.generateScaled(image),
          ImageService.generateBlackAndWhite(image),
          ImageService.generateSepia(image),
          ImageService.generateCyanotype(image)
        ]);
        
        return {
          original,
          scaled,
          bw,
          sepia,
          cyanotype
        };
      })
    );

    // Crear la publicación con las imágenes procesadas
    const publication = new Publication({
      user: userId,
      description: description || "",
      images: processedImages
    });

    await publication.save();

    // Obtener la publicación con datos del usuario
    const populatedPublication = await Publication.findById(publication._id)
      .populate('user', 'name lastname nickname email');

    return res.status(201).json({
      message: `✅ Publicación creada con ${processedImages.length} imagen(es)`,
      publication: populatedPublication
    });
  } catch (error) {
    console.error('Error detallado al crear publicación:', error);
    return res.status(500).json({
      message: "❌ Error al crear la publicación",
      error: error.message
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
            images: pub.images,
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
            images: pub.images || {},
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
      .limit(parseInt(limit))
      .populate({
        path: 'comments.user',
        select: 'name lastname nickname'
      });

    // Enriquecer comentarios con avatares de los perfiles
    const enrichedPublications = await Promise.all(
      publications.map(async (pub) => {
        const pubObj = pub.toObject();
        if (pubObj.comments && pubObj.comments.length > 0) {
          pubObj.comments = await Promise.all(
            pubObj.comments.map(async (comment) => {
              if (comment.user && comment.user._id) {
                const profile = await Profile.findOne({ user: comment.user._id }).select('avatar');
                return {
                  ...comment,
                  user: {
                    ...comment.user,
                    avatar: profile?.avatar || null
                  }
                };
              }
              return comment;
            })
          );
        }
        return pubObj;
      })
    );

    const total = await Publication.countDocuments({ 
      user: userId, 
      isPublic: true 
    });

    return res.status(200).json({
      message: "✅ Publicaciones del usuario obtenidas exitosamente",
      publications: enrichedPublications,
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

    // Obtener el comentario recién agregado con datos del usuario Y del perfil
    const user = await User.findById(userId).select('name lastname nickname');
    const profile = await Profile.findOne({ user: userId }).select('avatar');
    
    const newComment = {
      _id: publication.comments[publication.comments.length - 1]._id,
      user: {
        ...user.toObject(),
        avatar: profile?.avatar || null
      },
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

// Eliminar publicación
const deletePublication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Buscar la publicación
    const publication = await Publication.findById(id);

    if (!publication) {
      return res.status(404).json({
        message: "❌ Publicación no encontrada"
      });
    }

    // Verificar que el usuario sea el dueño de la publicación
    if (publication.user.toString() !== userId) {
      return res.status(403).json({
        message: "❌ No tienes permiso para eliminar esta publicación"
      });
    }

    // Eliminar la publicación
    await Publication.findByIdAndDelete(id);

    return res.status(200).json({
      message: "✅ Publicación eliminada exitosamente",
      publicationId: id
    });

  } catch (error) {
    console.error("❌ Error al eliminar publicación:", error);
    return res.status(500).json({
      message: "❌ Error al eliminar la publicación",
      error: error.message
    });
  }
};

module.exports = {
  testPublication,
  createPublication,
  getFeedPublications,
  getUserPublications,
  getMyPublications,
  toggleLike,
  addComment,
  deletePublication
};