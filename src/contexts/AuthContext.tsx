import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkAuth, logout as apiLogout } from '../utils/auth';
import type { User } from '../interfaces/BulletinBoard';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const result = await checkAuth();
      if (result.isAuthenticated && result.user) {
        // Map backend user to BulletinBoard User interface
        const mappedUser: User = {
          id: 0, // Backend doesn't return id, will need to get from elsewhere
          firstName: result.user.username.split(' ')[0] || '',
          lastName: result.user.username.split(' ').slice(1).join(' ') || '',
          email: result.user.username, // Use username as email fallback
          role: result.user.roles.includes('Administrator') ? 'admin' : 
                result.user.roles.includes('Moderator') ? 'moderator' : 'user',
          created: new Date().toISOString(),
        };
        setUser(mappedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role || user.role === 'admin';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

