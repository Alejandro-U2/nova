Instrucciones rápidas para Tailwind en este proyecto Vite + React

1) Dependencias (ya deberían estar en root package.json devDependencies):
   - tailwindcss, postcss, autoprefixer

2) Archivos añadidos en `frontend`:
   - tailwind.config.cjs
   - postcss.config.cjs
   - index.css actualizado con `@tailwind base; @tailwind components; @tailwind utilities;`

3) Uso en desarrollo:
   - Desde la raíz del repo (donde está package.json):

```powershell
npm run dev
```

   - Esto levantará Vite con `root: frontend` (ya configurado en `vite.config.js`). Tailwind se procesará por PostCSS.

4) Notas:
   - Si tu editor muestra errores en CSS por las reglas `@tailwind`, es normal si el linter CSS no reconoce PostCSS; la compilación con Vite los procesa correctamente.
   - Para producción usa `npm run build`.
