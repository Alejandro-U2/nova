const User = require("../models/user");
const bcrypt = require("bcryptjs"); 
const jwt = require("jsonwebtoken");


// Ruta de prueba
const pruebaUser = (req, res) => {
  return res.status(200).json({ message: "Ruta de prueba funcionando ✅" });
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

// Login de usuario
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

    // Generar token real
    const token = jwt.sign(
  { id: user._id, email: user.email }, 
  process.env.JWT_SECRET || "mi_secreto_super_seguro", 
  { expiresIn: "2h" }
);


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
    return res.status(500).json({ message: "Error al iniciar sesión", error });
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