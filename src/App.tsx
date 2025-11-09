import { Outlet } from 'react-router-dom';
import { useStateObject } from './utils/useStateObject';
import { useEffect, useState } from 'react';
import Header from './partials/Header';
import { PushNotificationPrompt } from './components/PushNotificationPrompt';
import { registerServiceWorker } from './utils/pushNotifications';
import type { User } from './interfaces/BulletinBoard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
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

  // Check login status on mount
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch('/api/login', {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // 500 status with "No user is logged in" is expected when not logged in
          setUser(null);
        }
      } catch (error) {
        // Network error - user not logged in
        setUser(null);
      }
    };

    checkLoginStatus();
  }, []);

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header user={user} setUser={setUser} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      <main className="flex-grow-1">
        <Outlet context={[state, setState, user, setUser]} />
      </main>
      <PushNotificationPrompt user={user} />
    </div>
  );
}