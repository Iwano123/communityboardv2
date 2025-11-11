# Orchard Core Setup Guide för Orchid Community Platform

Denna guide beskriver hur du konfigurerar Orchard Core CMS för Orchid Community Platform.

## Steg 1: Logga in på Admin-gränssnittet

1. Starta backend-servern: `npm run backend`
2. Öppna http://localhost:5001/admin
3. Logga in med:
   - **Användarnamn:** `iwan`
   - **Lösenord:** `Lile12345!`

## Steg 2: Skapa Content Types

### 2.1 Skapa "Post" Content Type

1. Gå till **Content Definition** → **Content Types**
2. Klicka på **Create new type**
3. Ange:
   - **Display Name:** `Post`
   - **Technical Name:** `Post`
4. Lägg till följande **Parts**:
   - **Title Part** (standard)
   - **Autoroute Part** (för SEO-vänliga URLs)
   - **Common Part** (för Created/Modified dates)
5. Lägg till följande **Fields**:
   - **Content** (TextField) - Innehållet i posten
   - **AuthorId** (TextField) - ID för författaren
   - **Likes** (NumericField) - Antal likes (default: 0)
   - **IsPublished** (BooleanField) - Publiceringsstatus (default: false)
   - **ImageUrl** (TextField) - URL till bild (valfritt)
6. Spara

### 2.2 Skapa "Comment" Content Type

1. Skapa ny content type:
   - **Display Name:** `Comment`
   - **Technical Name:** `Comment`
2. Lägg till **Parts**:
   - **Title Part**
   - **Common Part**
3. Lägg till **Fields**:
   - **Content** (TextField) - Kommentarens innehåll
   - **PostId** (TextField) - ID för posten som kommenteras
   - **AuthorId** (TextField) - ID för kommentatorn
   - **CreatedDate** (DateTimeField) - När kommentaren skapades
4. Spara

### 2.3 Skapa "Event" Content Type

1. Skapa ny content type:
   - **Display Name:** `Event`
   - **Technical Name:** `Event`
2. Lägg till **Parts**:
   - **Title Part**
   - **Autoroute Part**
   - **Common Part**
3. Lägg till **Fields**:
   - **Description** (TextField) - Eventbeskrivning
   - **EventDate** (DateTimeField) - När eventet äger rum
   - **Location** (TextField) - Plats för eventet
   - **OrganizerId** (TextField) - ID för arrangören
   - **IsPublished** (BooleanField) - Publiceringsstatus
4. Spara

### 2.4 Skapa "MarketplaceItem" Content Type

1. Skapa ny content type:
   - **Display Name:** `MarketplaceItem`
   - **Technical Name:** `MarketplaceItem`
2. Lägg till **Parts**:
   - **Title Part**
   - **Autoroute Part**
   - **Common Part**
3. Lägg till **Fields**:
   - **Description** (TextField) - Produktbeskrivning
   - **Price** (NumericField) - Pris
   - **SellerId** (TextField) - ID för säljaren
   - **IsSold** (BooleanField) - Om produkten är såld (default: false)
   - **IsPublished** (BooleanField) - Publiceringsstatus
4. Spara

## Steg 3: Skapa Användarroller

### 3.1 Skapa "Member" Roll

1. Gå till **Users** → **Roles**
2. Klicka på **Create new role**
3. Ange:
   - **Role Name:** `Member`
4. Spara

### 3.2 Skapa "Moderator" Roll

1. Skapa ny roll:
   - **Role Name:** `Moderator`
2. Spara

### 3.3 Tilldela roller till användare

1. Gå till **Users** → **Users**
2. Välj en användare
3. I **Roles**-sektionen, välj önskade roller
4. Spara

## Steg 4: Konfigurera RestPermissions

### 4.1 Skapa behörigheter för Anonymous (läsning)

1. Gå till **Content** → **Content Items**
2. Klicka på **Create new content**
3. Välj **RestPermissions**
4. Fyll i:
   - **Title:** `Anonymous can view content`
   - **Roles:** `Anonymous`
   - **Content Types:** `Post,Comment,Event,MarketplaceItem`
   - **REST Methods:** ✅ GET
5. Spara

### 4.2 Skapa behörigheter för Members (skapa och redigera)

1. Skapa nytt **RestPermissions**-objekt:
   - **Title:** `Members can create and edit`
   - **Roles:** `Member`
   - **Content Types:** `Post,Comment,Event,MarketplaceItem`
   - **REST Methods:** ✅ GET, ✅ POST, ✅ PUT
2. Spara

### 4.3 Skapa behörigheter för Moderators (full kontroll)

1. Skapa nytt **RestPermissions**-objekt:
   - **Title:** `Moderators have full control`
   - **Roles:** `Moderator`
   - **Content Types:** `Post,Comment,Event,MarketplaceItem`
   - **REST Methods:** ✅ GET, ✅ POST, ✅ PUT, ✅ DELETE
2. Spara

### 4.4 Skapa behörigheter för Administrators

Administrators har automatiskt full åtkomst till alla endpoints, men du kan skapa explicit behörighet om du vill:
- **Title:** `Administrators have full access`
- **Roles:** `Administrator`
- **Content Types:** `Post,Comment,Event,MarketplaceItem`
- **REST Methods:** ✅ GET, ✅ POST, ✅ PUT, ✅ DELETE

## Steg 5: Publiceringsflöde

### 5.1 Konfigurera publiceringsflöde

För att implementera ett publiceringsflöde där olika roller har olika rättigheter:

1. **Members** kan skapa innehåll men det publiceras inte automatiskt (`IsPublished = false`)
2. **Moderators** kan godkänna och publicera innehåll (sätta `IsPublished = true`)
3. **Administrators** har full kontroll och kan publicera direkt

### 5.2 Skapa behörigheter för publicering

1. Skapa ett **RestPermissions**-objekt för Moderators att uppdatera `IsPublished`:
   - **Title:** `Moderators can publish content`
   - **Roles:** `Moderator`
   - **Content Types:** `Post,Event,MarketplaceItem`
   - **REST Methods:** ✅ PUT

## Steg 6: Testa API:et

Efter att ha konfigurerat allt, testa API:et:

```bash
# Hämta alla posts (anonym)
curl http://localhost:5001/api/Post

# Logga in som member
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"tom","password":"Abcd1234!"}' \
  -c cookies.txt

# Skapa en post (som member)
curl -X POST http://localhost:5001/api/Post \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "My First Post",
    "content": "This is my first post on Orchid!",
    "authorId": "user123",
    "likes": 0,
    "isPublished": false
  }'
```

## Steg 7: Spara seed-datan

När du har konfigurerat allt och skapat testdata:

```bash
npm run save
```

Detta sparar databasen till `backend/App_Data.seed/` så att andra kan få samma setup när de klonar projektet.

## Checklista för Godkänt (G)

- [x] **Innehållshantering:** 4 content types skapade (Post, Comment, Event, MarketplaceItem)
- [x] **Användarhantering:** 3 roller (Member, Moderator, Administrator)
- [x] **Publiceringsflöde:** Konfigurerat med olika rättigheter per roll
- [x] **Design- och funktionsanpassning:** Custom content types och fields
- [x] **Rollbaserad frontend:** Implementerat i React (se `HomePage.tsx`)
- [x] **API-integration:** REST API konfigurerat och redo att användas

