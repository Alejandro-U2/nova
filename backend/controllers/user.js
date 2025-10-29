const User = require("../models/user");
const moment = require("moment");
const claveSecreta = process.env.JWT_SECRET || "mi_secreto_super_seguro";
const bcrypt = require("bcryptjs"); 
const jwt = require("jwt-simple");
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);



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
    const { email, password, captchaValue } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        status: 'error',
        message: "Correo y contraseña son obligatorios" 
      });
    }

    // Verificar reCAPTCHA v3 si está configurado
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    if (recaptchaSecret && captchaValue) {
      try {
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
        const recaptchaResponse = await axios.post(verifyUrl, null, {
          params: {
            secret: recaptchaSecret,
            response: captchaValue
          }
        });
        
        console.log('📊 reCAPTCHA response:', recaptchaResponse.data);
        
        if (!recaptchaResponse.data.success) {
          return res.status(400).json({ 
            status: 'error',
            message: "Verificación de reCAPTCHA fallida" 
          });
        }

        // Para reCAPTCHA v3, verificar el score (puntaje)
        // Score va de 0.0 (bot) a 1.0 (humano)
        const score = recaptchaResponse.data.score || 0;
        if (score < 0.5) {
          console.log(`⚠️ reCAPTCHA score bajo: ${score}`);
          return res.status(400).json({ 
            status: 'error',
            message: "Verificación de reCAPTCHA fallida. Por favor, intenta de nuevo." 
          });
        }

        console.log(`✅ reCAPTCHA verificado con score: ${score}`);
      } catch (error) {
        console.error('❌ Error verificando reCAPTCHA:', error);
        return res.status(500).json({ 
          status: 'error',
          message: "Error al verificar reCAPTCHA" 
        });
      }
    }

    const user = await User.findOne({ $or: [{ email }, { nickname: email }] });
    if (!user) {
      return res.status(404).json({ 
        status: 'error',
        message: "Usuario no encontrado" 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        status: 'error',
        message: "Contraseña incorrecta" 
      });
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
      status: 'success',
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
    return res.status(500).json({ 
      status: 'error',
      message: "Error al iniciar sesión", 
      error: error.message 
    });
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

// ============================================================
// 🔹 LOGIN CON GOOGLE
// ============================================================
const googleLogin = async (req, res) => {
  try {
    const { credential, email, name, image, sub } = req.body;

    // Verificar el token de Google
    let googleEmail, googleName, googleImage, googleSub;

    if (credential) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        googleEmail = payload.email;
        googleName = payload.name;
        googleImage = payload.picture;
        googleSub = payload.sub;
      } catch (error) {
        console.error('❌ Error verificando token de Google:', error);
        return res.status(401).json({ 
          status: 'error',
          message: 'Token de Google inválido' 
        });
      }
    } else {
      // Si no hay credential, usar los datos directos (ya verificados en frontend)
      googleEmail = email;
      googleName = name;
      googleImage = image;
      googleSub = sub;
    }

    if (!googleEmail) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Email de Google requerido' 
      });
    }

    // Buscar usuario existente por email o googleId
    let user = await User.findOne({ 
      $or: [
        { email: googleEmail },
        { googleId: googleSub }
      ]
    });

    if (user) {
      // Usuario ya existe, actualizar googleId si no lo tiene
      if (!user.googleId && googleSub) {
        user.googleId = googleSub;
        await user.save();
      }
    } else {
      // Crear nuevo usuario
      const nameParts = googleName.split(' ');
      const firstName = nameParts[0] || 'Usuario';
      const lastName = nameParts.slice(1).join(' ') || 'Google';
      
      // Generar nickname único basado en el email
      let baseNickname = googleEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      let nickname = baseNickname;
      let counter = 1;
      
      // Asegurar que el nickname sea único
      while (await User.findOne({ nickname })) {
        nickname = `${baseNickname}${counter}`;
        counter++;
      }

      user = new User({
        name: firstName,
        lastname: lastName,
        nickname,
        email: googleEmail,
        password: await bcrypt.hash(Math.random().toString(36), 10), // Password aleatorio
        googleId: googleSub,
        image: googleImage,
      });

      await user.save();
    }

    // Crear payload y token
    const payload = {
      id: user._id,
      email: user.email,
      iat: moment().unix(),
      exp: moment().add(7, "days").unix() // 7 días para login social
    };

    const token = jwt.encode(payload, claveSecreta);

    return res.status(200).json({
      status: 'success',
      message: '✅ Inicio de sesión con Google exitoso',
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        lastname: user.lastname,
        nickname: user.nickname,
        email: user.email,
        image: user.image,
      },
    });
  } catch (error) {
    console.error('❌ Error en login con Google:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Error al procesar login con Google', 
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
  googleLogin,
};