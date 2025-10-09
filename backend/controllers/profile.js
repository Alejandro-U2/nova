const Profile = require("../models/profile");
const User = require("../models/user");

// Obtener perfil del usuario autenticado
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    let profile = await Profile.findOne({ user: userId }).populate('user', 'name lastname nickname email');
    
    if (!profile) {
      // Si no existe perfil, obtener datos del usuario para crearlo
      const user = await User.findById(userId);
      profile = new Profile({
        user: userId,
        name: `${user.name} ${user.lastname}`,
        bio: "",
        coverPhoto: "",
        avatar: ""
      });
      await profile.save();
      await profile.populate('user', 'name lastname nickname email');
    }

    return res.status(200).json({
      message: "✅ Perfil obtenido exitosamente",
      profile
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Error al obtener el perfil",
      error: error.message
    });
  }
};

// Obtener perfil por ID de usuario (público)
const getProfileById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar si el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "❌ Usuario no encontrado"
      });
    }

    let profile = await Profile.findOne({ user: userId }).populate('user', 'name lastname nickname email created_at');
    
    if (!profile) {
      return res.status(404).json({
        message: "❌ Perfil no encontrado"
      });
    }

    return res.status(200).json({
      message: "✅ Perfil obtenido exitosamente",
      profile
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Error al obtener el perfil",
      error: error.message
    });
  }
};

// Crear o actualizar perfil
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, lastname, nickname, bio, coverPhoto, avatar } = req.body;

    // Buscar perfil existente
    let profile = await Profile.findOne({ user: userId });

    // Actualizar datos del usuario en la colección de usuarios
    if (name !== undefined || lastname !== undefined || nickname !== undefined) {
      const user = await User.findById(userId);
      
      if (user) {
        if (name !== undefined) user.name = name;
        if (lastname !== undefined) user.lastname = lastname;
        if (nickname !== undefined) user.nickname = nickname;
        
        await user.save();
        console.log("Usuario actualizado:", user);
      } else {
        console.error("Usuario no encontrado con ID:", userId);
      }
    }

    if (!profile) {
      // Crear nuevo perfil
      profile = new Profile({
        user: userId,
        name: name || "",
        bio: bio || "",
        coverPhoto: coverPhoto || "",
        avatar: avatar || ""
      });
    } else {
      // Actualizar perfil existente
      if (name !== undefined) profile.name = name;
      if (bio !== undefined) profile.bio = bio;
      if (coverPhoto !== undefined) profile.coverPhoto = coverPhoto;
      if (avatar !== undefined) profile.avatar = avatar;
    }

    await profile.save();
    await profile.populate('user', 'name lastname nickname email');

    return res.status(200).json({
      message: "✅ Perfil actualizado exitosamente",
      profile
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Error al actualizar el perfil",
      error: error.message
    });
  }
};

// Obtener todos los perfiles (para listado/búsqueda)
const getAllProfiles = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Si hay búsqueda, buscar por nombre o bio
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = {
        $or: [
          { name: searchRegex },
          { bio: searchRegex }
        ]
      };
    }

    const profiles = await Profile.find(query)
      .populate('user', 'name lastname nickname email created_at')
      .sort({ updated_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Profile.countDocuments(query);

    return res.status(200).json({
      message: "✅ Perfiles obtenidos exitosamente",
      profiles,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Error al obtener los perfiles",
      error: error.message
    });
  }
};

// Función de prueba
const testProfile = (req, res) => {
  return res.status(200).json({
    message: "✅ Ruta de perfil funcionando correctamente",
    user: req.user
  });
};

module.exports = {
  testProfile,
  getMyProfile,
  getProfileById,
  updateProfile,
  getAllProfiles
};