import { Outlet } from 'react-router-dom';
import { useStateObject } from './utils/useStateObject';
import { useEffect, useState } from 'react';
import Header from './partials/Header';
import MobileNav from './components/MobileNav';
import { PushNotificationPrompt } from './components/PushNotificationPrompt';
import { registerServiceWorker } from './utils/pushNotifications';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme === 'true';
  });
  
  const [state, setState] = useStateObject({
    categoryChoice: 'All',
    sortChoice: 'Newest first',
    searchTerm: '',
    showOnlyMyPosts: false
  });

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }
    // Save preference to localStorage
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  const handleSetUser = async (user: any) => {
    if (user === null) {
      await logout();
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header user={user} setUser={handleSetUser} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      <main className="flex-grow-1">
        <Outlet context={[state, setState, user]} />
      </main>
      <MobileNav />
      <PushNotificationPrompt user={user} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
