import { useState } from 'react';
import { Navbar, Nav, Container, Button, Alert } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useOnlineStatus } from '../utils/customHooks';
import routes from '../routes';
import type { User } from '../interfaces/BulletinBoard';

interface HeaderProps {
  user: User | null;
  setUser: (user: User | null) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
}

export default function Header({ user, setUser, isDarkMode, setIsDarkMode }: HeaderProps) {
  const [expanded, setExpanded] = useState(false);
  const isOnline = useOnlineStatus();
  const location = useLocation();


  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/login', { 
        method: 'DELETE',
        credentials: 'include'
      });
      setUser(null);
      // Clear viewed posts from localStorage on logout
      localStorage.removeItem('viewedPosts');
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return <header>
    {!isOnline && (
      <Alert variant="warning" className="mb-0 text-center py-2">
        <small>⚠️ You're offline. Some features may not work properly.</small>
      </Alert>
    )}

        {/* Twitter-like Navigation */}
        <Navbar
          expanded={expanded}
          expand="lg"
          className="border-bottom"
          fixed="top"
          style={{ zIndex: 1000 }}
        >
      <Container fluid className="px-4">
        {/* Logo/Brand */}
        <Navbar.Brand className="me-4" as={Link} to="/">
          <div className="d-flex align-items-center">
            <div 
              className="rounded-circle me-2" 
              style={{ 
                width: '32px', 
                height: '32px', 
                backgroundColor: '#1d9bf0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              C
            </div>
            <span className="fw-bold text-twitter-dark">Community</span>
          </div>
        </Navbar.Brand>

        <Navbar.Toggle 
          onClick={() => setExpanded(!expanded)} 
          className="border-0"
          style={{ boxShadow: 'none' }}
        />

        <Navbar.Collapse id="basic-navbar-nav">
          {/* Main Navigation */}
          <Nav className="me-auto">
            {routes.filter(x => x.menuLabel && (x.path !== '/admin' || user?.role === 'admin') && x.path !== '/login' && x.path !== '/register').map(
              (route) => {
                const path = route.path || (route.index ? '/' : '');
                return (
                  <Nav.Link
                    as={Link}
                    key={path}
                    to={path}
                    className={`fw-semibold px-3 py-2 rounded-pill me-1 ${
                      isActive(path)
                        ? 'text-primary bg-primary bg-opacity-10'
                        : 'text-dark'
                    }`}
                    onClick={() => setTimeout(() => setExpanded(false), 200)}
                  >
                    {route.menuLabel}
                  </Nav.Link>
                );
              }
            )}
          </Nav>

          {/* User Actions */}
          <Nav className="align-items-center">
            {/* Dark Mode Toggle */}
            <Button
              variant="outline-secondary"
              size="sm"
              className="rounded-pill px-3 me-2"
              onClick={toggleDarkMode}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </Button>

            {user ? (
              <>
                <Nav.Link as={Link} to="/post/create" className="me-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="rounded-pill px-4 fw-semibold"
                    style={{ backgroundColor: '#1d9bf0', borderColor: '#1d9bf0' }}
                  >
                    Post
                  </Button>
                </Nav.Link>
                
                {/* Simple Logout Button */}
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="rounded-pill px-3 fw-semibold me-2"
                  onClick={handleLogout}
                >
                  Logout
                </Button>

                {/* User Profile Dropdown */}
                <div className="dropdown">
                  <button
                    className="btn btn-outline-light border-0 d-flex align-items-center"
                    type="button"
                    id="userDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <div
                      className="rounded-circle me-2"
                      style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: '#1d9bf0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}
                    >
                      {user.firstName.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className="text-twitter-dark fw-semibold small">
                      {user.firstName}
                    </span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <Link className="dropdown-item" to="/profile">
                        <i className="bi bi-person me-2"></i>Profile
                      </Link>
                    </li>
                    {user?.role === 'admin' && (
                      <li>
                        <Link className="dropdown-item" to="/admin">
                          <i className="bi bi-gear me-2"></i>Admin Panel
                        </Link>
                      </li>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item text-danger" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="me-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="rounded-pill px-4 fw-semibold"
                  >
                    Login
                  </Button>
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  <Button
                    variant="primary"
                    size="sm"
                    className="rounded-pill px-4 fw-semibold"
                    style={{ backgroundColor: '#1d9bf0', borderColor: '#1d9bf0' }}
                  >
                    Sign Up
                  </Button>
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  </header>;
}