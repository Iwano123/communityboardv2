import { useEffect, useState, useCallback } from "react";
import type { User } from "../interfaces/BulletinBoard";

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export const useNotifications = (user: User | null) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endpointAvailable, setEndpointAvailable] = useState<boolean | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    // If we've already determined the endpoint doesn't exist, skip fetching
    if (endpointAvailable === false) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the NotificationController endpoint which handles auth
      const response = await fetch(`/api/notifications?orderby=-created_at&limit=20`, {
        credentials: 'include'
      });

      // If endpoint doesn't exist (404), mark as unavailable and stop polling
      if (response.status === 404) {
        setEndpointAvailable(false);
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      // Endpoint exists and works
      setEndpointAvailable(true);
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err: any) {
      // Network errors or other issues - check if it's a 404-like error
      if (err.message?.includes('404') || err.message?.includes('not found')) {
        setEndpointAvailable(false);
      }
      // Silently handle errors - notifications feature may not be implemented yet
      console.debug('Notifications endpoint not available:', err.message);
      setNotifications([]);
      setError(null); // Don't show error to user
    } finally {
      setIsLoading(false);
    }
  }, [user, endpointAvailable]);

  useEffect(() => {
    fetchNotifications();
    
    // Only poll if endpoint is available (or we haven't checked yet)
    if (endpointAvailable !== false) {
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, endpointAvailable]);

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const markAsRead = async (notificationId: number) => {
    // Uppdatera state direkt för omedelbar feedback
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ read: true })
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      // Uppdatera från server för att säkerställa synkronisering
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // Om det misslyckas, återställ state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      // Update all unread notifications for this user
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      await Promise.all(unreadIds.map(id => markAsRead(id)));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};

