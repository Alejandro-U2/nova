const https = require('https');
const fs = require('fs');
const path = require('path');

const MODELS_DIR_BACKEND = path.join(__dirname, 'face-api-models');
const MODELS_DIR_FRONTEND = path.join(__dirname, '../../frontend/public/models');

// Crear directorios si no existen
[MODELS_DIR_BACKEND, MODELS_DIR_FRONTEND].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const models = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
  'age_gender_model-weights_manifest.json',
  'age_gender_model-shard1'
];

const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function downloadModels() {
  console.log('📦 Descargando modelos de face-api.js...\n');

  for (const model of models) {
    const url = BASE_URL + model;
    const destBackend = path.join(MODELS_DIR_BACKEND, model);
    const destFrontend = path.join(MODELS_DIR_FRONTEND, model);

    try {
      // Descargar para backend
      if (!fs.existsSync(destBackend)) {
        console.log(`⬇️  Descargando ${model} (backend)...`);
        await downloadFile(url, destBackend);
        console.log(`✅ ${model} descargado (backend)`);
      }

      // Copiar a frontend
      if (!fs.existsSync(destFrontend)) {
        console.log(`📋 Copiando ${model} (frontend)...`);
        fs.copyFileSync(destBackend, destFrontend);
        console.log(`✅ ${model} copiado (frontend)`);
      }
    } catch (error) {
      console.error(`❌ Error con ${model}:`, error.message);
    }
  }

  console.log('\n✨ Todos los modelos descargados correctamente!');
  console.log(`📁 Backend: ${MODELS_DIR_BACKEND}`);
  console.log(`📁 Frontend: ${MODELS_DIR_FRONTEND}`);
}

downloadModels().catch(console.error);
