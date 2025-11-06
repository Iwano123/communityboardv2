# React + TypeScript + Vite Project
<img width="393" height="856" alt="image" src="https://github.com/user-attachments/assets/20b79ae1-3d03-4f0a-9b4a-63036c6897ff" />


# Community Bulletin Board

A modern, Twitter-like community bulletin board application built with React, TypeScript, and Orchard Core. Features dark mode, PWA support, and full CRUD functionality for local community posts.

# Features

### Core Functionality
- ** Post Management** - Create, edit, delete, and view community posts
- ** User Authentication** - Secure login/register system with session management
- ** Comments System** - Interactive commenting on posts
- ** View Counter** - Track post popularity with session-based view counting
- ** Contact System** - Contact post authors directly through the platform
- ** Featured Posts** - Highlight important community content

### User Experience
- ** Dark Mode** - Toggle between light and dark themes with persistent preferences
- ** PWA Support** - Install as a native app with offline functionality
- ** Twitter-like Design** - Modern, clean interface inspired by social media
- ** Responsive Design** - Works perfectly on desktop, tablet, and mobile
- ** Real-time Updates** - Live updates and smooth user interactions

### Admin Features
- ** Admin Panel** - Comprehensive admin dashboard
- ** Role-based Access** - Secure admin-only features
- ** Analytics** - View user activity and post statistics

### Technical Features
- ** ACL Security** - Access Control List for secure API endpoints
- ** SQLite Database** - Lightweight, file-based database
- ** Session Management** - Secure user sessions with automatic expiration
- ** CORS Support** - Cross-origin resource sharing for development
- ** Monorepo Structure** - Organized frontend and backend in single repository

##  Tech Stack

### Frontend
- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **React Bootstrap** - UI component library
- **React Router** - Client-side routing
- **Sass** - CSS preprocessing
- **PWA Plugin** - Progressive Web App functionality

### Backend
- **Orchard Core** - Modern .NET CMS framework
- **.NET 8** - Latest C# runtime
- **SQLite** - Embedded database
- **REST API** - Full CRUD API endpoints
- **Session Management** - Secure user sessions

## Installation and Running

### Prerequisites
- **Node.js** (v18 or higher)
- **.NET SDK** (8.0 or higher)
- **Git**

### Quick Start (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd communityboard
   ```

2. **Install all dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### What happens when you run `npm run dev`:
- Starts the **frontend** (Vite dev server on port 5173)
- Starts the **Orchard Core backend** (on ports 5100/5101)
- The application uses the SQLite database in `CommunityBoard.Cms/App_Data/bulletin_board.db`
- Both servers run concurrently using `concurrently` package

**Important:** The database is located at `CommunityBoard.Cms/App_Data/bulletin_board.db`. Make sure this file exists before running the application.

### Alternative Commands

- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`
- **Run tests**: `npm run test`
- **Run tests with UI**: `npm run test:ui`
- **Lint code**: `npm run lint`

### Troubleshooting

**If you get "[vite] http proxy error: /api/login":**
This means the Orchard Core server isn't starting properly. The most common cause is:
- Missing .NET SDK (install from https://dotnet.microsoft.com/download)
- Database not found (ensure `CommunityBoard.Cms/App_Data/bulletin_board.db` exists)
- Orchard Core not properly configured

**If you get an error about @rollup/rollup-darwin-arm64:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**If you get CORS errors:**
Make sure the application is running on port 5173.

**First time setup:**
When you clone the project, the database (`CommunityBoard.Cms/App_Data/bulletin_board.db`) is not included in git. You need to ensure the database exists:
1. Check if `CommunityBoard.Cms/App_Data/bulletin_board.db` exists
2. If not, create the database manually or restore from a backup
3. Run `npm run dev` to start the application
4. The Orchard Core application will connect to the existing database

##  Usage

### Getting Started
1. **Register** a new account or **login** with existing credentials
2. **Browse posts** on the main bulletin board
3. **Create posts** for items for sale, services, events, etc.
4. **Comment** on posts to engage with the community
5. **Contact** post authors for inquiries
6. **Toggle dark mode** using the moon/sun button in the header

### Post Categories
- **For Sale** - Items available for purchase
- **Services** - Professional services offered
- **Events** - Community events and gatherings
- **Housing** - Rental and real estate listings
- **Jobs** - Employment opportunities
- **Community** - General community discussions

### Admin Features
- Access the **Admin Panel** (admin users only)
- Manage users and posts
- View system analytics
- Moderate community content

##  Configuration

### Environment Variables
The application uses default configurations for development. For production:

- **Orchard Core Port**: Configured in `CommunityBoard.Cms/Properties/launchSettings.json` (default: 5100/5101)
- **Database Path**: Set in `CommunityBoard.Cms/appsettings.json` (default: `App_Data/bulletin_board.db`)
- **Session Management**: Handled by Orchard Core session system

### PWA Configuration
- **Manifest**: `public/manifest.json` (auto-generated)
- **Service Worker**: Auto-generated by Vite PWA plugin
- **Icons**: `public/pwa-*.png`

##  Deployment

### Frontend (Production Build)
```bash
npm run build
```
Built files will be in `dist/`

### Backend (Production)
```bash
cd CommunityBoard.Cms
dotnet publish -c Release
```

### PWA Installation
Users can install the app on their devices:
- **Mobile**: "Add to Home Screen" prompt
- **Desktop**: Install button in browser address bar
- **Offline**: App works without internet connection

##  Security Features

- **Orchard Core Security** - Built-in security features
- **Session Management** - Secure user authentication via sessions
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Server-side data validation
- **SQL Injection Protection** - Parameterized queries

##  Customization

### Themes
- **Light Mode**: Clean, bright interface
- **Dark Mode**: Easy on the eyes with Twitter-like colors
- **Custom Colors**: Modify `frontend/sass/index.scss`

### Styling
- **Bootstrap Components** - Customizable UI elements
- **Sass Variables** - Easy color and spacing changes
- **Responsive Design** - Mobile-first approach

##  PWA Features

- **Offline Support** - Browse cached posts without internet
- **App-like Experience** - Standalone mode without browser UI
- **Auto-updates** - New versions install automatically
- **Push Notifications** - Ready for future implementation
- **Cross-platform** - Works on iOS, Android, and Desktop

##  Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

##  License

This project is licensed under the MIT License - see the LICENSE file for details.
