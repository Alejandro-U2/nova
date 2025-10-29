const { Schema, model } = require("mongoose");

const FaceDescriptorSchema = Schema({
  user: {
    type: Schema.ObjectId,
    ref: "User",
    required: true
  },
  descriptor: {
    type: [Number],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Índice para búsquedas rápidas por usuario
FaceDescriptorSchema.index({ user: 1 });

module.exports = model("FaceDescriptor", FaceDescriptorSchema, "face_descriptors");
