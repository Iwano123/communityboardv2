# Render Deployment Guide - Steg för Steg

Denna guide visar exakt vad du ska göra i Render Dashboard för att deploya både backend och frontend från `abdi`-branchen.

## Förberedelser

✅ Alla ändringar är nu committade och pushade till `abdi`-branchen
✅ Dockerfile finns i `backend/Dockerfile`
✅ TypeScript-fel är fixade

---

## Steg 1: Deploya Backend

### 1.1 Skapa ny Web Service

1. Gå till: https://render.com
2. Logga in med GitHub
3. Klicka på **"New +"** (överst till höger)
4. Välj **"Web Service"**

### 1.2 Konfigurera Backend

1. **Connect a repository:**
   - Om du inte redan är kopplad: Välj `lwano123/communityboardv2`
   - Om du redan är kopplad: Välj repository från listan

2. **Branch:** Välj `abdi` (INTE main!)

3. **Name:** `communityboard-backend`

4. **Environment:** Välj **`Docker`** (VIKTIGT! Inte Node!)

5. **Region:** Välj närmaste region (t.ex. Frankfurt)

6. **Branch:** `abdi` (kontrollera att detta stämmer)

7. **Root Directory:** `backend` (VIKTIGT! Detta gör att Docker Context är backend-mappen)

8. **Dockerfile Path:** `Dockerfile` (eller lämna tomt - Render hittar den automatiskt i backend-mappen)

9. **Plan:** Välj **`Free`**

10. Klicka på **"Create Web Service"**

### 1.3 Vänta på Deployment

- Backend kommer att börja deploya automatiskt
- Detta tar **5-10 minuter**
- Du kan se progress i "Logs"-fliken
- När det är klart, kopiera backend-URL:en (t.ex. `https://communityboard-backend.onrender.com`)

---

## Steg 2: Deploya Frontend

### 2.1 Skapa ny Static Site

1. Klicka på **"New +"** igen
2. Välj **"Static Site"**

### 2.2 Konfigurera Frontend

1. **Connect a repository:**
   - Välj samma repository: `lwano123/communityboardv2`

2. **Branch:** Välj `abdi` (INTE main!)

3. **Name:** `communityboard-frontend`

4. **Build Command:** `npm install && npm run build`

5. **Publish Directory:** `dist`

6. **Plan:** Välj **`Free`**

### 2.3 Lägg till Environment Variable

**VIKTIGT:** Detta är kritisk för att frontend ska kunna prata med backend!

1. Scrolla ner till **"Environment Variables"** sektionen
2. Klicka på **"Add Environment Variable"**
3. Fyll i:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://communityboard-backend.onrender.com` (din backend URL från steg 1.3)
4. Klicka **"Save"**

### 2.4 Skapa Static Site

1. Klicka på **"Create Static Site"**
2. Vänta **2-5 minuter** tills build är klar
3. Du får en frontend URL (t.ex. `https://communityboard-frontend.onrender.com`)

---

## Steg 3: Testa

1. Öppna din frontend URL i webbläsaren
2. Testa att logga in
3. Testa att skicka meddelanden
4. Testa att skapa posts

---

## Viktiga Inställningar att Kontrollera

### Backend Settings:
- ✅ Environment: `Docker` (INTE Node!)
- ✅ Dockerfile Path: `backend/Dockerfile`
- ✅ Branch: `abdi`

### Frontend Settings:
- ✅ Build Command: `npm install && npm run build`
- ✅ Publish Directory: `dist`
- ✅ Environment Variable: `VITE_API_URL` = din backend URL
- ✅ Branch: `abdi`

---

## Felsökning

### Problem: Backend build failed
- Kontrollera att Environment är `Docker` (inte Node)
- Kontrollera att Dockerfile Path är `backend/Dockerfile`
- Kolla logs för specifika felmeddelanden

### Problem: Frontend kan inte nå backend
- Kontrollera att `VITE_API_URL` environment variable är satt korrekt
- Backend URL ska vara `https://` (inte `http://`)
- Kontrollera att backend är deployad och körs (grön status)

### Problem: CORS errors
- Backend har redan CORS konfigurerat i `Program.cs`
- Om du fortfarande får CORS-fel, kontrollera att backend körs

---

## Efter Deployment

### Automatisk Deployment
- Varje `git push` till `abdi`-branchen kommer automatiskt att deploya både backend och frontend
- Du kan se deployment status i Render Dashboard

### Uppdatera Environment Variables
Om du behöver ändra backend URL senare:
1. Gå till frontend service
2. Settings → Environment Variables
3. Uppdatera `VITE_API_URL`
4. Render kommer automatiskt att rebuilda

---

## Free Tier Begränsningar

⚠️ **Viktigt att veta:**
- Backend går i "sleep" efter 15 min inaktivitet
- Första requesten efter sleep tar 30-60 sekunder
- Detta är OK för test, men inte för produktion

💡 **Tips:**
- Använd en uptime monitor (t.ex. UptimeRobot.com) för att hålla backend vaken
- Eller uppgradera till paid plan ($7/månad) för att undvika sleep

