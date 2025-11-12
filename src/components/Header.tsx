import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

export default function Header() {
  const location = useLocation();
  const { isAuthenticated, logout, hasRole } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/foryou', label: 'For You', icon: '✨' },
    { path: '/community', label: 'Community', icon: '💬' },
    { path: '/events', label: 'Events', icon: '📅' },
    { path: '/marketplace', label: 'Marketplace', icon: '🛍️' },
    { path: '/messages', label: 'Messages', icon: '✉️' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark', !isDarkMode);
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <div className="logo-icon">👥</div>
          <div className="logo-text">
            <span className="logo-name">Orchid</span>
            <span className="logo-tagline">Community Platform</span>
          </div>
        </Link>

        <nav className="nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <button
            className="icon-button"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            🌙
          </button>
          <button className="icon-button" aria-label="Notifications">
            🔔
          </button>
          <button className="icon-button" aria-label="Information">
            ℹ️
          </button>
          {isAuthenticated && (
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

