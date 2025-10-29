# 🔔 Sistema de Notificaciones Toast - Documentación

## ✅ Implementación Completada

Se ha implementado un **sistema de notificaciones toast** completo para mostrar alertas cuando se crea o elimina una publicación.

---

## 📦 Archivos Creados

### 1. **ToastNotification.jsx** 
**Ubicación:** `frontend/src/components/ToastNotification.jsx`

**Componentes:**
- `ToastProvider`: Proveedor de contexto para las notificaciones
- `useToast`: Hook personalizado para usar las notificaciones
- `Toast`: Componente individual de notificación

**Métodos disponibles:**
```javascript
const toast = useToast();

toast.success("Mensaje de éxito");
toast.error("Mensaje de error");
toast.warning("Mensaje de advertencia");
toast.info("Mensaje informativo");
```

**Características:**
- ✨ Animaciones suaves (slide-in desde la derecha)
- ⏱️ Auto-cierre configurable (default: 4 segundos)
- 🎨 4 tipos: success, error, warning, info
- 📱 Completamente responsive
- 🎯 Posicionamiento top-right
- ❌ Botón de cierre manual
- 📊 Barra de progreso animada

---

### 2. **toastNotification.css**
**Ubicación:** `frontend/src/styles/toastNotification.css`

**Estilos incluidos:**
- Toast container con z-index 99999
- Animaciones slideInRight y shrink
- 4 variantes de color (verde, rojo, amarillo, azul)
- Responsive para móviles
- Bordes laterales de color
- Iconos SVG animados

---

## 🔧 Archivos Modificados

### 1. **App.jsx**
**Cambios:**
- Agregado import de `ToastProvider`
- Envuelto toda la aplicación con `<ToastProvider>`

```jsx
import { ToastProvider } from "./components/ToastNotification.jsx";

function App() {
  return (
    <ToastProvider>
      <div className="app">
        {/* ... resto del código ... */}
      </div>
    </ToastProvider>
  );
}
```

---

### 2. **Crear.jsx**
**Cambios:**
- Agregado import de `useToast`
- Inicializado hook: `const toast = useToast();`
- Agregadas notificaciones en:
  - ✅ Publicación creada exitosamente
  - ❌ Error al crear publicación
  - ⚠️ Máximo 10 imágenes por publicación

**Ejemplo de uso:**
```javascript
// Éxito
toast.success('🎉 ¡Publicación creada exitosamente!');

// Error
toast.error(`❌ ${errorMsg}`);

// Advertencia
toast.warning(`⚠️ Máximo 10 imágenes por publicación`);
```

---

### 3. **Profile.jsx**
**Cambios:**
- Agregado import de `useToast`
- Inicializado hook: `const toast = useToast();`
- Agregadas notificaciones en `handleDeletePublication`:
  - 🗑️ Publicación eliminada exitosamente
  - ❌ Error al eliminar publicación

**Ejemplo de uso:**
```javascript
// Éxito al eliminar
toast.success("🗑️ Publicación eliminada exitosamente");

// Error al eliminar
toast.error(`❌ ${errorMsg}`);
```

---

## 🎯 Alertas Implementadas

### **Crear Publicación (Crear.jsx)**

| Evento | Tipo | Mensaje | Emoji |
|--------|------|---------|-------|
| Publicación creada | Success | Publicación creada exitosamente | 🎉 |
| Error al crear | Error | [Mensaje de error] | ❌ |
| Límite de imágenes | Warning | Máximo 10 imágenes por publicación | ⚠️ |

### **Eliminar Publicación (Profile.jsx)**

| Evento | Tipo | Mensaje | Emoji |
|--------|------|---------|-------|
| Publicación eliminada | Success | Publicación eliminada exitosamente | 🗑️ |
| Error al eliminar | Error | Error al eliminar la publicación | ❌ |

---

## 🚀 Cómo Usar en Otros Componentes

### Paso 1: Importar el hook
```javascript
import { useToast } from '../components/ToastNotification';
```

### Paso 2: Inicializar
```javascript
const toast = useToast();
```

### Paso 3: Usar
```javascript
// Éxito
toast.success("¡Operación completada!");

// Error
toast.error("Algo salió mal");

// Advertencia
toast.warning("Cuidado con esto");

// Info
toast.info("Información importante");

// Con duración personalizada (en ms)
toast.success("Mensaje", 5000); // 5 segundos
```

---

## 🎨 Tipos de Toast

### **Success (Verde)**
- Color: `#10b981`
- Icono: Check circle
- Uso: Operaciones exitosas

### **Error (Rojo)**
- Color: `#ef4444`
- Icono: X circle
- Uso: Errores y fallos

### **Warning (Amarillo)**
- Color: `#f59e0b`
- Icono: Triangle exclamation
- Uso: Advertencias

### **Info (Azul)**
- Color: `#3b82f6`
- Icono: Info circle
- Uso: Información general

---

## 📱 Responsive

### Desktop
- Posición: Top right
- Ancho: 320px - 500px
- Gap: 12px entre toasts

### Móvil (< 768px)
- Posición: Top center
- Ancho: Full width (con margen)
- Padding reducido

### Móvil pequeño (< 480px)
- Iconos más pequeños (36px)
- Texto reducido (0.875rem)
- Botón de cierre compacto

---

## ⚙️ Configuración Avanzada

### Duración personalizada
```javascript
toast.success("Mensaje", 8000); // 8 segundos
toast.error("Mensaje", 0); // Sin auto-cierre
```

### Callback al cerrar
```javascript
const id = toast.success("Mensaje");
// Más tarde...
removeToast(id);
```

---

## 🎯 Casos de Uso Futuros

Puedes agregar toasts en:
- Login/Logout exitoso
- Registro de usuario
- Actualización de perfil
- Seguir/Dejar de seguir
- Comentarios publicados
- Likes/Reacciones
- Subida de imágenes
- Errores de red
- Validaciones de formulario

---

## 🐛 Debugging

### Ver toasts en consola
```javascript
const toast = useToast();
console.log(toast); // Ver métodos disponibles
```

### Verificar que el Provider esté activo
```javascript
import { useToast } from '../components/ToastNotification';

// Si esto lanza error, el Provider no está envolviendo tu componente
const toast = useToast();
```

---

## ✨ Características Técnicas

- **Context API**: Manejo global de estado
- **Hooks personalizados**: `useToast()`
- **Auto-remove**: Temporizador automático
- **Animaciones CSS**: `@keyframes`
- **Z-index**: 99999 (siempre visible)
- **Accesibilidad**: Estructura semántica
- **Performance**: Optimizado con `useCallback`

---

**Fecha de implementación:** Octubre 29, 2025
**Estado:** ✅ COMPLETADO Y FUNCIONAL
