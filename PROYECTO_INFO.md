# 🚀 Proyecto NOVA - Red Social con IA

## 📋 Información Básica del Proyecto

### **Tipo de Proyecto**
**Full Stack Application** - Frontend + Backend + Base de Datos

---

## 🛠️ Stack Tecnológico

### **Frontend**
- **Framework**: React 18+
- **Bundler**: Vite
- **Router**: React Router DOM
- **Estilos**: CSS puro personalizado
- **Inteligencia Artificial**: face-api.js (detección y reconocimiento facial)
- **Puerto de desarrollo**: 5173

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Autenticación**: JWT (JSON Web Tokens)
- **Encriptación**: bcrypt
- **Manejo de archivos**: Multer
- **CORS**: Habilitado para desarrollo
- **Puerto de desarrollo**: 5000

### **Base de Datos**
- **Tipo**: MongoDB (NoSQL)
- **ODM**: Mongoose
- **Colecciones**:
  - `users` - Usuarios del sistema
  - `publications` - Publicaciones con imágenes
  - `follows` - Sistema de seguir/seguidores
  - `profiles` - Perfiles de usuario
  - `face_data` - Rostros detectados y registrados con IA

---

## 🎯 Funcionalidades Principales

### **Autenticación y Usuarios**
- ✅ Registro de nuevos usuarios
- ✅ Login con JWT
- ✅ Perfiles personalizados
- ✅ Sistema de seguidores/seguidos

### **Publicaciones**
- ✅ Crear publicaciones con imágenes
- ✅ Feed de publicaciones
- ✅ Eliminar publicaciones propias
- ✅ Notificaciones toast (crear/eliminar)

### **Red Social**
- ✅ Buscar usuarios
- ✅ Seguir/dejar de seguir usuarios
- ✅ Ver perfiles de otros usuarios
- ✅ Botones de acción compactos

### **Inteligencia Artificial - Reconocimiento Facial**
- ✅ Detectar rostros en imágenes
- ✅ Analizar edad, género y expresiones faciales
- ✅ Registrar rostros con nombre personalizado
- ✅ Galería de rostros guardados
- ✅ Eliminar rostros registrados
- ✅ 5 modelos de IA cargados:
  - SSD MobileNet v1 (detección)
  - Face Landmark 68 puntos
  - Face Recognition (descriptores)
  - Face Expression (emociones)
  - Age Gender Net

### **Diseño**
- ✅ **100% Responsive** (móvil, tablet, desktop)
- ✅ Breakpoints: 360px, 480px, 768px, 992px, 1200px
- ✅ Navegación inferior en móviles
- ✅ Gradientes personalizados (Plum Noir, Lavender, Honey)
- ✅ Animaciones suaves y transiciones

---

## 📁 Estructura del Proyecto

```
nova/
├── backend/
│   ├── index.js                 # Servidor Express principal
│   ├── controllers/             # Lógica de negocio
│   │   ├── user.js
│   │   ├── publication.js
│   │   ├── follow.js
│   │   ├── profile.js
│   │   └── faceData.js         # Reconocimiento facial
│   ├── models/                  # Esquemas Mongoose
│   │   ├── user.js
│   │   ├── publication.js
│   │   ├── follow.js
│   │   ├── profile.js
│   │   └── faceData.js
│   ├── rutas/                   # Endpoints API
│   │   ├── user.js
│   │   ├── publication.js
│   │   ├── follow.js
│   │   ├── profile.js
│   │   └── faceData.js
│   ├── middlewares/
│   │   └── auth.js              # Verificación JWT
│   ├── services/
│   │   ├── jwt.js
│   │   ├── imageService.js
│   │   └── followService.js
│   ├── database/
│   │   └── connection.js
│   ├── uploads/                 # Archivos subidos
│   │   ├── publications/        # Imágenes de publicaciones
│   │   └── faces/               # Rostros detectados
│   └── .env                     # Variables de entorno
│
├── frontend/
│   ├── public/
│   │   ├── models/              # Modelos IA de face-api.js
│   │   ├── img/
│   │   └── gif/
│   ├── src/
│   │   ├── App.jsx              # Rutas principales
│   │   ├── main.jsx
│   │   ├── pages/               # Páginas de la aplicación
│   │   │   ├── Login.jsx
│   │   │   ├── register.jsx
│   │   │   ├── HomePremium.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Search.jsx
│   │   │   ├── Crear.jsx
│   │   │   ├── FaceDetection.jsx      # Detección facial
│   │   │   └── RegisteredFaces.jsx    # Galería de rostros
│   │   ├── components/          # Componentes reutilizables
│   │   │   ├── NavbarNew.jsx
│   │   │   ├── Loader.jsx
│   │   │   ├── FollowButton.jsx
│   │   │   ├── PublicationModal.jsx
│   │   │   ├── Notification.jsx
│   │   │   └── ToastNotification.jsx  # Sistema de notificaciones
│   │   ├── styles/              # CSS por módulo
│   │   │   ├── login.css
│   │   │   ├── register.css
│   │   │   ├── homePremium.css
│   │   │   ├── profile.css
│   │   │   ├── search.css
│   │   │   ├── crear.css
│   │   │   ├── navbarNew.css
│   │   │   ├── faceDetection.css
│   │   │   ├── registeredFaces.css
│   │   │   └── toastNotification.css
│   │   └── utils/
│   │       └── imageTransformations.js
│   └── index.html
│
├── package.json                 # Dependencias del proyecto
├── vite.config.js
├── eslint.config.js
└── README.md
```

---

## ⚙️ Cómo Ejecutar el Proyecto

### **Requisitos Previos**
- Node.js (v16 o superior)
- MongoDB (local o Atlas)
- npm o yarn

### **Instalación**

1. **Clonar el repositorio**
```bash
git clone https://github.com/Alejandro-U2/nova.git
cd nova
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear archivo `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/nova
# O usar MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/nova

JWT_SECRET=tu_clave_secreta_jwt_muy_segura
PORT=5000
```

4. **Descargar modelos de IA**
Los modelos de face-api.js deben estar en `frontend/public/models/`
- ssd_mobilenetv1_model-weights_manifest.json
- face_landmark_68_model-weights_manifest.json
- face_recognition_model-weights_manifest.json
- face_expression_model-weights_manifest.json
- age_gender_model-weights_manifest.json

### **Ejecutar en Desarrollo**

**Opción 1: Ejecutar todo junto**
```bash
npm run dev:all
```

**Opción 2: Ejecutar por separado**

Terminal 1 - Backend:
```bash
npm run dev:back
# O
cd backend
node index.js
```

Terminal 2 - Frontend:
```bash
npm run dev:front
# O
npm run dev
```

### **URLs de Desarrollo**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API Base: http://localhost:5000/api

---

## 🔑 Variables de Entorno

### **Backend (.env)**
```env
# Base de datos MongoDB
MONGODB_URI=mongodb://localhost:27017/nova

# Autenticación JWT
JWT_SECRET=clave_secreta_super_segura_cambiar_en_produccion

# Puerto del servidor
PORT=5000
```

⚠️ **IMPORTANTE**: El archivo `.env` NO debe subirse a GitHub (está en .gitignore)

---

## 🌐 API Endpoints

### **Usuarios**
- `POST /api/users/register` - Registrar nuevo usuario
- `POST /api/users/login` - Iniciar sesión
- `GET /api/users/all` - Listar todos los usuarios
- `GET /api/users/profile/:id` - Ver perfil de usuario

### **Publicaciones**
- `POST /api/publications/create` - Crear publicación
- `GET /api/publications/feed` - Obtener feed
- `DELETE /api/publications/delete/:id` - Eliminar publicación

### **Seguir/Seguidores**
- `POST /api/follow/follow` - Seguir usuario
- `DELETE /api/follow/unfollow/:id` - Dejar de seguir
- `GET /api/follow/following` - Lista de seguidos
- `GET /api/follow/followers/:id` - Lista de seguidores

### **Reconocimiento Facial**
- `POST /api/face-data/save` - Registrar rostro detectado
- `GET /api/face-data/list` - Listar rostros guardados
- `DELETE /api/face-data/delete/:id` - Eliminar rostro

### **Archivos Estáticos**
- `GET /uploads/publications/:filename` - Imágenes de publicaciones
- `GET /uploads/faces/:filename` - Imágenes de rostros

---

## 📦 Dependencias Principales

### **Frontend**
```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "face-api.js": "^0.22.2"
}
```

### **Backend**
```json
{
  "express": "^4.x",
  "mongoose": "^8.x",
  "jsonwebtoken": "^9.x",
  "bcrypt": "^5.x",
  "multer": "^1.x",
  "cors": "^2.x",
  "dotenv": "^16.x"
}
```

---

## 🚀 Control de Versiones

### **GitHub**
- **Repositorio**: https://github.com/Alejandro-U2/nova
- **Owner**: Alejandro-U2
- **Branch principal**: jeff-r
- **Estado**: Código fuente versionado

### **Archivos Ignorados (.gitignore)**
```
node_modules/
backend/.env
backend/uploads/
.DS_Store
*.log
```

---

## 🎨 Paleta de Colores

```css
/* Gradientes principales */
--plum-noir: #2D0A43;
--lavender-smoke: #6D3A8E;
--honey-drizzle: #FFA719;
--buttercream: #FFFADA;

/* Gradiente primario */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Gradiente secundario */
background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);

/* Gradiente éxito (registrar rostros) */
background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
```

---

## 📱 Breakpoints Responsive

```css
/* Desktop grande */
@media (max-width: 1200px) { /* Tablets landscape */ }

/* Tablets */
@media (max-width: 992px) { /* Tablets portrait */ }

/* Móvil grande */
@media (max-width: 768px) { /* Mobile landscape */ }

/* Móvil */
@media (max-width: 480px) { /* Mobile portrait */ }

/* Móvil pequeño */
@media (max-width: 360px) { /* Small mobile */ }
```

---

## 🎯 Objetivos del Proyecto

### **Actual**
- [x] Red social funcional con todas las features
- [x] Reconocimiento facial con IA integrado
- [x] Diseño responsive completo
- [x] Sistema de notificaciones
- [x] Versionado en GitHub

### **Próximos Pasos (Deployment)**
- [ ] Desplegar backend en Render/Railway/Heroku
- [ ] Desplegar frontend en Vercel/Netlify
- [ ] Migrar base de datos a MongoDB Atlas
- [ ] Configurar variables de entorno en producción
- [ ] Asignar dominio personalizado (opcional)
- [ ] Configurar HTTPS/SSL
- [ ] Optimizar imágenes y assets para producción

---

## 👥 Equipo y Contacto

**Desarrollador**: Alejandro-U2  
**GitHub**: https://github.com/Alejandro-U2  
**Repositorio**: https://github.com/Alejandro-U2/nova

---

## 📝 Notas Adicionales

### **Seguridad**
- Passwords encriptados con bcrypt
- JWT para sesiones seguras
- CORS configurado
- Validación de archivos en uploads
- Variables sensibles en .env

### **Performance**
- Lazy loading de imágenes
- Modelos de IA cargados bajo demanda
- Código dividido por rutas
- Assets optimizados

### **Compatibilidad**
- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Móviles iOS y Android
- Responsive desde 360px hasta 1920px+

---

## 📄 Licencia

Proyecto educativo/personal - Todos los derechos reservados

---

**Última actualización**: 29 de octubre de 2025
