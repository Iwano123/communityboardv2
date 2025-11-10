import { Link } from "react-router-dom";
import { useOnlineStatus } from "../utils/customHooks";
import { NotificationsDropdown } from "../components/NotificationsDropdown";
import { ThemeToggle } from "../components/ThemeToggle";
import { Navigation } from "../components/Navigation";
import { Avatar, AvatarFallback } from "../components/ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/DropdownMenu";
import { Alert } from "react-bootstrap";
import type { User } from "../interfaces/BulletinBoard";
import "../../sass/components/header.scss";

interface HeaderProps {
  user: User | null;
  setUser: (user: User | null) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
}

export default function Header({ user, setUser, isDarkMode, setIsDarkMode }: HeaderProps) {
  const isOnline = useOnlineStatus();

  const handleLogout = async () => {
    try {
      await fetch("/api/login", {
        method: "DELETE",
        credentials: "include",
      });
      setUser(null);
      localStorage.removeItem("viewedPosts");
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="header-base">
      {!isOnline && (
        <Alert variant="warning" className="mb-0 text-center py-2">
          <small>⚠️ You're offline. Some features may not work properly.</small>
        </Alert>
      )}

      <div className="header-container">
        <Link to="/" className="header-logo">
          <div className="header-logo-icon">
            <i className="bi bi-people"></i>
          </div>
          <div className="header-logo-text">
            <span className="header-logo-title">Orchid</span>
            <span className="header-logo-subtitle">Community Platform</span>
          </div>
        </Link>

        {user && (
          <div className="header-nav-section">
            <Navigation user={user} />
          </div>
        )}
        
        <div className="header-right">
          <div className="header-icons-section">
            {user && <NotificationsDropdown user={user} />}
            <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="header-avatar-button">
                    <Avatar>
                      <AvatarFallback>{getInitials(user)}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">Admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="header-auth-buttons">
                <Link to="/login" className="header-login-button">
                  Login
                </Link>
                <Link to="/register" className="header-signup-button">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
