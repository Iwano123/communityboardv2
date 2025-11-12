import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export default function MobileNav() {
  const location = useLocation();

  const navItems: NavItem[] = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/for-you', label: 'For You', icon: '✨' },
    { path: '/events', label: 'Events', icon: '📅' },
    { path: '/messages', label: 'Messages', icon: '💬' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`mobile-nav-item ${
            location.pathname === item.path ? 'mobile-nav-active' : ''
          }`}
        >
          <div className="mobile-nav-icon">{item.icon}</div>
          <div className="mobile-nav-label">{item.label}</div>
        </Link>
      ))}
    </nav>
  );
}

