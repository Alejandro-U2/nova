# 🔄 ACTUALIZACIÓN IMPORTANTE - reCAPTCHA v3

## ⚠️ Se cambió de reCAPTCHA v2 a v3

Tu clave de reCAPTCHA es de **versión 3** (invisible), por lo que actualicé el código para usar `react-google-recaptcha-v3`.

## 🆚 Diferencias entre v2 y v3

### reCAPTCHA v2
- ❌ Requiere que el usuario haga clic en "No soy un robot"
- ❌ Visible y puede interrumpir la experiencia del usuario
- ✅ Más fácil de implementar

### reCAPTCHA v3 (TU VERSIÓN)
- ✅ **Invisible** - No interrumpe al usuario
- ✅ Funciona automáticamente en segundo plano
- ✅ Devuelve un **score** (0.0 a 1.0) indicando si es bot o humano
- ✅ Mejor experiencia de usuario

## 🔑 Tus Claves reCAPTCHA v3

```
Clave del Sitio:  6Lc_2OgrAAAAAKBj98_OB9nzxqnUlI3z_29cBUDB
Clave Secreta:    6Lc_2OgrAAAAAHLJYGNl4HWDdqBXaZw-16Sd0kFR
```

## 📦 Dependencias Actualizadas

```bash
# Desinstalada (v2)
react-google-recaptcha

# Instalada (v3)
react-google-recaptcha-v3
```

## 🎯 Cómo Funciona Ahora

1. **Usuario llena el formulario** y hace clic en "Iniciar Sesión"
2. **reCAPTCHA v3 se ejecuta automáticamente** (invisible)
3. **Google analiza el comportamiento** y devuelve un score:
   - **0.0 a 0.5** = Probablemente bot → Login bloqueado
   - **0.5 a 1.0** = Probablemente humano → Login permitido
4. Si pasa la verificación, continúa el login normalmente

## 🌐 Dominios en reCAPTCHA Admin

En https://www.google.com/recaptcha/admin, asegúrate de tener:

```
localhost
127.0.0.1
```

**SIN** `http://`, `https://`, puerto ni ruta.

## ✅ Beneficios del Cambio

- ✅ **No hay checkbox visible** - Mejor UX
- ✅ **Validación automática** - Más rápido
- ✅ **Score inteligente** - Detecta bots mejor
- ✅ **Sin interrupciones** - El usuario no nota nada

## 🔍 Verificación en el Backend

El backend ahora verifica:
1. ✅ Que el token sea válido
2. ✅ Que el score sea >= 0.5 (ajustable)

Logs en consola del backend:
```
📊 reCAPTCHA response: { success: true, score: 0.9, ... }
✅ reCAPTCHA verificado con score: 0.9
```

## 🚀 Para Probar

1. **Reinicia los servidores:**
   ```bash
   npm run dev:all
   ```

2. **Abre** `http://localhost:5173`

3. **Intenta hacer login** - reCAPTCHA trabajará en segundo plano

4. **Verifica la consola del backend** - Deberías ver el score

## 💾 Usuario de Google se Guarda en BD

**SÍ**, cuando un usuario inicia sesión con Google:

1. ✅ Se verifica el token de Google
2. ✅ Se busca si el email ya existe en la BD
3. ✅ Si existe, se vincula el `googleId`
4. ✅ Si NO existe, se crea un nuevo usuario con:
   - `name` y `lastname` del nombre de Google
   - `nickname` único basado en el email
   - `email` de Google
   - `googleId` para futuras referencias
   - `image` con la foto de perfil de Google
   - `password` aleatorio (por seguridad)

### Ejemplo en MongoDB:

```javascript
{
  _id: ObjectId("..."),
  name: "Josue",
  lastname: "Martinez",
  nickname: "josuemartinez",
  email: "josue@gmail.com",
  googleId: "114857294738201947392", // ⬅️ ID de Google
  image: "https://lh3.googleusercontent.com/...", // ⬅️ Foto
  password: "$2a$10$...", // Password encriptado aleatorio
  created_at: ISODate("2025-10-13T...")
}
```

## 🔄 Próximos Inicios de Sesión

Si el usuario vuelve a iniciar sesión con Google:
- ✅ Se reconoce por el `email` o `googleId`
- ✅ **NO** se crea un usuario duplicado
- ✅ Se genera un nuevo token JWT
- ✅ Se actualiza el `googleId` si no lo tenía

## 📝 Notas Importantes

- El score de reCAPTCHA v3 puede variar según el comportamiento del usuario
- Un score bajo NO significa error, solo sospecha de bot
- Puedes ajustar el umbral (threshold) en el backend - actualmente 0.5
- Los usuarios humanos normales obtienen scores > 0.7

---

**¡Listo! reCAPTCHA v3 configurado correctamente** 🎉
