const User = require("../models/user");
const moment = require("moment");
const claveSecreta = process.env.JWT_SECRET || "mi_secreto_super_seguro";
const bcrypt = require("bcryptjs"); 
const jwt = require("jwt-simple");



// Ruta de prueba que devuelve datos del usuario autenticado
const pruebaUser = async (req, res) => {
  try {
    // El middleware auth ya decodificó el token y puso los datos en req.user
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password"); // quitamos password por seguridad
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json({
      message: "✅ Usuario autenticado",
      user
    });
  } catch (error) {
    return res.status(500).json({ message: "Error en prueba usuario", error: error.message });
  }
};


// Registrar usuario
const registerUser = async (req, res) => {
  try {
    const { name, lastname, nickname, email, password } = req.body;

    if (!name || !lastname || !nickname || !email || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const existingNickname = await User.findOne({ nickname });
    if (existingNickname) {
      return res.status(400).json({ message: "El nickname ya está en uso" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      lastname,
      nickname,
      email,
      password: hashedPassword,
    });

    await user.save();

    return res.status(201).json({
      message: "✅ Usuario registrado con éxito",
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        lastname: user.lastname,
        nickname: user.nickname,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al registrar usuario", error });
  }
};

// Login de usuario con jwt-simple
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Correo y contraseña son obligatorios" });
    }

    const user = await User.findOne({ $or: [{ email }, { nickname: email }] });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Crear payload manual
    const payload = {
      id: user._id,
      email: user.email,
      iat: moment().unix(),             // fecha de emisión
      exp: moment().add(2, "hours").unix() // expiración en 2h
    };

    // Generar token con jwt-simple
    const token = jwt.encode(payload, claveSecreta);

    return res.status(200).json({
      message: "✅ Inicio de sesión exitoso",
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        lastname: user.lastname,
        nickname: user.nickname,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al iniciar sesión", error: error.message });
  }
};
// Obtener usuario por ID
const getUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json({
      message: "Usuario encontrado",
      user: {
        id: user._id,
        name: user.name,
        lastname: user.lastname,
        nickname: user.nickname,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener usuario", error });
  }
};

// Buscar usuarios
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query; // término de búsqueda
    console.log("🔍 Búsqueda solicitada con término:", q);

    if (!q || q.trim() === '') {
      return res.status(400).json({ message: "Término de búsqueda requerido" });
    }

    // Primero verificar cuántos usuarios hay en total
    const totalUsers = await User.countDocuments();
    console.log("📊 Total de usuarios en la base de datos:", totalUsers);

    // Buscar usuarios por nombre, apellido, nickname o email
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { lastname: { $regex: q, $options: 'i' } },
        { nickname: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }).select("-password").limit(20); // Limitamos a 20 resultados y excluimos password

    console.log("✅ Usuarios encontrados:", users.length);

    return res.status(200).json({
      message: "Búsqueda completada",
      users,
      count: users.length,
      totalUsers
    });
  } catch (error) {
    console.error("❌ Error en búsqueda:", error);
    return res.status(500).json({ 
      message: "Error al buscar usuarios", 
      error: error.message 
    });
  }
};

// Obtener todos los usuarios (para debug)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").limit(10);
    console.log("📋 Usuarios en la base de datos:", users.length);
    
    return res.status(200).json({
      message: "Usuarios obtenidos",
      users,
      count: users.length
    });
  } catch (error) {
    console.error("❌ Error obteniendo usuarios:", error);
    return res.status(500).json({ 
      message: "Error al obtener usuarios", 
      error: error.message 
    });
  }
};

module.exports = {
  pruebaUser,
  registerUser,
  loginUser,
  getUser,
  searchUsers,
  getAllUsers,
};