const express = require("express");
const cors = require("cors");
const path = require('path');
const connectDB = require('./database/connection');
const app = express();
const PORT = process.env.PORT || 5000;

require("dotenv").config({ path: path.join(__dirname, '.env') });

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://18.222.143.196:5173'],
  credentials: true
}));
app.use(express.json());

// ----------Rutas
app.use("/api/users", require("./rutas/user"));
app.use("/api/profile", require("./rutas/profile"));
app.use("/api/publications", require("./rutas/publication"));
app.use("/api/follow", require("./rutas/follow"));

const startServer = async () => {
  try {
    await connectDB();
HEAD
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("Error al conectar DB:", err);
    process.exit(1);
  }
};

startServer();
