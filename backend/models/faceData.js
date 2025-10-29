const { Schema, model } = require('mongoose');

const faceDataSchema = Schema({
  user: {
    type: Schema.ObjectId,
    ref: "User",
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  descriptor: {
    type: [Number],
    required: true
  },
  age: {
    type: Number
  },
  gender: {
    type: String
  },
  expression: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = model("FaceData", faceDataSchema, "face_data");
