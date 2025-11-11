# Komplett Setup-guide för Orchid Community Platform

Följ denna guide steg för steg för att skapa allt från början.

## Steg 1: Logga in på Admin

1. Öppna http://localhost:5001/admin
2. Logga in med:
   - **Användarnamn:** `tom`
   - **Lösenord:** `Abcd1234!`

## Steg 2: Skapa Content Types

### 2.1 Skapa "Post" Content Type

1. Gå till **Content Definition** → **Content Types** (i vänstermenyn)
2. Klicka på **Create new type** (blå knapp längst upp till höger)
3. Fyll i:
   - **Display Name:** `Post`
   - **Technical Name:** `Post` (fylls i automatiskt)
4. Klicka på **Create**

#### Lägg till Parts:
1. I sektionen **Parts** (på sidan du nu är på), klicka på **Add Parts**
2. Markera följande (de flesta är redan valda):
   - ✅ **Title Part** (för titel)
   - ✅ **Autoroute Part** (för SEO-vänliga URLs)
   - ✅ **Common Part** (för Created/Modified dates)
3. Klicka på **Save**

#### Lägg till Fields:
1. Scrolla ner till sektionen **Fields**
2. Klicka på **Add Field**
3. För varje field, fyll i och klicka **Save**:

   **Field 1: Content**
   - **Display Name:** `Content`
   - **Technical Name:** `Content`
   - **Field Type:** Välj **TextField**
   - Klicka **Save**

   **Field 2: AuthorId**
   - **Display Name:** `AuthorId`
   - **Technical Name:** `AuthorId`
   - **Field Type:** Välj **TextField**
   - Klicka **Save**

   **Field 3: Likes**
   - **Display Name:** `Likes`
   - **Technical Name:** `Likes`
   - **Field Type:** Välj **NumericField**
   - Klicka **Save**

   **Field 4: IsPublished**
   - **Display Name:** `IsPublished`
   - **Technical Name:** `IsPublished`
   - **Field Type:** Välj **BooleanField**
   - Klicka **Save**

4. När alla fields är tillagda, klicka på **Save** längst ner på sidan

---

### 2.2 Skapa "Comment" Content Type

1. Gå tillbaka till **Content Definition** → **Content Types**
2. Klicka på **Create new type**
3. Fyll i:
   - **Display Name:** `Comment`
   - **Technical Name:** `Comment`
4. Klicka på **Create**

#### Lägg till Parts:
1. Klicka på **Add Parts**
2. Markera:
   - ✅ **Title Part**
   - ✅ **Common Part**
3. Klicka på **Save**

#### Lägg till Fields:
1. Klicka på **Add Field** för varje:

   **Field 1: Content**
   - **Display Name:** `Content`
   - **Technical Name:** `Content`
   - **Field Type:** **TextField**
   - Klicka **Save**

   **Field 2: PostId**
   - **Display Name:** `PostId`
   - **Technical Name:** `PostId`
   - **Field Type:** **TextField**
   - Klicka **Save**

   **Field 3: AuthorId**
   - **Display Name:** `AuthorId`
   - **Technical Name:** `AuthorId`
   - **Field Type:** **TextField**
   - Klicka **Save**

   **Field 4: CreatedDate**
   - **Display Name:** `CreatedDate`
   - **Technical Name:** `CreatedDate`
   - **Field Type:** **DateTimeField**
   - Klicka **Save**

2. Klicka på **Save** längst ner

---

### 2.3 Skapa "Event" Content Type

1. Gå till **Content Definition** → **Content Types**
2. Klicka på **Create new type**
3. Fyll i:
   - **Display Name:** `Event`
   - **Technical Name:** `Event`
4. Klicka på **Create**

#### Lägg till Parts:
1. Klicka på **Add Parts**
2. Markera:
   - ✅ **Title Part**
   - ✅ **Autoroute Part**
   - ✅ **Common Part**
3. Klicka på **Save**

#### Lägg till Fields:
1. Klicka på **Add Field** för varje:

   **Field 1: Description**
   - **Display Name:** `Description`
   - **Technical Name:** `Description`
   - **Field Type:** **TextField**
   - Klicka **Save**

   **Field 2: EventDate**
   - **Display Name:** `EventDate`
   - **Technical Name:** `EventDate`
   - **Field Type:** **DateTimeField**
   - Klicka **Save**

   **Field 3: Location**
   - **Display Name:** `Location`
   - **Technical Name:** `Location`
   - **Field Type:** **TextField**
   - Klicka **Save**

   **Field 4: OrganizerId**
   - **Display Name:** `OrganizerId`
   - **Technical Name:** `OrganizerId`
   - **Field Type:** **TextField**
   - Klicka **Save**

   **Field 5: IsPublished**
   - **Display Name:** `IsPublished`
   - **Technical Name:** `IsPublished`
   - **Field Type:** **BooleanField**
   - Klicka **Save**

2. Klicka på **Save** längst ner

---

### 2.4 Skapa "MarketplaceItem" Content Type

1. Gå till **Content Definition** → **Content Types**
2. Klicka på **Create new type**
3. Fyll i:
   - **Display Name:** `MarketplaceItem`
   - **Technical Name:** `MarketplaceItem`
4. Klicka på **Create**

#### Lägg till Parts:
1. Klicka på **Add Parts**
2. Markera:
   - ✅ **Title Part**
   - ✅ **Autoroute Part**
   - ✅ **Common Part**
3. Klicka på **Save**

#### Lägg till Fields:
1. Klicka på **Add Field** för varje:

   **Field 1: Description**
   - **Display Name:** `Description`
   - **Technical Name:** `Description`
   - **Field Type:** **TextField**
   - Klicka **Save**

   **Field 2: Price**
   - **Display Name:** `Price`
   - **Technical Name:** `Price`
   - **Field Type:** **NumericField**
   - Klicka **Save**

   **Field 3: SellerId**
   - **Display Name:** `SellerId`
   - **Technical Name:** `SellerId`
   - **Field Type:** **TextField**
   - Klicka **Save**

   **Field 4: IsSold**
   - **Display Name:** `IsSold`
   - **Technical Name:** `IsSold`
   - **Field Type:** **BooleanField**
   - Klicka **Save**

   **Field 5: IsPublished**
   - **Display Name:** `IsPublished`
   - **Technical Name:** `IsPublished`
   - **Field Type:** **BooleanField**
   - Klicka **Save**

2. Klicka på **Save** längst ner

---

### 2.5 Skapa "RestPermissions" Content Type

1. Gå till **Content Definition** → **Content Types**
2. Klicka på **Create new type**
3. Fyll i:
   - **Display Name:** `RestPermissions`
   - **Technical Name:** `RestPermissions`
4. Klicka på **Create**

#### Lägg till Parts:
1. Klicka på **Add Parts**
2. Markera:
   - ✅ **Title Part**
   - ✅ **Common Part**
3. Klicka på **Save**

#### Lägg till Fields:
1. Klicka på **Add Field** för varje:

   **Field 1: Roles**
   - **Display Name:** `Roles`
   - **Technical Name:** `Roles`
   - **Field Type:** **TextField**
   - Klicka **Save**

   **Field 2: ContentTypes**
   - **Display Name:** `ContentTypes`
   - **Technical Name:** `ContentTypes`
   - **Field Type:** **TextField**
   - Klicka **Save**

   **Field 3: RestMethods**
   - **Display Name:** `RestMethods`
   - **Technical Name:** `RestMethods`
   - **Field Type:** **TextField**
   - Klicka **Save**

2. Klicka på **Save** längst ner

---

## Steg 3: Skapa Användarroller

### 3.1 Skapa "Member" Roll

1. Gå till **Users** → **Roles** (i vänstermenyn)
2. Klicka på **Create new role** (blå knapp)
3. Fyll i:
   - **Role Name:** `Member`
4. Klicka på **Save**

### 3.2 Skapa "Moderator" Roll

1. Gå till **Users** → **Roles**
2. Klicka på **Create new role**
3. Fyll i:
   - **Role Name:** `Moderator`
4. Klicka på **Save**

---

## Steg 4: Skapa RestPermissions (Behörigheter)

### 4.1 Anonymous kan läsa innehåll

1. Gå till **Content** → **Content Items**
2. Klicka på **Create new content** (grön knapp)
3. Välj **RestPermissions** från listan
4. Fyll i:
   - **Title:** `Anonymous can view content`
   - Scrolla ner till **Fields**:
     - **Roles:** Skriv `Anonymous`
     - **ContentTypes:** Skriv `Post,Comment,Event,MarketplaceItem`
     - **RestMethods:** Skriv `GET`
5. Klicka på **Publish** (eller **Save**)

### 4.2 Members kan skapa och redigera

1. Gå till **Content** → **Content Items**
2. Klicka på **Create new content**
3. Välj **RestPermissions**
4. Fyll i:
   - **Title:** `Members can create and edit`
   - **Roles:** `Member`
   - **ContentTypes:** `Post,Comment,Event,MarketplaceItem`
   - **RestMethods:** `GET,POST,PUT`
5. Klicka på **Publish**

### 4.3 Moderators har full kontroll

1. Gå till **Content** → **Content Items**
2. Klicka på **Create new content**
3. Välj **RestPermissions**
4. Fyll i:
   - **Title:** `Moderators have full control`
   - **Roles:** `Moderator`
   - **ContentTypes:** `Post,Comment,Event,MarketplaceItem`
   - **RestMethods:** `GET,POST,PUT,DELETE`
5. Klicka på **Publish**

### 4.4 Administrators har full åtkomst

1. Gå till **Content** → **Content Items**
2. Klicka på **Create new content**
3. Välj **RestPermissions**
4. Fyll i:
   - **Title:** `Administrators have full access`
   - **Roles:** `Administrator`
   - **ContentTypes:** `Post,Comment,Event,MarketplaceItem`
   - **RestMethods:** `GET,POST,PUT,DELETE`
5. Klicka på **Publish**

---

## Steg 5: Tilldela roller till användare (valfritt)

Om du vill testa med olika roller:

1. Gå till **Users** → **Users**
2. Klicka på en användare (t.ex. `tom`)
3. Scrolla ner till **Roles**
4. Markera önskade roller:
   - ✅ **Administrator** (redan vald för tom)
   - ✅ **Member** (om du vill att tom också ska vara member)
   - ✅ **Moderator** (om du vill att tom också ska vara moderator)
5. Klicka på **Save**

---

## Steg 6: Testa API:et

Efter att allt är skapat, testa API:et:

### Test 1: Hämta alla posts (anonym)
Öppna i webbläsaren eller använd curl:
```
http://localhost:5001/api/Post
```

### Test 2: Logga in och skapa en post
1. Öppna http://localhost:5173
2. Logga in med `tom` / `Abcd1234!`
3. Gå till **Community**
4. Klicka på **+ Create Post**
5. Fyll i titel och innehåll
6. Klicka på **Submit for Review**

### Test 3: Testa via API direkt
```bash
# Logga in
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"usernameOrEmail\":\"tom\",\"password\":\"Abcd1234!\"}" \
  -c cookies.txt

# Skapa en post
curl -X POST http://localhost:5001/api/Post \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{\"title\":\"Test Post\",\"content\":\"This is a test\",\"authorId\":\"tom\",\"likes\":0,\"isPublished\":false}"
```

---

## Steg 7: Spara seed-datan (viktigt!)

När allt är konfigurerat och fungerar:

```bash
npm run save
```

Detta sparar all konfiguration till `backend/App_Data.seed/` så att du (och andra) kan återställa till denna konfiguration senare.

---

## Checklista

- [ ] Post content type skapad med alla fields
- [ ] Comment content type skapad med alla fields
- [ ] Event content type skapad med alla fields
- [ ] MarketplaceItem content type skapad med alla fields
- [ ] RestPermissions content type skapad med alla fields
- [ ] Member roll skapad
- [ ] Moderator roll skapad
- [ ] 4 RestPermissions-objekt skapade (Anonymous, Member, Moderator, Administrator)
- [ ] API testat och fungerar
- [ ] Seed-datan sparad

---

## Felsökning

### Problem: Kan inte se "Create new type" knappen
**Lösning:** Kontrollera att du är inloggad som Administrator

### Problem: API returnerar 403 Forbidden
**Lösning:** Kontrollera att RestPermissions är korrekt konfigurerade och att användaren har rätt roll

### Problem: Fields visas inte i API-svaret
**Lösning:** Kontrollera att field-namnen matchar exakt (case-sensitive)

### Problem: Kan inte skapa content items
**Lösning:** Kontrollera att RestPermissions tillåter POST för din roll

---

**Lycka till! 🚀**

