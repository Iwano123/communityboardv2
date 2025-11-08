import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Badge, Alert, Spinner, Modal } from 'react-bootstrap';
import { useOutletContext } from 'react-router-dom';
import type { User } from '../interfaces/BulletinBoard';

ChatPage.route = {
  path: '/chat',
  menuLabel: 'Messages',
  parent: '/'
};

interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userFirstName?: string;
  userLastName?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unread: number;
  online?: boolean;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: string;
  createdAt?: string;
}

export default function ChatPage() {
  const [, , currentUser] = useOutletContext<[any, any, User | null, any]>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [targetUserInfo, setTargetUserInfo] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<number | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch conversations
  const fetchConversations = async () => {
    if (!currentUser) return;

    try {
      // Fetch conversations for current user
      const response = await fetch(`/api/conversations?currentUserId=${currentUser.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data || []);
      } else if (response.status === 404) {
        // No conversations table yet - that's okay, we'll create it when needed
        setConversations([]);
      } else {
        console.warn('Unexpected response when fetching conversations:', response.status);
        setConversations([]);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      // Don't set error - allow user to still create new conversations
      setConversations([]);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    
    try {
      console.log('Fetching messages for conversation:', conversationId);
      const response = await fetch(`/api/messages?conversationId=${conversationId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = (data || []).map((msg: any) => ({
          ...msg,
          timestamp: formatTimestamp(msg.createdAt || msg.timestamp)
        }));
        console.log('Loaded messages:', formattedMessages.length);
        setMessages(formattedMessages);
      } else if (response.status === 404) {
        console.log('No messages found (404) - starting fresh conversation');
        setMessages([]);
      } else {
        console.error('Error fetching messages:', response.status);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setMessages([]);
      // Don't set error here - allow user to still send messages
    }
  };

  // Start polling for new messages
  useEffect(() => {
    if (selectedChat && !selectedChat.startsWith('temp_')) {
      // Poll every 2 seconds for new messages (only for real conversations)
      pollIntervalRef.current = window.setInterval(() => {
        fetchMessages(selectedChat);
        fetchConversations(); // Also update conversations for last message
      }, 2000);

      return () => {
        if (pollIntervalRef.current) {
          window.clearInterval(pollIntervalRef.current);
        }
      };
    } else {
      // Clear interval if we have a temp conversation
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
  }, [selectedChat, currentUser]);

  // Fetch all users for new message modal
  const fetchUsers = async () => {
    if (!currentUser) return;
    
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter out current user
        const otherUsers = (data || []).filter((user: User) => String(user.id) !== String(currentUser.id));
        setUsers(otherUsers);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      fetchConversations().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  // Fetch users when modal opens
  useEffect(() => {
    if (showNewMessageModal && currentUser) {
      fetchUsers();
    }
  }, [showNewMessageModal, currentUser]);

  // Handle conversation selection
  const handleSelectConversation = async (conversationId: string) => {
    console.log('handleSelectConversation called with:', conversationId);
    setSelectedChat(conversationId);
    setMessages([]);
    setError(""); // Clear errors when selecting a new conversation
    setTargetUserInfo(null); // Clear target user info when selecting existing conversation
    await fetchMessages(conversationId);
  };

  // Send message
  // Create or find conversation with a user
  const startConversation = async (targetUser: User) => {
    if (!currentUser) {
      setError('You must be logged in to start a conversation');
      return;
    }

    setError(""); // Clear any previous errors

    // IMMEDIATELY show the chat UI - don't wait for API calls
    console.log('Starting conversation with user:', targetUser);
    setShowNewMessageModal(false);
    setUserSearchTerm("");
    setTargetUserInfo(targetUser);
    
    // Use a temporary conversation ID based on the target user
    // This ensures the chat opens immediately
    const tempConversationId = `temp_${targetUser.id}`;
    console.log('Setting selectedChat to:', tempConversationId);
    setSelectedChat(tempConversationId);
    setMessages([]);
    setError(""); // Clear any errors

    try {
      // Refresh conversations to get the latest list
      await fetchConversations();
      
      // Check if conversation already exists in our local list
      const existingConv = conversations.find(conv => String(conv.userId) === String(targetUser.id));
      
      let conversationId: string;

      if (existingConv) {
        // Conversation exists, use it
        conversationId = String(existingConv.id);
        console.log('Found existing conversation:', conversationId);
        setSelectedChat(conversationId);
        await fetchMessages(conversationId);
      } else {
        // Create new conversation
        console.log('Creating new conversation with user:', targetUser.id);
        const createResponse = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            currentUserId: currentUser.id,
            userId: targetUser.id,
            userName: `${targetUser.firstName} ${targetUser.lastName}`.trim(),
            userFirstName: targetUser.firstName,
            userLastName: targetUser.lastName,
            unread: 0
          }),
        });

        if (createResponse.ok) {
          const newConv = await createResponse.json();
          console.log('Conversation creation response:', newConv);
          
          // Try different ways to get the conversation ID
          conversationId = newConv.insertId || newConv.id || String(newConv.rowsAffected);
          
          // If we still don't have an ID, fetch conversations and find it
          if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
            console.log('No ID in response, fetching conversations...');
            await fetchConversations();
            
            // Wait a bit for the database to update
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Try to find it in the updated conversations list
            const updatedConvs = await fetch('/api/conversations', {
              credentials: 'include'
            }).then(r => r.ok ? r.json() : []).catch(() => []);
            
            const newConvFound = updatedConvs.find((c: Conversation) => 
              String(c.userId) === String(targetUser.id)
            );
            
            if (newConvFound) {
              conversationId = String(newConvFound.id);
              console.log('Found new conversation:', conversationId);
            } else {
              // Use temp ID - we'll handle it when sending the first message
              conversationId = tempConversationId;
              console.warn('Conversation created but not found - using temp ID');
            }
          } else {
            conversationId = String(conversationId);
          }
          
          // Update selected chat with real ID
          setSelectedChat(conversationId);
          await fetchMessages(conversationId);
          await fetchConversations();
        } else {
          const errorText = await createResponse.text();
          console.error('Failed to create conversation:', createResponse.status, errorText);
          // Don't return - keep the chat open with temp ID
          // User can still try to send a message which might create the conversation
          setError('Note: Conversation may not be saved yet. Try sending a message.');
        }
      }
      
    } catch (err) {
      console.error('Error starting conversation:', err);
      // Don't close the chat - keep it open so user can still try to message
      setError(`Warning: ${err instanceof Error ? err.message : 'Unknown error'}. You can still try sending a message.`);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat || !currentUser) return;

    setSending(true);
    setError("");

    try {
      // If using temp conversation ID, try to create/get real conversation first
      let conversationId = selectedChat;
      
      if (selectedChat.startsWith('temp_')) {
        const targetUserId = selectedChat.replace('temp_', '');
        
        // Try to find existing conversation
        await fetchConversations();
        const existingConv = conversations.find(conv => String(conv.userId) === String(targetUserId));
        
        if (existingConv) {
          conversationId = String(existingConv.id);
          setSelectedChat(conversationId);
        } else if (targetUserInfo) {
          // Create conversation
          const createResponse = await fetch('/api/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              currentUserId: currentUser.id,
              userId: targetUserInfo.id,
              userName: `${targetUserInfo.firstName} ${targetUserInfo.lastName}`.trim(),
              userFirstName: targetUserInfo.firstName,
              userLastName: targetUserInfo.lastName,
              unread: 0
            }),
          });
          
          if (createResponse.ok) {
            const newConv = await createResponse.json();
            conversationId = newConv.insertId || newConv.id || String(newConv.rowsAffected);
            if (conversationId && !conversationId.startsWith('temp_')) {
              setSelectedChat(String(conversationId));
              await fetchConversations();
            }
          }
        }
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: conversationId,
          senderId: currentUser.id,
          senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
          content: message.trim()
        }),
      });

      if (response.ok) {
        setMessage("");
        // Refresh messages immediately
        await fetchMessages(conversationId);
        await fetchConversations();
      } else {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Failed to send message' };
        }
        setError(errorData.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(`Error sending message: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  // Format message time
  const formatMessageTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAvatarInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.userName) return conv.userName;
    if (conv.userFirstName || conv.userLastName) {
      return `${conv.userFirstName || ''} ${conv.userLastName || ''}`.trim();
    }
    return 'Unknown User';
  };

  const selectedConversation = selectedChat ? conversations.find(c => String(c.id) === String(selectedChat)) : null;

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    const name = getConversationName(conv).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  if (!currentUser) {
    return (
      <Container className="mt-5">
        <Alert variant="info">Please log in to use messages.</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4 px-3" style={{ height: 'calc(100vh - 120px)' }}>
      <Row className="h-100 g-3">
        {/* Conversations List */}
        <Col md={4} lg={3} className="h-100 d-flex flex-column">
          <Card className="card-twitter h-100 d-flex flex-column">
            <Card.Header className="d-flex align-items-center justify-content-between border-bottom">
              <h5 className="mb-0 fw-bold text-twitter-dark">Messages</h5>
              <Button 
                variant="link" 
                className="p-0 text-twitter-primary"
                style={{ minWidth: 'auto' }}
                title="New message"
                onClick={() => setShowNewMessageModal(true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </Button>
            </Card.Header>

            <Card.Body className="flex-grow-1 p-0 d-flex flex-column">
              {/* Search */}
              <div className="p-3 border-bottom">
                <InputGroup>
                  <InputGroup.Text className="bg-transparent border-end-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-start-0 form-control-twitter"
                    style={{ borderRadius: '0 8px 8px 0' }}
                  />
                </InputGroup>
              </div>

              {/* Conversations */}
              <div className="flex-grow-1 overflow-auto">
                {loading ? (
                  <div className="d-flex justify-content-center p-4">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center p-4 text-twitter-secondary">
                    <p className="mb-0">No conversations yet</p>
                    <small>Start a new conversation to begin messaging</small>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const name = getConversationName(conv);
                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className={`w-100 p-3 text-start border-0 bg-transparent ${
                          selectedChat === conv.id
                            ? 'bg-twitter-primary bg-opacity-10'
                            : ''
                        }`}
                        style={{
                          borderLeft: selectedChat === conv.id ? '3px solid #1d9bf0' : '3px solid transparent',
                          transition: 'all 0.2s ease',
                          backgroundColor: selectedChat === conv.id ? 'rgba(29, 155, 240, 0.1)' : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedChat !== conv.id) {
                            e.currentTarget.style.backgroundColor = 'rgba(29, 155, 240, 0.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedChat !== conv.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div className="d-flex align-items-start gap-3">
                          <div className="position-relative">
                            <div
                              className="avatar-twitter"
                              style={{ width: '48px', height: '48px' }}
                            >
                              {getAvatarInitials(name)}
                            </div>
                            {conv.online && (
                              <span
                                className="position-absolute bottom-0 end-0 rounded-circle border border-white"
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  backgroundColor: '#10b981',
                                  borderWidth: '2px'
                                }}
                              />
                            )}
                          </div>
                          <div className="flex-grow-1 min-w-0">
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span className="fw-semibold text-twitter-dark small">
                                {name}
                              </span>
                              {conv.lastMessageTime && (
                                <span className="text-twitter-secondary small ms-2" style={{ fontSize: '11px' }}>
                                  {formatTimestamp(conv.lastMessageTime)}
                                </span>
                              )}
                            </div>
                            <div className="d-flex align-items-center justify-content-between">
                              <p
                                className="text-twitter-secondary mb-0 small text-truncate me-2"
                                style={{ fontSize: '13px' }}
                              >
                                {conv.lastMessage || 'No messages yet'}
                              </p>
                              {conv.unread > 0 && (
                                <Badge
                                  bg="primary"
                                  className="rounded-circle d-flex align-items-center justify-content-center"
                                  style={{ minWidth: '20px', height: '20px', fontSize: '11px', padding: 0 }}
                                >
                                  {conv.unread}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Chat Area */}
        <Col md={8} lg={9} className="h-100 d-flex flex-column">
          {selectedChat ? (
            <Card className="card-twitter h-100 d-flex flex-column">
              {/* Chat Header */}
              <Card.Header className="d-flex align-items-center gap-3 border-bottom">
                <div
                  className="avatar-twitter"
                  style={{ width: '40px', height: '40px' }}
                >
                  {selectedConversation 
                    ? getAvatarInitials(getConversationName(selectedConversation))
                    : targetUserInfo 
                      ? getAvatarInitials(`${targetUserInfo.firstName} ${targetUserInfo.lastName}`.trim())
                      : '?'}
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-0 fw-semibold text-twitter-dark">
                    {selectedConversation 
                      ? getConversationName(selectedConversation)
                      : targetUserInfo 
                        ? `${targetUserInfo.firstName} ${targetUserInfo.lastName}`.trim()
                        : 'Unknown User'}
                  </h6>
                  <p className="mb-0 small" style={{ color: '#10b981', fontSize: '12px' }}>
                    {selectedConversation?.online ? 'Online' : 'Offline'}
                  </p>
                </div>
              </Card.Header>

              {/* Messages */}
              <Card.Body className="flex-grow-1 overflow-auto p-4">
                {error && (
                  <Alert variant="danger" className="mb-3" dismissible onClose={() => setError("")}>
                    {error}
                  </Alert>
                )}
                <div className="d-flex flex-column gap-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-twitter-secondary p-4">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = String(msg.senderId) === String(currentUser.id);
                      return (
                      <div
                        key={msg.id}
                        className={`d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'}`}
                      >
                        <div
                          className={`rounded-3 p-3 ${
                            isMine
                              ? 'bg-twitter-primary text-white'
                              : 'bg-secondary text-twitter-dark'
                          }`}
                          style={{
                            maxWidth: '70%',
                            wordWrap: 'break-word'
                          }}
                        >
                          <p className="mb-1 small" style={{ fontSize: '14px' }}>
                            {msg.content}
                          </p>
                          <p
                            className="mb-0"
                            style={{
                              fontSize: '11px',
                              opacity: 0.7
                            }}
                          >
                            {formatMessageTime(msg.createdAt || msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </Card.Body>

              {/* Input Area */}
              <Card.Footer className="border-top">
                <Form onSubmit={handleSendMessage}>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="form-control-twitter"
                      style={{ borderRadius: '20px 0 0 20px' }}
                      disabled={sending}
                    />
                    <Button
                      type="submit"
                      className="btn-twitter"
                      style={{ borderRadius: '0 20px 20px 0' }}
                      disabled={!message.trim() || sending}
                    >
                      {sending ? <Spinner animation="border" size="sm" /> : 'Send'}
                    </Button>
                  </InputGroup>
                </Form>
              </Card.Footer>
            </Card>
          ) : (
            <Card className="card-twitter h-100 d-flex align-items-center justify-content-center">
              <div className="text-center text-twitter-secondary p-5">
                <h5>Select a conversation</h5>
                <p className="mb-0">Choose a conversation from the list to start messaging</p>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {/* New Message Modal */}
      <Modal show={showNewMessageModal} onHide={() => {
        setShowNewMessageModal(false);
        setUserSearchTerm("");
      }} centered>
        <Modal.Header closeButton>
          <Modal.Title>New Message</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InputGroup className="mb-3">
            <InputGroup.Text className="bg-transparent border-end-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search users..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="border-start-0 form-control-twitter"
              style={{ borderRadius: '0 8px 8px 0' }}
            />
          </InputGroup>

          {loadingUsers ? (
            <div className="text-center p-4">
              <Spinner animation="border" size="sm" />
            </div>
          ) : (
            <div className="overflow-auto" style={{ maxHeight: '400px' }}>
              {users
                .filter(user => {
                  const name = `${user.firstName} ${user.lastName}`.trim().toLowerCase();
                  const email = (user.email || '').toLowerCase();
                  const search = userSearchTerm.toLowerCase();
                  return name.includes(search) || email.includes(search);
                })
                .map((user) => {
                  const name = `${user.firstName} ${user.lastName}`.trim();
                  return (
                    <button
                      key={user.id}
                      onClick={() => startConversation(user)}
                      className="w-100 p-3 text-start border-0 bg-transparent hover-bg-twitter"
                      style={{
                        transition: 'all 0.2s ease',
                        borderRadius: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(29, 155, 240, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="avatar-twitter"
                          style={{ width: '40px', height: '40px' }}
                        >
                          {getAvatarInitials(name)}
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-semibold text-twitter-dark">{name}</div>
                          {user.email && (
                            <div className="text-twitter-secondary small">{user.email}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              {users.filter(user => {
                const name = `${user.firstName} ${user.lastName}`.trim().toLowerCase();
                const email = (user.email || '').toLowerCase();
                const search = userSearchTerm.toLowerCase();
                return name.includes(search) || email.includes(search);
              }).length === 0 && (
                <div className="text-center p-4 text-twitter-secondary">
                  <p className="mb-0">No users found</p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}
