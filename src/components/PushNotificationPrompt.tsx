import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { BellIcon } from "./BellIcon";
import type { User } from "../interfaces/BulletinBoard";
import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  checkPushSubscription,
} from "../utils/pushNotifications";

interface PushNotificationPromptProps {
  user: User | null;
}

export const PushNotificationPrompt = ({ user }: PushNotificationPromptProps) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;
      
      const subscribed = await checkPushSubscription();
      setIsSubscribed(subscribed);
      
      if (!subscribed && Notification.permission === "default") {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    checkSubscription();
  }, [user]);

  const handleEnable = async () => {
    if (!user) return;

    const permission = await requestNotificationPermission();
    
    if (permission === "granted") {
      await subscribeToPushNotifications(user.id);
      setIsSubscribed(true);
      setShowPrompt(false);
    }
  };

  if (!showPrompt || isSubscribed) return null;

  return (
    <div className="fixed-bottom end-0 p-3" style={{ zIndex: 1050, maxWidth: '400px' }}>
      <div className="card shadow-lg border">
        <div className="card-body">
          <div className="d-flex align-items-start gap-3">
            <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px' }}>
              <BellIcon className="text-primary" style={{ width: '20px', height: '20px' }} />
            </div>
            
            <div className="flex-grow-1">
              <h6 className="card-title mb-1">Enable Notifications</h6>
              <p className="card-text small text-muted mb-3">
                Stay updated with new events, messages, and community posts
              </p>
            </div>
            
            <Button
              onClick={() => setShowPrompt(false)}
              variant="link"
              className="p-0 text-muted"
              style={{ width: '24px', height: '24px', lineHeight: '1' }}
            >
              <i className="bi bi-x-lg"></i>
            </Button>
          </div>
          <div className="d-flex gap-2 mt-3">
            <Button onClick={handleEnable} size="sm" className="flex-grow-1">
              Enable
            </Button>
            <Button
              onClick={() => setShowPrompt(false)}
              variant="outline-secondary"
              size="sm"
              className="flex-grow-1"
            >
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

