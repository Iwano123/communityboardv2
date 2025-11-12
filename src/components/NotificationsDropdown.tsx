import { useState } from "react";
import { Button, Dropdown, Badge } from "react-bootstrap";
import { useNotifications, type Notification } from "../hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { BellIcon } from "./BellIcon";
import type { User } from "../interfaces/BulletinBoard";
import "../../sass/components/notifications-dropdown.scss";

// Simple date formatting function
function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
}

// Format time (HH:MM)
function formatTime(date: Date): string {
  return date.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

interface NotificationsDropdownProps {
  user: User | null;
}

export const NotificationsDropdown = ({ user }: NotificationsDropdownProps) => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const notificationsHook = useNotifications(user);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isLoading,
    error,
  } = notificationsHook;

  const handleNotificationClick = async (notification: Notification) => {
    // Ta bort notifikationen från listan direkt när man klickar på den
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Stäng dropdownen
    setShow(false);
    
    // Om det är en meddelande-notifikation, hantera navigation till rätt konversation
    if (notification.type === 'message' || notification.link?.includes('/messages')) {
      let chatRoomId: string | null = null;
      
      // Försök extrahera chatRoomId från länken om den finns
      if (notification.link) {
        try {
          // Hantera både absoluta och relativa länkar
          const url = notification.link.startsWith('http') 
            ? new URL(notification.link)
            : new URL(notification.link, window.location.origin);
          chatRoomId = url.searchParams.get('chatRoomId');
        } catch (e) {
          // Om URL-parsing misslyckas, försök hitta chatRoomId manuellt
          const match = notification.link.match(/chatRoomId=([^&]+)/);
          if (match) {
            chatRoomId = decodeURIComponent(match[1]);
          }
        }
      }
      
      // Om vi inte hittade chatRoomId i länken, försök hitta den från meddelandet
      if (!chatRoomId && notification.message && user) {
        try {
          // Hämta alla meddelanden för att hitta rätt konversation
          const response = await fetch(`/api/Chat?where=receiverId=${encodeURIComponent(user.email)}&orderby=-createdDate&limit=50`, {
            credentials: 'include'
          });
          if (response.ok) {
            const messages = await response.json();
            const messagesArray = Array.isArray(messages) ? messages : (messages?.value || []);
            
            // Försök hitta en konversation där meddelandet matchar
            // Matcha mot meddelandets innehåll eller avsändarens namn
            const messagePreview = notification.message.toLowerCase().substring(0, 30);
            const matchingMessage = messagesArray.find((msg: any) => {
              const msgContent = (msg.message || '').toLowerCase();
              return msgContent.includes(messagePreview) || messagePreview.includes(msgContent.substring(0, 30));
            });
            
            if (matchingMessage?.chatRoomId) {
              chatRoomId = matchingMessage.chatRoomId;
            } else if (matchingMessage) {
              // Om vi hittade ett matchande meddelande men inget chatRoomId, skapa det från senderId och receiverId
              const senderEmail = matchingMessage.senderId?.includes('@') ? matchingMessage.senderId : null;
              const receiverEmail = matchingMessage.receiverId?.includes('@') ? matchingMessage.receiverId : null;
              if (senderEmail && receiverEmail) {
                chatRoomId = [senderEmail, receiverEmail].sort().join('-');
              }
            }
          }
        } catch (e) {
          console.error('Error finding chat room for notification:', e);
        }
      }
      
      if (chatRoomId) {
        // Navigera till messages med chatRoomId som parameter
        navigate(`/messages?chatRoomId=${encodeURIComponent(chatRoomId)}`);
      } else {
        // Om inget chatRoomId hittades, navigera bara till messages
        navigate('/messages');
      }
    } else if (notification.type === 'comment' && notification.link) {
      // För kommentar-notifikationer, navigera till posten
      navigate(notification.link);
    } else if (notification.link) {
      // För andra typer av notifikationer, använd länken direkt
      navigate(notification.link);
    }
  };

  // Removed console.log to reduce noise - uncomment for debugging if needed
  // console.log('NotificationsDropdown render:', { 
  //   notificationsCount: notifications.length, 
  //   unreadCount, 
  //   show,
  //   user: user?.email,
  //   isLoading,
  //   error,
  //   endpointAvailable: notificationsHook.endpointAvailable
  // });

  return (
    <Dropdown 
      align="end" 
      className="notifications-dropdown" 
      show={show}
      onToggle={(isOpen, e) => {
        console.log('Dropdown onToggle called:', { isOpen, notifications: notifications.length, event: e });
        setShow(isOpen);
      }}
    >
      <Dropdown.Toggle
        variant="link"
        className="position-relative text-decoration-none border-0"
        style={{ 
          zIndex: 1000, 
          pointerEvents: 'auto', 
          cursor: 'pointer',
          padding: 0,
          width: '2.25rem',
          height: '2.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={(e) => {
          console.log('Toggle onClick:', { 
            notifications: notifications.length, 
            unread: unreadCount, 
            currentShow: show,
            willToggle: !show,
            event: e 
          });
          // Manuellt toggle om React Bootstrap inte gör det
          setShow(!show);
        }}
      >
        <BellIcon style={{ width: '18px', height: '18px', pointerEvents: 'none', display: 'block' }} />
        {unreadCount > 0 && (
          <Badge
            bg="danger"
            className="position-absolute top-0 start-100 translate-middle rounded-pill"
            style={{ fontSize: '10px', minWidth: '18px', height: '18px', padding: '0 4px' }}
          >
            {unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.ItemText className="d-flex align-items-center justify-content-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              onClick={() => markAllAsRead()}
              className="btn-link"
            >
              Mark all read
            </Button>
          )}
        </Dropdown.ItemText>
        {notifications.length === 0 ? (
          <div className="empty-state">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <Dropdown.Item
              key={notification.id}
              className="d-flex align-items-start gap-2 position-relative"
              onClick={() => handleNotificationClick(notification)}
            >
              {!notification.read && (
                <div className="notification-unread-indicator" />
              )}
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="d-flex align-items-start justify-content-between gap-2">
                  <p className="fw-semibold">
                    {notification.title}
                  </p>
                </div>
                <p className="small" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginTop: '0.25rem'
                }}>
                  {notification.message}
                </p>
                <p className="small" style={{ marginTop: '0.25rem' }}>
                  {formatTime(new Date(notification.created_at))} • {formatDistanceToNow(new Date(notification.created_at))}
                </p>
              </div>
              <Button
                variant="link"
                size="sm"
                className="p-0 opacity-0 position-absolute end-0 top-50 translate-middle-y"
                style={{
                  width: '24px',
                  height: '24px',
                  minWidth: '24px',
                  transition: 'opacity 0.2s',
                  color: 'hsl(var(--muted-foreground))',
                  marginRight: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.classList.remove('opacity-0');
                  e.currentTarget.style.color = 'hsl(var(--destructive))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.classList.add('opacity-0');
                  e.currentTarget.style.color = 'hsl(var(--muted-foreground))';
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
              >
                <i className="bi bi-trash"></i>
              </Button>
            </Dropdown.Item>
          ))
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

