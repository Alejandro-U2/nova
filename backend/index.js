const express = require("express");
const cors = require("cors");
const path = require('path');
const connectDB = require('./database/connection');
const app = express();
const PORT = process.env.PORT || 5000;

require("dotenv").config({ path: path.join(__dirname, '.env') });

// Configuración CORS mejorada
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://18.220.112.250:5000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// ----------Rutas
app.use("/api/users", require("./rutas/user"));
app.use("/api/profile", require("./rutas/profile"));
app.use("/api/publications", require("./rutas/publication"));
app.use("/api/follow", require("./rutas/follow"));

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