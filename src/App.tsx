import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CommunityPage from './pages/CommunityPage';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <>
            <Header />
            <HomePage />
          </>
        }
      />
      <Route
        path="/foryou"
        element={
          <ProtectedRoute>
            <Header />
            <div className="page-container">
              <h1>For You</h1>
              <p>Personalized content coming soon...</p>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/community"
        element={
          <>
            <Header />
            <CommunityPage />
          </>
        }
      />
      <Route
        path="/events"
        element={
          <>
            <Header />
            <div className="page-container">
              <h1>Events</h1>
              <p>Events coming soon...</p>
            </div>
          </>
        }
      />
      <Route
        path="/marketplace"
        element={
          <>
            <Header />
            <div className="page-container">
              <h1>Marketplace</h1>
              <p>Marketplace coming soon...</p>
            </div>
          </>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Header />
            <div className="page-container">
              <h1>Messages</h1>
              <p>Messages coming soon...</p>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Header />
            <div className="page-container">
              <h1>Profile</h1>
              <p>Profile page coming soon...</p>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
