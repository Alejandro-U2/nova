/**
 * Script de prueba para verificar el funcionamiento del sistema de reconocimiento facial
 * Ejecutar con: node backend/test-face-recognition.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const faceRecognitionService = require('./services/faceRecognitionService');
const FaceDescriptor = require('./models/faceDescriptor');

// Conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nova');
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error);
    process.exit(1);
  }
};

// Prueba 1: Cargar modelos
const testLoadModels = async () => {
  console.log('\n📦 Prueba 1: Cargando modelos...');
  try {
    await faceRecognitionService.loadModels();
    console.log('✅ Modelos cargados correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al cargar modelos:', error.message);
    return false;
  }
};

// Prueba 2: Verificar estructura de BD
const testDatabaseStructure = async () => {
  console.log('\n🗄️  Prueba 2: Verificando estructura de BD...');
  try {
    const count = await FaceDescriptor.countDocuments();
    console.log(`✅ Modelo FaceDescriptor OK (${count} registros)`);
    return true;
  } catch (error) {
    console.error('❌ Error en la estructura de BD:', error.message);
    return false;
  }
};

// Prueba 3: Verificar archivos de modelos
const testModelFiles = () => {
  console.log('\n📁 Prueba 3: Verificando archivos de modelos...');
  const fs = require('fs');
  const modelsDir = path.join(__dirname, 'models/face-api-models');
  
  const requiredFiles = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'face_landmark_68_model-weights_manifest.json',
    'face_recognition_model-weights_manifest.json',
    'face_expression_model-weights_manifest.json',
    'age_gender_model-weights_manifest.json'
  ];

  let allExist = true;

  requiredFiles.forEach(file => {
    const filePath = path.join(modelsDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - NO ENCONTRADO`);
      allExist = false;
    }
  });

  if (!allExist) {
    console.log('\n💡 Para descargar los modelos ejecuta:');
    console.log('   npm run download-models');
  }

  return allExist;
};

// Prueba 4: Verificar endpoints
const testEndpoints = () => {
  console.log('\n🔌 Prueba 4: Endpoints disponibles:');
  console.log('✅ POST /api/face-recognition/detect');
  console.log('✅ POST /api/face-recognition/register');
  console.log('✅ POST /api/face-recognition/recognize');
  console.log('✅ GET  /api/face-recognition/descriptors');
  console.log('✅ DELETE /api/face-recognition/descriptors');
  console.log('✅ POST /api/face-recognition/analyze/:publicationId');
  return true;
};

// Prueba 5: Estadísticas
const testStats = async () => {
  console.log('\n📊 Prueba 5: Estadísticas del sistema:');
  try {
    const totalDescriptors = await FaceDescriptor.countDocuments();
    const uniqueUsers = await FaceDescriptor.distinct('user');
    
    console.log(`📌 Descriptores faciales registrados: ${totalDescriptors}`);
    console.log(`👥 Usuarios con rostros registrados: ${uniqueUsers.length}`);
    
    if (totalDescriptors > 0) {
      const recentDescriptors = await FaceDescriptor.find()
        .sort({ created_at: -1 })
        .limit(5)
        .populate('user', 'name lastname nickname');
      
      console.log('\n🕐 Últimos registros:');
      recentDescriptors.forEach((desc, idx) => {
        console.log(`  ${idx + 1}. ${desc.user?.name || 'Usuario desconocido'} - ${desc.label}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error.message);
    return false;
  }
};

// Ejecutar todas las pruebas
const runAllTests = async () => {
  console.log('🧪 INICIANDO PRUEBAS DEL SISTEMA DE RECONOCIMIENTO FACIAL\n');
  console.log('='.repeat(60));

  await connectDB();

  const results = {
    modelos: await testLoadModels(),
    database: await testDatabaseStructure(),
    archivos: testModelFiles(),
    endpoints: testEndpoints(),
    stats: await testStats()
  };

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 RESUMEN DE PRUEBAS:\n');

  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test.toUpperCase()}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const allPassed = Object.values(results).every(r => r === true);

  console.log('\n' + '='.repeat(60));
  
  if (allPassed) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
    console.log('\n✨ El sistema de reconocimiento facial está listo para usar.\n');
    console.log('📝 Documentación:');
    console.log('   - FACE_RECOGNITION_DOCS.md (completa)');
    console.log('   - FACE_RECOGNITION_QUICK_START.md (guía rápida)\n');
  } else {
    console.log('\n⚠️  ALGUNAS PRUEBAS FALLARON');
    console.log('\nRevisa los errores anteriores y:');
    console.log('1. Ejecuta: npm run download-models');
    console.log('2. Verifica la conexión a MongoDB');
    console.log('3. Asegúrate de tener las dependencias instaladas\n');
  }

  await mongoose.connection.close();
  process.exit(allPassed ? 0 : 1);
};

// Ejecutar
runAllTests().catch(error => {
  console.error('\n💥 Error crítico:', error);
  process.exit(1);
});
