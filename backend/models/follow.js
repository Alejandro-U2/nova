const mongoose = require("mongoose");

const FollowSchema = new mongoose.Schema({
  // Usuario que está siguiendo
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  },
  // Usuario que está siendo seguido
  followed: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Índice compuesto para evitar seguimientos duplicados
FollowSchema.index({ user: 1, followed: 1 }, { unique: true });

module.exports = mongoose.model("Follow", FollowSchema);