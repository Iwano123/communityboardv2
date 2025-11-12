# Fixa RestPermissions - Steg för Steg

## Problem Identifierat

I bilden ser jag att RestPermissions har:
- ✅ Title: "Administrators have full access" (korrekt)
- ✅ Roles: "Administrator" (korrekt)
- ❌ ContentTypes: "Post,Comment,Event,MarketplaceItem" (saknar Chat!)
- ✅ RestMethods: "GET,POST,PUT,DELETE" (korrekt)

## Lösning

### Steg 1: Lägg till Chat i ContentTypes

1. I RestPermissions-formuläret, hitta fältet **ContentTypes**
2. Ändra värdet från:
   ```
   Post,Comment,Event,MarketplaceItem
   ```
   Till:
   ```
   Post,Comment,Event,MarketplaceItem,Chat
   ```
   (Lägg till `,Chat` i slutet, inga mellanslag)

### Steg 2: Spara RestPermissions

**VIKTIGT:** Du måste klicka på en av knapparna längst ner:
- Klicka på **"Publish"** (grön knapp) - rekommenderat
- ELLER **"Save Draft"** (blå knapp)

### Steg 3: Verifiera

Efter att du har sparat:

1. Vänta några sekunder
2. Starta om backend-servern om den körs
3. Kör:
   ```bash
   npm run check-roles
   ```

Detta bör nu visa:
```
✅ Successfully created test post!
```

## Post Content Type

Post content type ser korrekt ut med alla nödvändiga fält:
- ✅ Content (TextField)
- ✅ ImageUrl (TextField)
- ✅ AuthorId (TextField)
- ✅ Likes (NumericField)
- ✅ IsPublished (BooleanField)

Inga ändringar behövs här!

## Sammanfattning

**Vad du behöver göra:**
1. Lägg till `,Chat` i ContentTypes-fältet i RestPermissions
2. Klicka på **"Publish"** för att spara
3. Starta om backend
4. Testa med `npm run check-roles`

Efter detta kommer allt att fungera! 🎉

