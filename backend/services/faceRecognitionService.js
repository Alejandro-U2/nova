const canvas = require('canvas');
const faceapi = require('face-api.js');
const path = require('path');
const FaceDescriptor = require('../models/faceDescriptor');

// Configurar face-api.js para Node.js
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

class FaceRecognitionService {
  constructor() {
    this.modelsLoaded = false;
    this.modelsPath = path.join(__dirname, '../models/face-api-models');
  }

  // Cargar modelos de face-api.js
  async loadModels() {
    if (this.modelsLoaded) return;

    try {
      console.log('🔄 Cargando modelos de face-api.js...');
      
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(this.modelsPath),
        faceapi.nets.faceLandmark68Net.loadFromDisk(this.modelsPath),
        faceapi.nets.faceRecognitionNet.loadFromDisk(this.modelsPath),
        faceapi.nets.faceExpressionNet.loadFromDisk(this.modelsPath),
        faceapi.nets.ageGenderNet.loadFromDisk(this.modelsPath)
      ]);

      this.modelsLoaded = true;
      console.log('✅ Modelos de face-api.js cargados correctamente');
    } catch (error) {
      console.error('❌ Error al cargar modelos:', error);
      throw new Error('No se pudieron cargar los modelos de reconocimiento facial');
    }
  }

  // Detectar rostros en una imagen base64
  async detectFaces(base64Image) {
    await this.loadModels();

    try {
      // Convertir base64 a imagen
      const img = await canvas.loadImage(base64Image);
      
      // Detectar rostros con landmarks, descriptores y expresiones
      const detections = await faceapi
        .detectAllFaces(img)
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions()
        .withAgeAndGender();

      return detections.map(detection => ({
        box: detection.detection.box,
        landmarks: detection.landmarks,
        descriptor: Array.from(detection.descriptor),
        expressions: detection.expressions,
        age: Math.round(detection.age),
        gender: detection.gender,
        genderProbability: detection.genderProbability
      }));
    } catch (error) {
      console.error('Error al detectar rostros:', error);
      throw error;
    }
  }

  // Guardar descriptor facial de un usuario
  async saveFaceDescriptor(userId, descriptor, label, imageUrl = null) {
    try {
      const faceDescriptor = new FaceDescriptor({
        user: userId,
        descriptor,
        label,
        imageUrl
      });

      await faceDescriptor.save();
      return faceDescriptor;
    } catch (error) {
      console.error('Error al guardar descriptor facial:', error);
      throw error;
    }
  }

  // Obtener todos los descriptores de un usuario
  async getUserDescriptors(userId) {
    try {
      return await FaceDescriptor.find({ user: userId });
    } catch (error) {
      console.error('Error al obtener descriptores:', error);
      throw error;
    }
  }

  // Comparar un descriptor con los almacenados en la BD
  async findMatchingFaces(descriptor, threshold = 0.6) {
    try {
      // Obtener todos los descriptores de la BD
      const allDescriptors = await FaceDescriptor.find().populate('user', 'name lastname nickname');

      const matches = [];

      for (const storedDescriptor of allDescriptors) {
        // Calcular distancia euclidiana entre descriptores
        const distance = faceapi.euclideanDistance(descriptor, storedDescriptor.descriptor);

        if (distance < threshold) {
          matches.push({
            user: storedDescriptor.user,
            label: storedDescriptor.label,
            distance,
            similarity: (1 - distance) * 100 // Convertir a porcentaje
          });
        }
      }

      // Ordenar por similitud (menor distancia = mayor similitud)
      return matches.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error al buscar coincidencias:', error);
      throw error;
    }
  }

  // Reconocer rostros en una imagen
  async recognizeFaces(base64Image, threshold = 0.6) {
    const detections = await this.detectFaces(base64Image);
    
    const recognizedFaces = await Promise.all(
      detections.map(async (detection) => {
        const matches = await this.findMatchingFaces(detection.descriptor, threshold);
        
        return {
          ...detection,
          matches: matches.slice(0, 3) // Top 3 coincidencias
        };
      })
    );

    return recognizedFaces;
  }

  // Eliminar descriptores de un usuario
  async deleteUserDescriptors(userId) {
    try {
      return await FaceDescriptor.deleteMany({ user: userId });
    } catch (error) {
      console.error('Error al eliminar descriptores:', error);
      throw error;
    }
  }
}

module.exports = new FaceRecognitionService();
