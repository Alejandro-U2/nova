const mongoose = require('mongoose');

const connection = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/red-social', {
     
    });
    console.log("✅ Conectado a la base de datos MongoDB");
  } catch (error) {
    console.log("❌ Error conectando a la base de datos:", error);
    throw new Error("Error connecting to the database");
  }
};
module.exports = connection;