# Bombo Widgets

## Estructura del proyecto

```
BimboWidget/
├── index.html           # Página principal (se sirve en /)
├── server.js            # Servidor local de desarrollo
├── api/
│   └── submit.js        # Función serverless para Vercel (recibe POST)
├── vercel.json          # Configuración para desplegar en Vercel
├── .env.local           # Variables de entorno (local, no subir a GitHub)
├── .gitignore           # Archivos a ignorar en GitHub
└── package.json         # (opcional) dependencias del proyecto
```

## Cómo probar localmente

1. **Ejecuta el servidor local:**
   ```bash
   node server.js
   ```

2. **Abre en el navegador:**
   ```
   http://localhost:3000
   ```

3. El formulario está listo para que agregues tu lógica de fetch

## Qué debes hacer ahora

### En `index.html`
- Descomenta la línea del `fetch` en el script
- Ajusta el método `POST` para enviar datos en JSON:
  ```javascript
  const STEAM_ID = document.getElementById('usersteamid').value;
  
  fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usersteamid: STEAM_ID })
  })
  ```

### En `api/submit.js`
- Aquí va tu lógica para:
  - Recibir el SteamId
  - Validarlo
  - Llamar a Steam API
  - Devolver la respuesta

### Variables de entorno
- En `.env.local` agrega:
  ```
  STEAM_API_KEY=tu_clave_aqui
  APP_ID=tu_app_id_aqui
  ```
- En `api/submit.js` accede a ellas con `process.env.STEAM_API_KEY`

## Desplegar en GitHub + Vercel

### 1. GitHub (frontend estático)
```bash
git init
git add .
git commit -m "Inicial"
git remote add origin https://github.com/TU_USUARIO/BimboWidget.git
git push -u origin main
```

### 2. Vercel (backend + frontend)
1. Ve a [vercel.com](https://vercel.com)
2. Importa tu repositorio de GitHub
3. Vercel auto-detectará la configuración de `vercel.json`
4. Agrega las variables de entorno en el dashboard
5. Deploy automático

## URLs después del despliegue

- **Frontend:** `https://tu-repo.github.io` (GitHub Pages)
- **API:** `https://tu-vercel-app.vercel.app/api/submit` (Vercel)
- En `index.html` cambia el fetch a la URL de Vercel

## Notas importantes

- ✅ No subas `.env.local` a GitHub (está en `.gitignore`)
- ✅ `server.js` es solo para desarrollo local
- ✅ En Vercel se ignora `server.js`, solo se usan las funciones en `api/`
- ✅ GitHub Pages sirve solo archivos estáticos, no ejecuta backend
