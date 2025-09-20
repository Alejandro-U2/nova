# Nova

## Descripción
Nova es una aplicación web que combina un frontend desarrollado con React y Vite, y un backend construido con Express y MongoDB. La aplicación permite a los usuarios registrarse, iniciar sesión y explorar funcionalidades relacionadas con bienes raíces en un espacio virtual.

## Características
- **Frontend:**
  - React con Vite para un desarrollo rápido y eficiente.
  - Navegación mediante React Router.
  - Estilos personalizados con CSS y soporte para Tailwind CSS.
- **Backend:**
  - Express para manejar las rutas y lógica del servidor.
  - MongoDB como base de datos para almacenar usuarios y datos.
  - Autenticación mediante JWT.

## Instalación
### Requisitos
- Node.js v22.18.0 o superior
- MongoDB configurado y corriendo

### Pasos
1. Clona este repositorio:
   ```bash
   git clone https://github.com/Alejandro-U2/nova.git
   ```
2. Navega al directorio del proyecto:
   ```bash
   cd nova
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Configura las variables de entorno en un archivo `.env`:
   ```env
   PORT=5000
   MONGO_URI=tu_uri_de_mongodb
   JWT_SECRET=tu_secreto_jwt
   ```
5. Inicia el backend:
   ```bash
   cd backend
   node index.js
   ```
6. Inicia el frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## Uso
### Rutas del Frontend
- `/` - Página de inicio de sesión
- `/register` - Página de registro
- `/inicio` - Página de bienvenida
- `/forgot-password` - Recuperar contraseña
- `/learn-more` - Aprende más

### Rutas del Backend
- `POST /api/users/register` - Registrar un nuevo usuario
- `POST /api/users/login` - Iniciar sesión
- `GET /api/users/:id` - Obtener información de un usuario

## Tecnologías
- **Frontend:** React, Vite, CSS, Tailwind CSS
- **Backend:** Node.js, Express, MongoDB
- **Autenticación:** JWT

## Contribución
Si deseas contribuir, por favor abre un issue o envía un pull request.

## Licencia
Este proyecto está bajo la licencia MIT.

---
¡Gracias por usar Nova! 🚀
