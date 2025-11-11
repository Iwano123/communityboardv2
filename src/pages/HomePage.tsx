import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import './HomePage.css';

interface Stats {
  members: number;
  posts: number;
  events: number;
  growth: number;
}

export default function HomePage() {
  const { isAuthenticated, hasRole } = useAuth();
  const [stats, setStats] = useState<Stats>({
    members: 2400,
    posts: 156,
    events: 24,
    growth: 89,
  });

  useEffect(() => {
    // Hämta statistik från API
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // TODO: Hämta riktig statistik från API när content types är skapade
      // const response = await fetch('/api/expand/Statistic');
      // const data = await response.json();
      // setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-badge">
          <span className="badge-icon">✨</span>
          <span>Your Social Community Platform</span>
        </div>
        <h1 className="hero-title">
          Welcome to <span className="hero-title-highlight">Orchid</span>
        </h1>
        <p className="hero-description">
          Share your thoughts, connect with others, discover events, buy and sell in the
          marketplace, and build your community.
        </p>
        <div className="hero-actions">
          <a href="/community" className="btn btn-primary">
            Explore Orchid
            <span className="btn-icon">→</span>
          </a>
          <a href="/events" className="btn btn-secondary">
            <span className="btn-icon">📅</span>
            Browse Events
          </a>
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{formatNumber(stats.members)}</div>
          <div className="stat-label">Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-value">{stats.posts}</div>
          <div className="stat-label">Posts</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-value">{stats.events}</div>
          <div className="stat-label">Events</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{stats.growth}%</div>
          <div className="stat-label">Growth</div>
        </div>
      </div>

      {/* Rollbaserad innehåll */}
      {isAuthenticated && (
        <div className="role-based-content">
          {hasRole('Administrator') && (
            <div className="admin-panel">
              <h2>Admin Dashboard</h2>
              <p>You have administrator access to manage the platform.</p>
            </div>
          )}
          {hasRole('Moderator') && (
            <div className="moderator-panel">
              <h2>Moderator Tools</h2>
              <p>You can moderate content and manage community posts.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

