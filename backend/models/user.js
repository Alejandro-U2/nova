const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lastname: { type: String, required: true },
  nickname: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  googleId: { type: String, unique: true, sparse: true }, // ID único de Google
  image: { type: String }, // URL de la imagen de perfil
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
