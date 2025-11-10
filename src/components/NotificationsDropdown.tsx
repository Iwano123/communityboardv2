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

interface NotificationsDropdownProps {
  user: User | null;
}

export const NotificationsDropdown = ({ user }: NotificationsDropdownProps) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(user);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <Dropdown align="end" className="notifications-dropdown">
      <Dropdown.Toggle
        variant="link"
        className="position-relative text-decoration-none border-0"
      >
        <BellIcon style={{ width: '22px', height: '22px' }} />
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
      <Dropdown.Menu className="shadow-lg" style={{ width: '320px', maxHeight: '400px', overflowY: 'auto' }}>
        <Dropdown.ItemText className="d-flex align-items-center justify-content-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              onClick={() => markAllAsRead()}
              className="h-auto p-1 text-primary"
            >
              Mark all read
            </Button>
          )}
        </Dropdown.ItemText>
        <Dropdown.Divider />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <Dropdown.Item
              key={notification.id}
              className={`d-flex align-items-start gap-2 p-3 ${!notification.read ? 'bg-light' : ''} position-relative`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex-grow-1">
                <div className="d-flex align-items-start justify-content-between gap-2">
                  <p className="mb-1 fw-semibold text-dark">
                    {notification.title}
                  </p>
                  {!notification.read && (
                    <div className="bg-primary rounded-circle flex-shrink-0 mt-1" style={{ width: '8px', height: '8px' }} />
                  )}
                </div>
                <p className="small text-muted mb-1" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {notification.message}
                </p>
                <p className="small text-muted mb-0">
                  {formatDistanceToNow(new Date(notification.created_at))}
                </p>
              </div>
              <Button
                variant="link"
                size="sm"
                className="p-0 text-muted opacity-0 position-absolute end-0 top-50 translate-middle-y me-2"
                style={{
                  width: '24px',
                  height: '24px',
                  minWidth: '24px',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.classList.remove('opacity-0')}
                onMouseLeave={(e) => e.currentTarget.classList.add('opacity-0')}
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

