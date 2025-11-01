const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const faceRecognitionController = require("../controllers/faceRecognition");

// Rutas protegidas (requieren autenticación)
router.post("/detect", auth, faceRecognitionController.detectFaces);
router.post("/register", auth, faceRecognitionController.registerUserFace);
router.post("/recognize", auth, faceRecognitionController.recognizeFaces);
router.get("/descriptors", auth, faceRecognitionController.getUserFaceDescriptors);
router.delete("/descriptors", auth, faceRecognitionController.deleteFaceDescriptor);
router.post("/analyze/:publicationId", auth, faceRecognitionController.analyzePublication);

module.exports = router;
