# Fixa behörigheter för att skapa Posts

Du får 403 Forbidden-fel när du försöker skapa posts. Detta beror på att användaren "iwan" inte har behörighet att POST:a Post content type.

## Steg 0: Debug - Kontrollera användarens roller

Kör detta script för att se vad som är fel:

```bash
npm run check-roles
```

Detta visar:
- Vilka roller användaren har
- Vilka RestPermissions som finns
- Om POST-behörighet fungerar

## Steg 1: Logga in på Admin

1. Öppna http://localhost:5001/admin
2. Logga in med:
   - **Användarnamn:** iwan
   - **Lösenord:** Lile12345!

## Steg 2: Kontrollera användarens roller

1. Gå till **Users** → **Users**
2. Hitta användaren "iwan" i listan
3. Klicka på användaren för att redigera
4. Kontrollera att användaren har rollen **Administrator** markerad
5. Om inte, markera **Administrator** och klicka **Save**

## Steg 3: Skapa RestPermissions för Administrators

**VIKTIGT:** Även Administrators behöver explicit RestPermissions för att använda REST API:et.

1. Gå till **Content** → **Content Items**
2. Klicka på **Create new content** (blå knapp längst upp till höger)
3. Välj **RestPermissions** från listan
4. Fyll i följande (inga backticks, skriv direkt):
   - **Title:** Administrators have full access
   - **Roles:** Administrator (skriv exakt så, med stort A)
   - **Content Types:** Post,Comment,Event,MarketplaceItem (kommaseparerat, inga mellanslag efter kommatecken)
   - **REST Methods:** 
     - ✅ **GET** (läsa)
     - ✅ **POST** (skapa)
     - ✅ **PUT** (uppdatera)
     - ✅ **DELETE** (ta bort)
5. Klicka på **Save** längst ner

## Steg 4: Verifiera behörigheter

Efter att du har sparat kan du testa igen:

```bash
npm run check-roles
```

Detta kommer att testa om POST-behörighet fungerar.

Om det fungerar, kör sedan:

```bash
npm run seed-data
```

## Exempel på korrekt ifyllnad:

**Title:** Administrators have full access

**Roles:** Administrator

**Content Types:** Post,Comment,Event,MarketplaceItem

**REST Methods:** GET, POST, PUT, DELETE (alla markerade)

## Vanliga problem:

1. **Fel rollnamn:** Måste vara exakt `Administrator` (med stort A)
2. **Fel content types:** Måste vara exakt `Post,Comment,Event,MarketplaceItem` (inga mellanslag efter kommatecken)
3. **Glömt spara:** Efter att du har fyllt i formuläret måste du klicka **Save** längst ner
4. **Cache:** Vänta några sekunder efter att du har sparat innan du testar igen

