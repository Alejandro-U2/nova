const express = require("express");
const cors = require("cors");
const path = require('path');
const connectDB = require('./database/connection');
const app = express();
const PORT = process.env.PORT || 5000;

require("dotenv").config({ path: path.join(__dirname, '.env') });

app.use(cors());
app.use(express.json());

// ----------Rutas
app.use("/api/users", require("./rutas/user"));
app.use("/api/profile", require("./rutas/profile"));
app.use("/api/publications", require("./rutas/publication"));

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log('Servidor corriendo en http://0.0.0.0:5000');
    });
  } catch (err) {
    console.error("Error al conectar DB:", err);
    process.exit(1);
  }
};

startServer();
