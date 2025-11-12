# Lägg till ImageUrl-fält i Post Content Type

Följ dessa steg för att lägga till `ImageUrl`-fältet i Post content type:

## Steg 1: Logga in på Admin

1. Öppna http://localhost:5001/admin
2. Logga in med:
   - **Användarnamn:** `iwan`
   - **Lösenord:** `Lile12345!`

## Steg 2: Redigera Post Content Type

1. Gå till **Content Definition** → **Content Types** (i vänstermenyn)
2. Hitta och klicka på **Post** i listan
3. Scrolla ner till sektionen **Fields**

## Steg 3: Lägg till ImageUrl-fält

1. Klicka på **Add Field** (eller **Edit** om du redan är på Post-sidan)
2. Fyll i följande:
   - **Display Name:** `ImageUrl`
   - **Technical Name:** `ImageUrl` (fylls i automatiskt, men kontrollera att det är exakt `ImageUrl`)
   - **Field Type:** Välj **TextField**
3. Klicka på **Save**
4. **VIKTIGT:** Klicka på **Save** längst ner på sidan för att spara ändringarna i Content Type

## Steg 4: Verifiera att fältet finns

Efter att du har sparat kan du verifiera att fältet finns genom att:
1. Gå till **Content** → **Content Items**
2. Skapa en ny Post eller redigera en befintlig
3. Du bör nu se ett fält för "ImageUrl" där du kan ange en bild-URL

## Steg 5: Spara seed-datan

När du har lagt till fältet, spara seed-datan så att ändringen bevaras:

```bash
npm run save
```

Detta sparar databasen till `backend/App_Data.seed/` så att fältet finns när projektet klonas eller återställs.

## Tips

- **Technical Name måste vara exakt:** `ImageUrl` (med stort I och stort U)
- Om du redan har posts skapade behöver de inte uppdateras - de kommer automatiskt att få detta fält när de redigeras
- Du kan använda både externa URL:er (t.ex. Unsplash) eller lokala media-URL:er från `/media/`-mappen

