import { useEffect, useState } from "react";
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

  // Removed console.log to reduce noise - uncomment for debugging if needed
  // console.log('useNotifications hook:', { 
  //   user: user?.email, 
  //   notificationsCount: notifications.length,
  //   endpointAvailable,
  //   isLoading 
  // });

  useEffect(() => {
    if (!user?.email) return;
    
    let isMounted = true;
    
    const fetchData = async () => {
      if (!user || !isMounted) return;
      
      // Don't fetch if already loading
      setIsLoading(prev => {
        if (prev) return prev;
        return true;
      });

      // If we've already determined the endpoint doesn't exist, skip fetching
      if (endpointAvailable === false) {
        setIsLoading(false);
        return;
      }

      setError(null);

      try {
        const response = await fetch(`/api/notifications?orderby=-created_at&limit=20`, {
          credentials: 'include'
        });

        if (!isMounted) return;

        if (response.status === 404) {
          setEndpointAvailable(false);
          setNotifications([]);
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch notifications: ${response.status} ${errorText}`);
        }

        setEndpointAvailable(true);
        const data = await response.json();
        const notificationsArray = Array.isArray(data) ? data : [];
        if (isMounted) {
          setNotifications(notificationsArray);
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (err.message?.includes('404') || err.message?.includes('not found') || err.message?.includes('Failed to fetch')) {
          setEndpointAvailable(false);
        }
        setNotifications([]);
        setError(err.message || 'Failed to fetch notifications');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchData();
    
    // Only poll if endpoint is available (or we haven't checked yet)
    if (endpointAvailable !== false) {
      const interval = setInterval(() => {
        fetchData();
      }, 30000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, [user?.email, endpointAvailable]); // Removed fetchNotifications from deps to prevent loops

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const markAsRead = async (notificationId: number) => {
    // Hitta notifikationen för att få senderId
    const notification = notifications.find(n => n.id === notificationId);
    const senderId = (notification as any)?.senderId;
    
    // Ta bort notifikationer från listan direkt (optimistisk uppdatering)
    if (senderId) {
      setNotifications(prev => 
        prev.filter(n => {
          const nSenderId = (n as any)?.senderId;
          return nSenderId?.toLowerCase() !== senderId.toLowerCase();
        })
      );
    } else {
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
    }
    
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ read: true })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to mark as read: ${response.status} ${errorText}`);
      }
      
      // INTE hämta notifikationer igen direkt - det kan skapa loops
      // Backend har uppdaterat meddelanden som lästa, så nästa gång fetchNotifications körs (via polling)
      // kommer de inte att returneras längre
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // Om det misslyckas, låt polling hantera uppdateringen istället för att skapa loops
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      // Ta bort alla olästa notifikationer från listan direkt
      setNotifications(prev => prev.filter(n => n.read));
      
      // Markera alla som lästa på backend genom att markera varje notifikation
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(unreadNotifications.map(n => markAsRead(n.id)));
      
      // INTE hämta notifikationer igen direkt - låt polling hantera det
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      // Ta bort notifikationen från listan direkt
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      
      // INTE hämta notifikationer igen direkt - låt polling hantera det
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    endpointAvailable,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};

