# Notification System Setup Guide

## Overview
This notification system provides push notifications and in-app notifications for the Community Board application.

## Prerequisites
- Node.js installed
- .NET 8 SDK installed

## Setup Steps

### 1. Generate VAPID Keys
VAPID keys are required for push notifications. Generate them using:

```bash
npm install -g web-push
web-push generate-vapid-keys
```

This will output:
- Public Key (VAPID_PUBLIC_KEY)
- Private Key (VAPID_PRIVATE_KEY)

### 2. Configure Environment Variables

Create a `.env` file in the root directory (if it doesn't exist) and add:

```
VITE_VAPID_PUBLIC_KEY=your_public_key_here
```

**Note:** The private key should be stored securely on the backend (in appsettings.json or environment variables) for sending push notifications.

### 3. Database Migration

The database tables are automatically created when the application starts. The `DatabaseService` will create:
- `push_subscriptions` table
- `notifications` table
- Required indexes

If you need to manually run the migration, the SQL is in `DatabaseService.cs` in the `InitializeDatabaseAsync` method.

### 4. Backend Configuration

Add the VAPID private key to `CommunityBoard.Cms/appsettings.json`:

```json
{
  "VAPID_PRIVATE_KEY": "your_private_key_here"
}
```

**Note:** For production, use environment variables or a secure configuration system.

### 5. Install WebPush Library (Optional - for sending push notifications)

To actually send push notifications, you'll need to install a WebPush library for .NET:

```bash
cd CommunityBoard.Cms
dotnet add package WebPush
```

Then update `NotificationController.cs` to use the WebPush library to send notifications.

## Testing

1. Start the backend: `npm run dev:orchard`
2. Start the frontend: `npm run dev:vite`
3. Log in to the application
4. You should see a notification prompt after 3 seconds (if notifications are not already enabled)
5. Click "Enable" to allow notifications
6. The bell icon in the header will show unread notification count

## API Endpoints

### Notifications
- `GET /api/notifications` - Get user's notifications (requires auth)
- `PUT /api/notifications/{id}` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all notifications as read
- `DELETE /api/notifications/{id}` - Delete a notification
- `POST /api/notifications/send` - Send a notification (requires auth)

### Push Subscriptions
- `POST /api/push_subscriptions` - Subscribe to push notifications (handled by ApiController)
- `GET /api/push_subscriptions` - Get user's subscriptions
- `DELETE /api/push_subscriptions/{id}` - Unsubscribe

## Sending Notifications

To send a notification, make a POST request to `/api/notifications/send`:

```json
{
  "user_id": 1,
  "title": "New Message",
  "message": "You have a new message from John",
  "type": "message",
  "link": "/chat/1"
}
```

## Future Enhancements

- Implement actual push notification sending using WebPush.NET
- Add notification preferences per user
- Add notification categories/types
- Add email notifications as fallback

