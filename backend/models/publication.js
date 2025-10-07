const mongoose = require("mongoose");

const PublicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  },
  description: {
    type: String,
    default: "",
    maxlength: 2000
  },
  image: {
    type: String, // URL o base64 de la imagen original
    required: true
  },
  thumbnail: {
    type: String, // URL o base64 de la miniatura
    default: ""
  },
  imageType: {
    type: String,
    enum: ['url', 'base64'],
    default: 'url'
  },
  likes: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User"
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 500
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Middleware para actualizar updated_at antes de guardar
PublicationSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Índices para mejorar el rendimiento
PublicationSchema.index({ user: 1, created_at: -1 });
PublicationSchema.index({ created_at: -1 });
PublicationSchema.index({ isPublic: 1, created_at: -1 });

module.exports = mongoose.model("Publication", PublicationSchema);