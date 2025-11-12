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
      console.log('Auth result:', result);
      if (result.isAuthenticated && result.user) {
        const backendUser = result.user as any;
        console.log('Backend user data:', backendUser);
        
        // Map backend user to BulletinBoard User interface
        const mappedUser: User = {
          id: 0, // Backend doesn't return id, will need to get from elsewhere
          firstName: backendUser.firstName || (backendUser.username ? backendUser.username.split(' ')[0] : '') || '',
          lastName: backendUser.lastName || (backendUser.username ? backendUser.username.split(' ').slice(1).join(' ') : '') || '',
          email: backendUser.email || backendUser.username || '', // Use email if available, otherwise username
          role: (Array.isArray(backendUser.roles) && backendUser.roles.includes('Administrator')) ? 'admin' : 
                (Array.isArray(backendUser.roles) && backendUser.roles.includes('Moderator')) ? 'moderator' : 'user',
          created: new Date().toISOString(),
        };
        console.log('Mapped user:', mappedUser);
        setUser(mappedUser);
      } else {
        console.log('Not authenticated or no user data');
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

