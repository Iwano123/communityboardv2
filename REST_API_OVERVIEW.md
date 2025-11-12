# REST API Översikt

Detta dokument beskriver REST API:et i projektet.

## API-struktur

REST API:et är implementerat i `backend/RestRoutes/` och registreras i `Program.cs` via `app.MapRestRoutes()`.

## Endpoints

### Autentisering (`AuthEndpoints.cs`)

- **POST** `/api/auth/register` - Registrera ny användare
- **POST** `/api/auth/login` - Logga in (sessionsbaserad)
- **GET** `/api/auth/login` - Hämta nuvarande användare
- **DELETE** `/api/auth/login` - Logga ut

### Content Types (`GetRoutes.cs`, `PostRoutes.cs`, `PutRoutes.cs`, `DeleteRoutes.cs`)

För varje content type (t.ex. `Post`, `Comment`, `Event`, etc.) finns följande endpoints:

#### Standard endpoints:
- **GET** `/api/{contentType}` - Hämta alla items (med query-parametrar: `where`, `orderby`, `limit`, `offset`)
- **GET** `/api/{contentType}/{id}` - Hämta enskilt item
- **POST** `/api/{contentType}` - Skapa nytt item
- **PUT** `/api/{contentType}/{id}` - Uppdatera item
- **DELETE** `/api/{contentType}/{id}` - Ta bort item

#### Expand endpoints (med relationsexpansion):
- **GET** `/api/expand/{contentType}` - Hämta alla items med expanderade relationer
- **GET** `/api/expand/{contentType}/{id}` - Hämta enskilt item med expanderade relationer

#### Raw endpoints (rå Orchard Core-format):
- **GET** `/api/raw/{contentType}` - Hämta alla items i råformat
- **GET** `/api/raw/{contentType}/{id}` - Hämta enskilt item i råformat

### System endpoints (`SystemRoutes.cs`)

- **GET** `/api/system/content-types` - Hämta alla content types (kräver Administrator eller RestPermissions)
- **GET** `/api/system/roles` - Hämta alla roller (kräver Administrator eller RestPermissions)
- **GET** `/api/system/admin-script.js` - Admin-gränssnitt JavaScript (kräver Administrator)

### Media Upload (`MediaUploadRoutes.cs`)

- **POST** `/api/media-upload` - Ladda upp mediafiler (multipart/form-data)

### Server-Sent Events (`SseEndpoints.cs`)

- **GET** `/api/sse` - SSE-anslutning för real-time updates

## Behörighetssystem (`PermissionsACL.cs`)

Alla endpoints (utom auth) är skyddade av behörighetssystemet:

1. **RestPermissions** - Content type som definierar behörigheter
2. Varje behörighet specificerar:
   - **Roles** - Vilka roller (kommaseparerat)
   - **Content Types** - Vilka content types (kommaseparerat)
   - **REST Methods** - Vilka HTTP-metoder (GET, POST, PUT, DELETE)

3. **Specialfall:**
   - `Anonymous`-rollen ges automatiskt till alla användare
   - `Administrator`-rollen har automatiskt åtkomst till `/api/system/*` endpoints
   - För andra endpoints behöver även Administrators explicit RestPermissions

## Fältvalidering (`FieldValidator.cs`)

När du skapar eller uppdaterar content items:
- Validerar att alla fält finns i content type-definitionen
- Reserverade fält (id, title, etc.) kan inte användas
- Returnerar lista över ogiltiga fält vid fel

## Query-parametrar (GET endpoints)

- **where** - Filtrera (t.ex. `where=species=dog`)
- **orderby** - Sortera (t.ex. `orderby=-title` för fallande)
- **limit** - Begränsa antal resultat
- **offset** - Hoppa över resultat (för paginering)

## Exempel på användning

### Skapa en Post:
```bash
POST /api/Post
Content-Type: application/json

{
  "title": "Min första post",
  "content": "Detta är innehållet",
  "authorId": "iwan",
  "likes": 0,
  "isPublished": true,
  "ImageUrl": "https://example.com/image.jpg"
}
```

### Hämta alla Posts med filter:
```bash
GET /api/Post?where=isPublished=true&orderby=-createdDate&limit=10
```

### Uppdatera en Post:
```bash
PUT /api/Post/{id}
Content-Type: application/json

{
  "title": "Uppdaterad titel",
  "content": "Uppdaterat innehåll"
}
```

## Problem och lösningar

### Problem: 403 Forbidden när du försöker skapa posts

**Lösning:** Skapa RestPermissions för Administrator-rollen:
1. Gå till Admin → Content → Content Items
2. Skapa nytt RestPermissions-objekt
3. Fyll i:
   - Roles: `Administrator`
   - Content Types: `Post,Comment,Event,MarketplaceItem`
   - REST Methods: GET, POST, PUT, DELETE (alla markerade)

### Problem: Fält valideras inte korrekt

**Lösning:** Kontrollera att fältet finns i content type-definitionen:
1. Gå till Content Definition → Content Types
2. Välj content type
3. Kontrollera att fältet finns i Fields-listan

### Problem: ImageUrl-fältet fungerar inte

**Lösning:** Kontrollera att fältet heter exakt `ImageUrl` (med stort I och stort U):
1. Gå till Content Definition → Content Types → Post
2. Kontrollera att fältet heter `ImageUrl` (inte `image_url` eller `imageUrl`)

## Debugging

Kör `npm run check-roles` för att kontrollera:
- Vilka roller användaren har
- Vilka RestPermissions som finns
- Om POST-behörighet fungerar

