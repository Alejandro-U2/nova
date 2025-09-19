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

    const user = await User.findOne({ email });
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

module.exports = {
  pruebaUser,
  registerUser,
  loginUser,
  getUser,
};