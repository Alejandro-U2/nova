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
app.use("/api/follow", require("./rutas/follow"));

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error al conectar DB:", err);
    process.exit(1);
  }
};

startServer();
