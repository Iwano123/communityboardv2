import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatApi } from '../utils/api';
import './MessagesPage.css';

MessagesPage.route = {
  path: "/messages",
  menuLabel: "Messages",
  parent: "/",
};

interface ChatMessage {
  id: string;
  title: string;
  message: string;
  senderId: string;
  receiverId: string;
  chatRoomId: string;
  isRead?: boolean;
  createdDate?: string;
}

interface ChatRoom {
  id: string;
  otherUserId: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export default function MessagesPage() {
  const { user, isAuthenticated } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadChatRooms();
    }
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (selectedChatRoom) {
      loadMessages(selectedChatRoom);
      setupSSE(selectedChatRoom);
    }
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [selectedChatRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatRooms = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      // Hämta alla meddelanden där användaren är sender eller receiver
      const allMessages = await chatApi.getByUser(user.email);
      
      // Gruppera efter chatRoomId och skapa chat rooms
      const roomsMap = new Map<string, ChatRoom>();
      
      allMessages.forEach((msg: ChatMessage) => {
        const otherUserId = msg.senderId === user.email ? msg.receiverId : msg.senderId;
        const roomId = msg.chatRoomId;
        
        if (!roomsMap.has(roomId)) {
          roomsMap.set(roomId, {
            id: roomId,
            otherUserId,
            unreadCount: 0,
          });
        }
        
        const room = roomsMap.get(roomId)!;
        if (!room.lastMessage || new Date(msg.createdDate || '') > new Date(room.lastMessage.createdDate || '')) {
          room.lastMessage = msg;
        }
        if (!msg.isRead && msg.receiverId === user.email) {
          room.unreadCount++;
        }
      });
      
      setChatRooms(Array.from(roomsMap.values()));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load chat rooms');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatRoomId: string) => {
    try {
      setIsLoading(true);
      const data = await chatApi.getByChatRoom(chatRoomId);
      setMessages(data || []);
      
      // Markera meddelanden som lästa
      const unreadMessages = data.filter((msg: ChatMessage) => !msg.isRead && msg.receiverId === user?.email);
      for (const msg of unreadMessages) {
        await chatApi.markAsRead(msg.id);
      }
      
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const setupSSE = (chatRoomId: string) => {
    // Stäng tidigare SSE-anslutning om den finns
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Skapa ny SSE-anslutning för denna chat room
    const eventSource = new EventSource(`/api/sse/Chat?where=chatRoomId=${chatRoomId}`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('initial', (e) => {
      const data = JSON.parse(e.data);
      if (Array.isArray(data)) {
        setMessages(data);
      }
    });

    eventSource.addEventListener('new', (e) => {
      const newMsg = JSON.parse(e.data);
      setMessages((prev) => {
        // Lägg till om det inte redan finns
        if (!prev.find((m) => m.id === newMsg.id)) {
          return [...prev, newMsg].sort((a, b) => {
            const dateA = new Date(a.createdDate || '').getTime();
            const dateB = new Date(b.createdDate || '').getTime();
            return dateA - dateB;
          });
        }
        return prev;
      });
      
      // Markera som läst om det är till den inloggade användaren
      if (newMsg.receiverId === user?.email) {
        chatApi.markAsRead(newMsg.id);
      }
      
      scrollToBottom();
    });

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatRoom || !user) return;

    try {
      const otherUserId = chatRooms.find((r) => r.id === selectedChatRoom)?.otherUserId || '';
      
      await chatApi.create({
        title: newMessage.substring(0, 50),
        message: newMessage,
        senderId: user.email,
        receiverId: otherUserId,
        chatRoomId: selectedChatRoom,
        isRead: false,
      });

      setNewMessage('');
      scrollToBottom();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    }
  };

  const createNewChat = async (receiverId: string) => {
    if (!user) return;
    
    // Skapa ett unikt chatRoomId (sorterat för konsistens)
    const chatRoomId = [user.email, receiverId].sort().join('-');
    setSelectedChatRoom(chatRoomId);
    setShowNewChatModal(false);
    setNewChatUsername('');
    
    // Ladda meddelanden för denna chat room
    await loadMessages(chatRoomId);
  };

  const handleStartNewChat = () => {
    if (!newChatUsername.trim()) {
      setError('Please enter a username');
      return;
    }
    createNewChat(newChatUsername.trim());
  };

  if (!isAuthenticated) {
    return (
      <div className="page-container">
        <p>Please log in to view messages.</p>
      </div>
    );
  }

  if (isLoading && chatRooms.length === 0) {
    return (
      <div className="page-container">
        <div className="loading">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="messages-sidebar">
        <div className="sidebar-header">
          <h2>Messages</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-primary btn-small" 
              onClick={() => setShowNewChatModal(true)}
              title="New message"
            >
              <i className="bi bi-plus-lg"></i>
            </button>
            <button className="btn btn-small" onClick={loadChatRooms}>
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
        
        <div className="chat-rooms-list">
          {chatRooms.length === 0 ? (
            <div className="empty-state">
              <p>No conversations yet. Start a new chat!</p>
            </div>
          ) : (
            chatRooms.map((room) => (
              <div
                key={room.id}
                className={`chat-room-item ${selectedChatRoom === room.id ? 'active' : ''}`}
                onClick={() => setSelectedChatRoom(room.id)}
              >
                <div className="chat-room-avatar">
                  {room.otherUserId.charAt(0).toUpperCase()}
                </div>
                <div className="chat-room-info">
                  <div className="chat-room-name">{room.otherUserId}</div>
                  {room.lastMessage && (
                    <div className="chat-room-preview">
                      {room.lastMessage.message.substring(0, 50)}
                      {room.lastMessage.message.length > 50 ? '...' : ''}
                    </div>
                  )}
                </div>
                {room.unreadCount > 0 && (
                  <div className="unread-badge">{room.unreadCount}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="messages-main">
        {selectedChatRoom ? (
          <>
            <div className="chat-header">
              <h3>
                {chatRooms.find((r) => r.id === selectedChatRoom)?.otherUserId}
              </h3>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="messages-list">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.senderId === user?.email ? 'sent' : 'received'}`}
                >
                  <div className="message-content">{msg.message}</div>
                  <div className="message-time">
                    {msg.createdDate
                      ? new Date(msg.createdDate).toLocaleTimeString()
                      : ''}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-input-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="message-input"
              />
              <button type="submit" className="btn btn-primary">
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <p style={{ marginBottom: '1rem', textAlign: 'center' }}>Select a conversation or start a new chat</p>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowNewChatModal(true)}
            >
              Start New Chat
            </button>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Message</h3>
              <button 
                className="modal-close" 
                onClick={() => {
                  setShowNewChatModal(false);
                  setNewChatUsername('');
                  setError('');
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Enter the email or username of the person you want to message:</p>
              <input
                type="text"
                value={newChatUsername}
                onChange={(e) => setNewChatUsername(e.target.value)}
                placeholder="Email or username"
                className="message-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleStartNewChat();
                  }
                }}
                autoFocus
              />
              {error && <div className="error-message" style={{ marginTop: '0.5rem' }}>{error}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => {
                setShowNewChatModal(false);
                setNewChatUsername('');
                setError('');
              }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleStartNewChat}>
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

