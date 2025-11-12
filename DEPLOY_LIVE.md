# Enkel Guide: Deploya till Live Server (Render.com)

## Steg 1: Förbered projektet

### 1.1 Uppdatera backend för att fungera på Render

Öppna `backend/Program.cs` och ändra slutet till:

```csharp
// Render.com använder PORT environment variable
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    app.Run($"http://0.0.0.0:{port}");
}
else
{
    app.Run();
}
```

### 1.2 Uppdatera vite.config.ts för produktion

Öppna `vite.config.ts` och ändra till:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      },
      '/media': {
        target: process.env.VITE_API_URL || 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || '')
  }
});
```

### 1.3 Committa ändringarna

```bash
git add backend/Program.cs vite.config.ts
git commit -m "Prepare for Render deployment"
git push origin abdi
```

## Steg 2: Skapa Render-konto

1. Gå till: https://render.com
2. Klicka "Get Started for Free"
3. Logga in med GitHub (enklast)

## Steg 3: Deploya Backend

1. Klicka "New +" → "Web Service"
2. Välj ditt GitHub repository
3. Välj branch: `main` (eller `abdi`)
4. **VIKTIGT:** Välj **Environment: `Docker`** (INTE Node!)
5. Fyll i:
   - **Name:** `communityboard-backend`
   - **Dockerfile Path:** `backend/Dockerfile`
   - **Docker Context:** `backend` (eller lämna tomt)
   - **Plan:** `Free`
6. Klicka "Create Web Service"
7. **VÄNTA** 5-10 minuter tills backend är deployad
8. Kopiera backend-URL:en (t.ex. `https://communityboard-backend.onrender.com`)

**OBS:** Om du inte ser Docker som alternativ, kontrollera att `backend/Dockerfile` finns i ditt repository!

## Steg 4: Deploya Frontend

1. Klicka "New +" → "Static Site"
2. Välj samma GitHub repository
3. Välj branch: `abdi` (eller `main`)
4. Fyll i:
   - **Name:** `communityboard-frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Plan:** `Free`
5. Lägg till Environment Variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://communityboard-backend.onrender.com` (din backend URL från steg 3)
6. Klicka "Create Static Site"
7. **VÄNTA** 2-5 minuter tills frontend är deployad

## Steg 5: Klart! 🎉

Öppna din frontend URL (t.ex. `https://communityboard-frontend.onrender.com`) och testa!

## Viktigt om Render Free Tier:

⚠️ **Begränsningar:**
- Backend går i "sleep" efter 15 min inaktivitet
- Första requesten efter sleep tar 30-60 sekunder
- Detta är OK för test, men inte för produktion

💡 **Tips:**
- Efter varje `git push` deployar Render automatiskt
- Du kan se logs i Render dashboard
- För att hålla backend vaken, använd en uptime monitor (t.ex. UptimeRobot.com - gratis)

## Alternativ: Railway.app (Ännu enklare!)

Railway är ännu enklare:

1. Gå till: https://railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Välj ditt repository och branch
4. Railway detekterar automatiskt backend och frontend
5. Lägg till environment variable `VITE_API_URL` med backend-URL:en
6. Klart!

Railway är mer automatisk men Render ger mer kontroll.

