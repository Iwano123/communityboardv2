# Orchid - Community Board Platform

A full-stack community board application built with React (Vite + TypeScript) frontend and Orchard Core CMS backend. Orchid enables communities to share posts, organize events, buy/sell items, and connect through messaging.

##  Features

### Core Features
-  **Posts & Content** - Create, edit, and manage community posts with categories
-  **Events** - Organize and discover local community events
-  **Messaging** - Real-time chat and messaging system
-  **Marketplace** - Buy and sell items within the community
-  **User Profiles** - Personal profiles with user information
-  **Real-time Notifications** - Push notifications for messages and updates
-  **Dark Mode** - Light and dark theme support
-  **Mobile-First Design** - Responsive design optimized for mobile devices

### Technical Features
-  **Session-based Authentication** - Secure login/logout/register system
-  **Role-based Permissions** - Fine-grained access control per user role
-  **REST API** - Full CRUD operations with filtering, sorting, and pagination
-  **Database Seed System** - Easy setup and reset functionality
-  **Modern UI** - Bootstrap 5 with custom styling and mobile navigation

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- .NET SDK 8.0
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd communityboardv2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Get seed data**
    ```bash
    npm run restore
    ```
    
4.  **Start the application**
   ```bash
   npm start
   ```

   This will:
   - Auto-restore the database from seed (first time only)
   - Start the Orchard Core backend on http://localhost:5001
   - Start the Vite dev server on http://localhost:5173

5. **Access the application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:5001/api
   - **Admin UI**: http://localhost:5001/admin

## 🔑 Default Credentials

- **Username:** `iwan`
- **Password:** `Hejhej12345!`
- **Role:** Administrator

##  Application Pages

### Public Pages
- **Home** (`/`) - Landing page with community overview
- **About** (`/about`) - About Orchid platform
- **Our Vision** (`/vision`) - Platform vision and goals
- **Featured Posts** (`/featured`) - Highlighted community posts

### Authenticated Pages
- **For You** (`/for-you`) - Personalized feed of posts
- **Events** (`/events`) - Browse and create community events
- **Messages** (`/messages`) - Chat and messaging interface
- **Marketplace** (`/marketplace`) - Buy and sell items
- **Profile** (`/profile`) - User profile management
- **Create Post** (`/create-post`) - Create new community posts
- **Post Details** (`/post/:id`) - View individual posts with comments

### Admin Pages
- **Admin Panel** (`/admin`) - Administrative dashboard (Administrator role required)

## 🛠️ Development

### Available Scripts

```bash
# Start both frontend and backend
npm start

# Start only frontend (Vite dev server)
npm run dev

# Start only backend
npm run backend

# Build for production
npm run build

# Preview production build
npm run preview

# Save current database state as seed
npm run save

# Restore database from seed
npm run restore

# Seed sample data
npm run seed-data

# Seed events
npm run seed-events

# Check user roles
npm run check-roles

# Lint code
npm run lint
```

### Project Structure

```
communityboardv2/
├── backend/                    # Orchard Core backend
│   ├── RestRoutes/            # Custom REST API implementation
│   │   ├── AuthEndpoints.cs   # Authentication endpoints
│   │   ├── GetRoutes.cs       # GET endpoints
│   │   ├── PostRoutes.cs      # POST endpoints
│   │   ├── PutRoutes.cs       # PUT endpoints
│   │   ├── DeleteRoutes.cs    # DELETE endpoints
│   │   ├── PermissionsACL.cs  # Permission checking
│   │   └── MediaUploadRoutes.cs # File upload endpoints
│   ├── App_Data/              # Runtime database (git ignored)
│   └── App_Data.seed/         # Seed database (committed)
├── src/                       # React frontend
│   ├── components/            # Reusable components
│   │   ├── MobileNav.tsx     # Mobile navigation
│   │   ├── Header.tsx        # App header
│   │   └── ui/               # UI component library
│   ├── pages/                # Page components
│   │   ├── HomePage.tsx
│   │   ├── MessagesPage.tsx
│   │   ├── EventsPage.tsx
│   │   └── ...
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx  # Authentication context
│   ├── hooks/                # Custom React hooks
│   ├── utils/                # Utility functions
│   │   ├── api.ts           # API client
│   │   └── auth.ts          # Auth utilities
│   └── routes.ts             # Route configuration
├── sass/                     # SCSS stylesheets
│   ├── mobile.scss          # Mobile-first styles
│   └── components/          # Component styles
└── scripts/                   # Node.js scripts
    ├── save-seed.js         # Save database seed
    └── restore-seed.js      # Restore database seed
```

##  Authentication

The application uses **session-based authentication** (not JWT). Users must log in to receive session cookies.

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "usernameOrEmail": "iwan",
  "password": "Hejhej12345!"
}
```

### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Smith"
}
```

### Get Current User
```bash
GET /api/auth/login
```

## 📡 REST API

The backend provides a comprehensive REST API for all content types.

### Content Types
- **Post** - Community posts with categories
- **Comment** - Comments on posts
- **Event** - Community events
- **Message** - Chat messages
- **User** - User profiles

### API Endpoints

#### Standard Endpoints
```bash
GET    /api/{contentType}           # List all items
GET    /api/{contentType}/{id}      # Get single item
POST   /api/{contentType}          # Create item
PUT    /api/{contentType}/{id}     # Update item
DELETE /api/{contentType}/{id}     # Delete item
```

#### Expand Endpoints
```bash
GET /api/expand/{contentType}      # List with relationships expanded
GET /api/expand/{contentType}/{id}  # Get single item with relationships
```

### Query Parameters

- **Filtering:** `?where=field=value`
- **Sorting:** `?orderby=field` or `?orderby=-field` (descending)
- **Pagination:** `?limit=10&offset=0`
- **Combined:** `?where=category=Events&orderby=-created_at&limit=10`

### Example API Calls

```bash
# Get all posts
GET /api/Post

# Get posts filtered by category
GET /api/Post?where=category_name=Events

# Get posts with pagination
GET /api/Post?limit=10&offset=0&orderby=-created_at

# Create a new post
POST /api/Post
Content-Type: application/json

{
  "title": "Community BBQ",
  "content": "Join us for a community BBQ this Saturday!",
  "category_name": "Events"
}
```

##  Styling

The application uses:
- **Bootstrap 5** - UI framework
- **Bootstrap Icons** - Icon library
- **SASS/SCSS** - Styling preprocessor
- **Mobile-first** - Responsive design approach
- **Dark mode** - Theme switching support

### Mobile Navigation

The app includes a mobile bottom navigation bar with:
- Home
- For You
- Events
- Messages
- Profile

##  Notifications

The application supports:
- **Real-time notifications** via Server-Sent Events (SSE)
- **Push notifications** (browser notifications)
- **In-app notification dropdown**

## 📦 Database Seed System

The project includes a seed system for easy setup:

```bash
# Save current database state
npm run save

# Restore from seed
npm run restore
```

The seed is automatically restored on first run.

## 🛡️ Permissions System

Access to REST endpoints is controlled by **RestPermissions** content items that define:
- **Roles** - Which roles can access
- **Content Types** - Which content types
- **REST Methods** - Which HTTP methods (GET, POST, PUT, DELETE)

Permissions are managed through the admin UI at `/admin`.

## 🐛 Troubleshooting

### Port Already in Use

**Windows (PowerShell):**
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5001).OwningProcess | Stop-Process -Force
```

**macOS/Linux:**
```bash
lsof -ti:5001 | xargs kill -9
```

### Database Issues

Reset to clean state:
```bash
npm run restore
```

### Build Issues

Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Notes

- The application uses Orchard Core CMS as the backend
- Content types are managed through the admin UI
- Media uploads are stored in `App_Data/Sites/Default/Media/`
- Session cookies are required for authenticated requests
- Mobile navigation is automatically shown on screens < 768px

##  Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

##  License

[Add your license information here]

##  Acknowledgments

- Built with [Orchard Core CMS](https://www.orchardcore.net/)
- Frontend powered by [React](https://react.dev/) and [Vite](https://vitejs.dev/)
- UI components from [Bootstrap](https://getbootstrap.com/)
