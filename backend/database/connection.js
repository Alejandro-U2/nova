const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connection = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/nova';
    await mongoose.connect(uri, {
    });
    console.log("Conectado a la base de datos MongoDB");
  } catch (error) {
    console.log("Error conectando a la base de datos:", error);
    throw new Error("Error connecting to the database");
  }
};

module.exports = connection;