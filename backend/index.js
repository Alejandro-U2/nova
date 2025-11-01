const express = require("express");
const cors = require("cors");
const path = require('path');
const connectDB = require('./database/connection');
const app = express();
const PORT = process.env.PORT || 5000;

require("dotenv").config({ path: path.join(__dirname, '.env') });

// === CORS ===
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://18.223.235.125:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
app.options(/^\/.*/, cors(corsOptions));
app.use(express.json());

// === Logging ===
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// === Health check ===
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// === Rutas ===
app.use("/api/users", require("./rutas/user"));
app.use("/api/profile", require("./rutas/profile"));
app.use("/api/publications", require("./rutas/publication"));
app.use("/api/follow", require("./rutas/follow"));

// === Manejo de errores ===
app.use((err, req, res, next) => {
  console.error("Error interno:", err);
  res.status(500).json({ message: "Error interno del servidor", error: err.message });
});

// === Inicialización ===
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log(`También disponible en http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("Error al conectar DB:", err);
    process.exit(1);
  }
};

startServer();
