import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chatApi } from '../utils/api';
import type { User } from '../interfaces/BulletinBoard';
import { useNotifications } from '../hooks/useNotifications';
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
  otherUserName?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export default function MessagesPage() {
  const { user, isAuthenticated } = useAuth();
  const { notifications, markAsRead } = useNotifications(user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Markera meddelande-notifikationer som lästa när man kommer till Messages-sidan
  // Använd useRef för att spåra om vi redan har markerat notifikationer för att undvika loops
  const hasMarkedNotificationsRef = useRef(false);
  
  useEffect(() => {
    if (isAuthenticated && user && notifications.length > 0 && !hasMarkedNotificationsRef.current) {
      const messageNotifications = notifications.filter(
        (n) => !n.read && (n.type === 'message' || n.link?.includes('/messages'))
      );
      
      if (messageNotifications.length > 0) {
        // Markera att vi har markerat notifikationer för att undvika loops
        hasMarkedNotificationsRef.current = true;
        
        // Markera alla meddelande-notifikationer som lästa
        Promise.all(messageNotifications.map(async (notification) => {
          await markAsRead(notification.id);
        })).then(() => {
          // Reset ref efter en kort delay för att tillåta nya notifikationer att markeras senare
          setTimeout(() => {
            hasMarkedNotificationsRef.current = false;
          }, 2000);
        });
      }
    } else if (notifications.length === 0) {
      // Reset ref när det inte finns några notifikationer
      hasMarkedNotificationsRef.current = false;
    }
  }, [isAuthenticated, user, notifications.length]); // Removed markAsRead from dependencies to avoid infinite loops

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

  // Hantera chatRoomId från URL-parametrar (t.ex. från notifikationer)
  useEffect(() => {
    const chatRoomIdFromUrl = searchParams.get('chatRoomId');
    if (chatRoomIdFromUrl && chatRooms.length > 0) {
      // Hitta konversationen med detta chatRoomId
      const room = chatRooms.find(r => r.id === chatRoomIdFromUrl);
      if (room && selectedChatRoom !== chatRoomIdFromUrl) {
        console.log('Selecting chat room from URL:', chatRoomIdFromUrl);
        setSelectedChatRoom(chatRoomIdFromUrl);
        // Rensa URL-parametern efter att konversationen har valts
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, chatRooms, selectedChatRoom, setSearchParams]);

  useEffect(() => {
    if (selectedChatRoom && user) {
      console.log('Selected chat room changed:', selectedChatRoom);
      
      // Ladda meddelanden när konversation väljs
      loadMessages(selectedChatRoom, true);
      // Setup SSE för real-time updates
      setupSSE(selectedChatRoom);
      
      // Uppdatera unreadCount för denna konversation till 0 när den väljs
      setChatRooms(prev => prev.map(room => 
        room.id === selectedChatRoom ? { ...room, unreadCount: 0 } : room
      ));
    } else if (!selectedChatRoom) {
      // Rensa meddelanden om ingen konversation är vald
      setMessages([]);
    }
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [selectedChatRoom, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatRooms = async () => {
    if (!user) {
      console.log('loadChatRooms: No user, returning');
      return;
    }

    try {
      setIsLoading(true);
      console.log('loadChatRooms: Loading for user:', user.email);
      
      // Hämta alla meddelanden där användaren är sender eller receiver
      // Vi behöver söka efter både email och username eftersom gamla meddelanden kan ha username
      console.log('loadChatRooms: Fetching messages for user email:', user.email);
      
      // Hämta användardata för att få username (gamla meddelanden kan ha username som senderId/receiverId)
      let username = user.email; // Fallback till email om username inte finns
      try {
        const authResponse = await fetch('/api/auth/login', { credentials: 'include' });
        if (authResponse.ok) {
          const authData = await authResponse.json();
          username = authData.username || user.email;
        }
      } catch (err) {
        console.error('loadChatRooms: Error fetching user data:', err);
      }
      
      // Sök efter meddelanden med både email och username
      const allMessagesRaw = await chatApi.getByUser(user.email, username);
      console.log('loadChatRooms: Found messages:', allMessagesRaw?.length || 0);
      
      // Debug: Visa första meddelandet för att se vilka fält som finns
      if (allMessagesRaw.length > 0) {
        console.log('loadChatRooms: Sample raw message:', allMessagesRaw[0]);
        console.log('loadChatRooms: Sample raw message keys:', Object.keys(allMessagesRaw[0]));
      }
      
      // Mappa meddelanden för att säkerställa att createdDate är korrekt mappad från backend
      const mappedMessagesRaw = allMessagesRaw.map((msg: any) => ({
        id: msg.id || msg.ContentItemId || '',
        title: msg.title || '',
        message: msg.message || msg.content || '',
        senderId: msg.senderId || '',
        receiverId: msg.receiverId || '',
        chatRoomId: msg.chatRoomId || '',
        isRead: msg.isRead !== undefined ? msg.isRead : false,
        createdDate: msg.createdDate || msg.created_at || msg.CreatedUtc || '',
        // Behåll även originalfälten för debug
        created_at: msg.created_at,
        CreatedUtc: msg.CreatedUtc
      }));
      
      // Sortera meddelanden efter datum (nyaste först) för att säkerställa att lastMessage alltid är det senaste
      const allMessages = mappedMessagesRaw.sort((a: ChatMessage, b: ChatMessage) => {
        // Använd createdDate om det finns, annars fallback till andra fält
        const dateAStr = a.createdDate || (a as any).created_at || (a as any).CreatedUtc || '';
        const dateBStr = b.createdDate || (b as any).created_at || (b as any).CreatedUtc || '';
        
        const dateA = dateAStr ? new Date(dateAStr).getTime() : 0;
        const dateB = dateBStr ? new Date(dateBStr).getTime() : 0;
        
        // Om båda har datum, sortera efter datum (nyaste först)
        if (dateA > 0 && dateB > 0) {
          return dateB - dateA;
        }
        // Om bara en har datum, den med datum kommer först
        if (dateA > 0) return -1;
        if (dateB > 0) return 1;
        // Om ingen har datum, behåll ordningen (men detta borde inte hända)
        return 0;
      });
      
      console.log('Sorted messages (newest first):', allMessages.map(m => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        message: m.message,
        createdDate: m.createdDate
      })));
      
      // Hämta alla användare för att kunna visa namn istället för e-post
      // Vi skapar en map med både email och username som nycklar för att kunna matcha båda
      let usersMap = new Map<string, { firstName: string; lastName: string; email: string; username: string }>();
      try {
        const usersResponse = await fetch('/api/users', { credentials: 'include' });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          console.log('loadChatRooms: Users data:', usersData);
          usersData.forEach((u: any) => {
            const userInfo = {
              firstName: u.firstName || '',
              lastName: u.lastName || '',
              email: u.email || u.username || '',
              username: u.username || u.email || ''
            };
            // Lägg till både email och username som nycklar så vi kan matcha båda
            if (u.email) {
              usersMap.set(u.email, userInfo);
            }
            if (u.username && u.username !== u.email) {
              usersMap.set(u.username, userInfo);
            }
          });
          console.log('loadChatRooms: Users map keys:', Array.from(usersMap.keys()));
        }
      } catch (err) {
        console.error('Failed to fetch users for chat rooms:', err);
      }
      
      // Gruppera efter chatRoomId och skapa chat rooms
      const roomsMap = new Map<string, ChatRoom>();
      
      // Skapa en lista med alla möjliga identifierare för den inloggade användaren
      const currentUserIdentifiers = [user.email, username].filter(Boolean);
      
      // Spara currentUserIdentifiers i en variabel som kan användas i handleDeleteConversation
      // (vi behöver den senare)
      
      allMessages.forEach((msg: ChatMessage) => {
        // Extra säkerhetskontroll: Se till att meddelandet verkligen tillhör denna användare
        const isSender = currentUserIdentifiers.includes(msg.senderId);
        const isReceiver = currentUserIdentifiers.includes(msg.receiverId);
        
        // Hoppa över meddelanden som inte tillhör denna användare
        if (!isSender && !isReceiver) {
          console.warn('Skipping message that does not belong to user:', {
            msgId: msg.id,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            currentUserIdentifiers
          });
          return;
        }
        
        // Bestäm otherUserId - den som INTE är den inloggade användaren
        let otherUserId = isSender ? msg.receiverId : msg.senderId;
        let roomId = msg.chatRoomId;
        
        // Normalisera chatRoomId - om den är fel formaterad (t.ex. "Iwan-evelin@live.se"),
        // skapa en korrekt version med email-adresser
        const roomParts = roomId ? roomId.split('-') : [];
        const hasInvalidFormat = roomId && roomParts.some(part => !part.includes('@') && part.length < 10);
        
        if (hasInvalidFormat) {
          // chatRoomId är fel formaterad, skapa en korrekt version
          const senderEmail = msg.senderId.includes('@') ? msg.senderId : null;
          const receiverEmail = msg.receiverId.includes('@') ? msg.receiverId : null;
          
          if (senderEmail && receiverEmail) {
            // Båda är email-adresser, skapa korrekt chatRoomId
            roomId = [senderEmail, receiverEmail].sort().join('-');
            console.log('Normalized chatRoomId:', {
              old: msg.chatRoomId,
              new: roomId,
              senderId: msg.senderId,
              receiverId: msg.receiverId
            });
          } else {
            // Försök hitta email-varianten från andra meddelanden
            const emailVariant = allMessages
              .filter((m: ChatMessage) => {
                // Hitta meddelanden med samma deltagare
                const mIsSender = currentUserIdentifiers.includes(m.senderId);
                const mIsReceiver = currentUserIdentifiers.includes(m.receiverId);
                if (!mIsSender && !mIsReceiver) return false;
                
                // Kolla om detta meddelande har samma deltagare (bortsett från format)
                const mOther = mIsSender ? m.receiverId : m.senderId;
                const mOtherNormalized = mOther.includes('@') ? mOther : mOther.toLowerCase();
                const otherNormalized = otherUserId.includes('@') ? otherUserId : otherUserId.toLowerCase();
                
                return mOtherNormalized === otherNormalized || 
                       (mOther.includes('@') && mOther.toLowerCase().includes(otherUserId.toLowerCase())) ||
                       (otherUserId.includes('@') && otherUserId.toLowerCase().includes(mOther.toLowerCase()));
              })
              .map((m: ChatMessage) => {
                const mIsSender = currentUserIdentifiers.includes(m.senderId);
                const mSenderEmail = m.senderId.includes('@') ? m.senderId : null;
                const mReceiverEmail = m.receiverId.includes('@') ? m.receiverId : null;
                
                if (mSenderEmail && mReceiverEmail) {
                  return [mSenderEmail, mReceiverEmail].sort().join('-');
                }
                return null;
              })
              .find(id => id !== null);
            
            if (emailVariant) {
              roomId = emailVariant;
              console.log('Found normalized chatRoomId from other messages:', {
                old: msg.chatRoomId,
                new: roomId
              });
            }
          }
        }
        
        // Om otherUserId är username (inte email), försök hitta email-varianten från andra meddelanden i samma room
        if (!otherUserId.includes('@')) {
          const emailVariant = allMessages
            .filter((m: ChatMessage) => m.chatRoomId === roomId)
            .map((m: ChatMessage) => {
              const mIsSender = currentUserIdentifiers.includes(m.senderId);
              const mIsReceiver = currentUserIdentifiers.includes(m.receiverId);
              if (!mIsSender && !mIsReceiver) return null; // Hoppa över meddelanden som inte tillhör användaren
              const other = mIsSender ? m.receiverId : m.senderId;
              return other.includes('@') ? other : null;
            })
            .find(email => email !== null);
          
          if (emailVariant) {
            otherUserId = emailVariant;
          }
        }
        
        console.log('Processing message:', {
          msgId: msg.id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          chatRoomId: roomId,
          otherUserId,
          userEmail: user.email,
          username: username,
          currentUserIdentifiers,
          isSender
        });
        
        if (!roomsMap.has(roomId)) {
          // Försök hitta användaren - usersMap har nu både email och username som nycklar
          let otherUser = usersMap.get(otherUserId);
          
          // Om vi inte hittar direkt, försök matcha via email eller username
          if (!otherUser) {
            for (const [key, value] of usersMap.entries()) {
              if (value.email === otherUserId || value.username === otherUserId || key === otherUserId) {
                otherUser = value;
                break;
              }
            }
          }
          
          // Om vi fortfarande inte hittar användaren (t.ex. pga 403 på /api/users),
          // försök extrahera email från otherUserId eller använd otherUserId direkt
          let displayName = otherUserId;
          if (!otherUser) {
            // Om otherUserId är en email, använd den direkt
            if (otherUserId.includes('@')) {
              displayName = otherUserId;
            } else {
              // Om otherUserId är username, försök hitta email från meddelandena
              // Kolla om det finns ett meddelande med email istället för username
              const messageWithEmail = allMessages.find((m: ChatMessage) => {
                if (m.senderId === otherUserId && m.receiverId.includes('@')) {
                  return false; // sender är otherUserId, receiver är email
                }
                if (m.receiverId === otherUserId && m.senderId.includes('@')) {
                  return false; // receiver är otherUserId, sender är email
                }
                // Om vi hittar ett meddelande där otherUserId matchar men det finns en email-variant
                return (m.senderId.includes('@') && m.senderId.toLowerCase().includes(otherUserId.toLowerCase())) ||
                       (m.receiverId.includes('@') && m.receiverId.toLowerCase().includes(otherUserId.toLowerCase()));
              });
              
              if (messageWithEmail) {
                // Försök hitta email-varianten
                const emailVariant = messageWithEmail.senderId.includes('@') && 
                                     messageWithEmail.senderId.toLowerCase().includes(otherUserId.toLowerCase())
                  ? messageWithEmail.senderId
                  : messageWithEmail.receiverId.includes('@') && 
                    messageWithEmail.receiverId.toLowerCase().includes(otherUserId.toLowerCase())
                  ? messageWithEmail.receiverId
                  : null;
                
                if (emailVariant) {
                  displayName = emailVariant;
                  // Försök hitta användaren med email-varianten
                  otherUser = usersMap.get(emailVariant);
                }
              }
            }
          }
          
          console.log('Finding other user:', {
            otherUserId,
            found: !!otherUser,
            displayName,
            otherUser: otherUser ? { firstName: otherUser.firstName, lastName: otherUser.lastName, email: otherUser.email } : null
          });
          
          // Bestäm visningsnamn - försök använda firstName + lastName, annars email, annars displayName
          const otherUserName = otherUser 
            ? `${otherUser.firstName} ${otherUser.lastName}`.trim() || otherUser.email || displayName
            : displayName;
          
          roomsMap.set(roomId, {
            id: roomId,
            otherUserId,
            otherUserName,
            unreadCount: 0,
          });
        }
        
        const room = roomsMap.get(roomId)!;
        
        // Kontrollera om meddelandet är oläst och mottagaren är den inloggade användaren
        const msgIsReceiver = currentUserIdentifiers.includes(msg.receiverId);
        if (!msg.isRead && msgIsReceiver) {
          room.unreadCount++;
        }
        
        // OBS: lastMessage sätts efteråt när vi har bearbetat alla meddelanden
      });
      
      const chatRoomsArray = Array.from(roomsMap.values());
      
      // För varje rum, hitta det senaste meddelandet från den andra personen
      chatRoomsArray.forEach((room) => {
        // Hitta alla meddelanden i detta rum från den andra personen (där användaren är receiver)
        const messagesFromOther = allMessages.filter((msg: ChatMessage) => {
          // Kolla om meddelandet är från den andra personen (användaren är receiver)
          const msgIsReceiver = currentUserIdentifiers.includes(msg.receiverId);
          const msgIsSender = currentUserIdentifiers.includes(msg.senderId);
          
          // Bara meddelanden där användaren är receiver och inte sender
          if (!msgIsReceiver || msgIsSender) return false;
          
          // Kolla om meddelandet tillhör detta rum
          let msgRoomId = msg.chatRoomId;
          
          // Normalisera msgRoomId om det behövs (samma logik som tidigare)
          const roomParts = msgRoomId ? msgRoomId.split('-') : [];
          const hasInvalidFormat = msgRoomId && roomParts.some(part => !part.includes('@') && part.length < 10);
          
          if (hasInvalidFormat) {
            const senderEmail = msg.senderId.includes('@') ? msg.senderId : null;
            const receiverEmail = msg.receiverId.includes('@') ? msg.receiverId : null;
            if (senderEmail && receiverEmail) {
              msgRoomId = [senderEmail, receiverEmail].sort().join('-');
            }
          }
          
          // Normalisera även room.id för jämförelse
          let normalizedRoomId = room.id;
          const roomIdParts = normalizedRoomId ? normalizedRoomId.split('-') : [];
          const roomIdHasInvalidFormat = normalizedRoomId && roomIdParts.some(part => !part.includes('@') && part.length < 10);
          
          if (roomIdHasInvalidFormat) {
            // Försök hitta email-adresser från room.otherUserId och current user
            const otherEmail = room.otherUserId.includes('@') ? room.otherUserId : null;
            const currentEmail = currentUserIdentifiers.find(id => id.includes('@')) || null;
            if (otherEmail && currentEmail) {
              normalizedRoomId = [otherEmail, currentEmail].sort().join('-');
            }
          }
          
          // Kolla om meddelandet tillhör detta rum (jämför både original och normaliserade versioner)
          const matchesRoom = msgRoomId === room.id || msgRoomId === normalizedRoomId;
          
          return matchesRoom;
        });
        
        // Sortera meddelanden från den andra personen efter datum (nyaste först) för att vara säker
        const sortedMessagesFromOther = messagesFromOther.sort((a: ChatMessage, b: ChatMessage) => {
          const dateA = new Date(a.createdDate || a.created_at || a.CreatedUtc || 0).getTime();
          const dateB = new Date(b.createdDate || b.created_at || b.CreatedUtc || 0).getTime();
          return dateB - dateA; // Nyaste först
        });
        
        console.log(`Room ${room.id} - Messages from other person (${sortedMessagesFromOther.length} total):`, sortedMessagesFromOther.map(m => ({
          message: m.message,
          createdDate: m.createdDate,
          created_at: m.created_at,
          CreatedUtc: m.CreatedUtc,
          senderId: m.senderId,
          timestamp: new Date(m.createdDate || m.created_at || m.CreatedUtc || 0).getTime()
        })));
        
        // Sätt lastMessage till det senaste meddelandet från den andra personen
        if (sortedMessagesFromOther.length > 0) {
          // Ta det första meddelandet (som är det senaste eftersom vi sorterade nyaste först)
          const latestMessage = sortedMessagesFromOther[0];
          room.lastMessage = latestMessage;
          console.log(`Room ${room.id} - Setting lastMessage to LATEST message:`, {
            message: room.lastMessage.message,
            createdDate: room.lastMessage.createdDate,
            created_at: room.lastMessage.created_at,
            CreatedUtc: room.lastMessage.CreatedUtc,
            timestamp: new Date(room.lastMessage.createdDate || room.lastMessage.created_at || room.lastMessage.CreatedUtc || 0).getTime()
          });
        } else {
          // Om det inte finns några meddelanden från den andra personen, ta bort lastMessage
          room.lastMessage = undefined;
          console.log(`Room ${room.id} - No messages from other person, clearing lastMessage`);
        }
      });
      
      console.log('loadChatRooms: Final chat rooms:', chatRoomsArray);
      setChatRooms(chatRoomsArray);
      setError('');
    } catch (err: any) {
      console.error('loadChatRooms error:', err);
      setError(err.message || 'Failed to load chat rooms');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatRoomId: string, showLoading: boolean = true) => {
    if (!chatRoomId) {
      setMessages([]);
      return;
    }
    
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      
      console.log('Loading messages for chatRoomId:', chatRoomId);
      const data = await chatApi.getByChatRoom(chatRoomId);
      console.log('Loaded messages:', data?.length || 0, data);
      
      // Ensure data is an array
      const messagesArray = Array.isArray(data) ? data : (data?.value || []);
      
      // Map messages to ensure they have the correct structure
      const mappedMessages: ChatMessage[] = messagesArray.map((msg: any) => {
        const mapped = {
          id: msg.id || msg.ContentItemId || '',
          title: msg.title || '',
          message: msg.message || msg.content || '',
          senderId: msg.senderId || '',
          receiverId: msg.receiverId || '',
          chatRoomId: msg.chatRoomId || chatRoomId,
          isRead: msg.isRead !== undefined ? msg.isRead : false,
          createdDate: msg.createdDate || msg.created_at || msg.CreatedUtc || ''
        };
        console.log('Mapping message from backend:', {
          raw: msg,
          mapped: mapped,
          currentUser: user?.email
        });
        return mapped;
      });
      
      console.log('Mapped messages:', mappedMessages.length, mappedMessages);
      setMessages(mappedMessages);
      
      // Markera meddelanden som lästa
      const unreadMessages = mappedMessages.filter((msg: ChatMessage) => !msg.isRead && msg.receiverId === user?.email);
      for (const msg of unreadMessages) {
        try {
          await chatApi.markAsRead(msg.id);
        } catch (err) {
          console.error('Failed to mark message as read:', err);
        }
      }
      
      // Uppdatera unreadCount för denna konversation till 0 efter att meddelanden har markerats som lästa
      if (unreadMessages.length > 0) {
        setChatRooms(prev => prev.map(room => 
          room.id === chatRoomId ? { ...room, unreadCount: 0 } : room
        ));
      }
      
      setError('');
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError(err.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const setupSSE = (chatRoomId: string) => {
    // Stäng tidigare SSE-anslutning om den finns
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Skapa ny SSE-anslutning för denna chat room
    // URL-encode chatRoomId för att hantera specialtecken
    const encodedChatRoomId = encodeURIComponent(chatRoomId);
    const eventSource = new EventSource(`/api/sse/Chat?where=chatRoomId=${encodedChatRoomId}`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('initial', (e) => {
      const data = JSON.parse(e.data);
      console.log('SSE initial event received:', data);
      
      // Map SSE data to ChatMessage format
      let messagesArray: ChatMessage[] = [];
      if (Array.isArray(data)) {
        messagesArray = data;
      } else if (data && Array.isArray(data.value)) {
        messagesArray = data.value;
      }
      
      // Map messages to ensure they have the correct structure
      const mappedMessages: ChatMessage[] = messagesArray.map((msg: any) => ({
        id: msg.id || msg.ContentItemId || '',
        title: msg.title || '',
        message: msg.message || msg.content || '',
        senderId: msg.senderId || '',
        receiverId: msg.receiverId || '',
        chatRoomId: msg.chatRoomId || chatRoomId,
        isRead: msg.isRead !== undefined ? msg.isRead : false,
        createdDate: msg.createdDate || msg.created_at || msg.CreatedUtc || ''
      }));
      
      // Only update messages if SSE actually has data, otherwise keep existing messages
      if (mappedMessages.length > 0) {
        console.log('SSE initial: Setting messages from SSE:', mappedMessages.length);
        setMessages(mappedMessages);
      } else {
        console.log('SSE initial: Empty array, keeping existing messages');
        // Don't overwrite existing messages with empty array
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
      // Hitta otherUserId från chatRooms eller från selectedChatRoom
      let otherUserId = chatRooms.find((r) => r.id === selectedChatRoom)?.otherUserId;
      
      // Om vi inte hittar otherUserId, extrahera den från chatRoomId
      if (!otherUserId) {
        const roomParts = selectedChatRoom.split('-');
        otherUserId = roomParts.find(part => part !== user.email) || '';
      }
      
      console.log('Sending message:', {
        senderId: user.email,
        receiverId: otherUserId,
        chatRoomId: selectedChatRoom,
        message: newMessage
      });
      
      await chatApi.create({
        title: newMessage.substring(0, 50),
        message: newMessage,
        senderId: user.email,
        receiverId: otherUserId,
        chatRoomId: selectedChatRoom,
        isRead: false,
      });

      setNewMessage('');
      
      // Uppdatera meddelanden för denna chat room (utan loading-indikator)
      await loadMessages(selectedChatRoom, false);
      
      // Uppdatera chat rooms listan så att den nya konversationen visas
      await loadChatRooms();
      
      scrollToBottom();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    }
  };

  const fetchUsers = async () => {
    if (!user) return;
    
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // Map backend users to frontend User interface
        const mappedUsers: User[] = (data || []).map((u: any) => ({
          id: typeof u.id === 'string' ? parseInt(u.id) || 0 : (u.id || 0),
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          email: u.email || u.username || '',
          role: Array.isArray(u.roles) && u.roles.includes('Administrator') ? 'admin' : 'user',
          created: new Date().toISOString()
        }));
        // Filter out current user
        const otherUsers = mappedUsers.filter((u: User) => u.email !== user.email);
        setUsers(otherUsers);
      } else {
        console.error('Failed to fetch users:', response.status);
        setError('Failed to load users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const createNewChat = async (receiverId: string) => {
    if (!user) return;
    
    // Skapa ett unikt chatRoomId (sorterat för konsistens)
    const chatRoomId = [user.email, receiverId].sort().join('-');
    setSelectedChatRoom(chatRoomId);
    setShowNewChatModal(false);
    setNewChatUsername('');
    setUserSearchTerm('');
    
    // Ladda meddelanden för denna chat room (kan vara tom om det är första gången)
    await loadMessages(chatRoomId);
    
    // Uppdatera chat rooms listan för att se om det redan finns en konversation
    await loadChatRooms();
    
    // Om chat room inte finns i listan efter uppdatering, lägg till den manuellt
    // så att användaren kan skicka meddelanden även om det inte finns några meddelanden ännu
    // Hämta användarnamn för mottagaren
    const receiverUser = users.find(u => u.email === receiverId);
    const receiverName = receiverUser 
      ? `${receiverUser.firstName} ${receiverUser.lastName}`.trim() || receiverId
      : receiverId;
    
    setChatRooms(prev => {
      if (!prev.find(r => r.id === chatRoomId)) {
        return [...prev, {
          id: chatRoomId,
          otherUserId: receiverId,
          otherUserName: receiverName,
          unreadCount: 0
        }];
      }
      return prev;
    });
  };

  const handleStartNewChat = () => {
    if (!newChatUsername.trim()) {
      setError('Please enter a username');
      return;
    }
    createNewChat(newChatUsername.trim());
  };

  const handleDeleteConversation = async (chatRoomId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Förhindra att konversationen väljs när man klickar på delete
    
    if (!confirm('Are you sure you want to delete this conversation? All messages will be permanently deleted.')) {
      return;
    }

    if (!user) return;

    try {
      // Hämta username för att kunna filtrera korrekt
      let usernameForDelete = user.email;
      try {
        const authResponse = await fetch('/api/auth/login', { credentials: 'include' });
        if (authResponse.ok) {
          const authData = await authResponse.json();
          usernameForDelete = authData.username || user.email;
        }
      } catch (err) {
        console.error('Error fetching user data for delete:', err);
      }
      
      // Hämta alla meddelanden för användaren för att hitta meddelanden med både normaliserad och gammal chatRoomId
      const allUserMessages = await chatApi.getByUser(user.email, usernameForDelete);
      
      // Hitta konversationen för att få otherUserId
      const room = chatRooms.find(r => r.id === chatRoomId);
      
      // Filtrera meddelanden som tillhör denna konversation
      const currentUserIds = [user.email, usernameForDelete].filter(Boolean);
      const messagesInRoom = allUserMessages.filter((msg: ChatMessage) => {
        // Kolla om meddelandet har samma chatRoomId (kan vara normaliserad eller gammal)
        if (msg.chatRoomId === chatRoomId) return true;
        
        // Om vi har room.otherUserId, kolla om meddelandet har samma deltagare
        if (room) {
          const msgIsSender = currentUserIds.includes(msg.senderId);
          const msgIsReceiver = currentUserIds.includes(msg.receiverId);
          if (!msgIsSender && !msgIsReceiver) return false; // Meddelandet tillhör inte användaren
          
          const msgOtherUserId = msgIsSender ? msg.receiverId : msg.senderId;
          
          // Matcha mot otherUserId (kan vara email eller username)
          if (msgOtherUserId === room.otherUserId) return true;
          if (room.otherUserId.includes('@') && msgOtherUserId === room.otherUserId) return true;
          if (!room.otherUserId.includes('@') && msgOtherUserId.toLowerCase() === room.otherUserId.toLowerCase()) return true;
        }
        
        return false;
      });
      
      console.log('Deleting conversation:', {
        chatRoomId,
        room: room ? { id: room.id, otherUserId: room.otherUserId } : null,
        messagesFound: messagesInRoom.length,
        messages: messagesInRoom.map(m => ({ id: m.id, chatRoomId: m.chatRoomId, senderId: m.senderId, receiverId: m.receiverId }))
      });
      
      // Ta bort alla meddelanden
      for (const msg of messagesInRoom) {
        try {
          await chatApi.delete(msg.id);
        } catch (deleteErr) {
          console.error('Failed to delete message:', msg.id, deleteErr);
        }
      }
      
      // Om den valda konversationen tas bort, rensa valet
      if (selectedChatRoom === chatRoomId) {
        setSelectedChatRoom(null);
        setMessages([]);
      }
      
      // Uppdatera chat rooms listan
      await loadChatRooms();
    } catch (err: any) {
      console.error('Error deleting conversation:', err);
      setError(err.message || 'Failed to delete conversation');
    }
  };

  // Fetch users when modal opens
  useEffect(() => {
    if (showNewChatModal && user) {
      fetchUsers();
    }
  }, [showNewChatModal, user]);

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
                onClick={() => {
                  // Markera alla meddelande-notifikationer som lästa när konversation väljs
                  // (Vi markerar alla eftersom vi inte vet exakt hur notifikationer länkar till specifika konversationer)
                  const messageNotifications = notifications.filter(
                    (n) => !n.read && (n.type === 'message' || n.link?.includes('/messages'))
                  );
                  
                  console.log('Marking notifications as read:', {
                    roomId: room.id,
                    otherUserId: room.otherUserId,
                    notificationsFound: messageNotifications.length,
                    notifications: messageNotifications.map(n => ({ id: n.id, type: n.type, message: n.message, link: n.link }))
                  });
                  
                  messageNotifications.forEach((notification) => {
                    markAsRead(notification.id);
                  });
                  
                  setSelectedChatRoom(room.id);
                }}
                style={{ position: 'relative' }}
              >
                <div className="chat-room-avatar">
                  {room.otherUserId.charAt(0).toUpperCase()}
                </div>
                <div className="chat-room-info" style={{ flex: 1, minWidth: 0 }}>
                  <div className="chat-room-name">{room.otherUserName || room.otherUserId}</div>
                  {room.lastMessage && (
                    <div className="chat-room-preview">
                      <span>{room.lastMessage.message.substring(0, 50)}
                      {room.lastMessage.message.length > 50 ? '...' : ''}</span>
                      {room.lastMessage.createdDate && (
                        <span className="chat-room-time" style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.75rem', 
                          opacity: 0.7,
                          whiteSpace: 'nowrap'
                        }}>
                          • {new Date(room.lastMessage.createdDate).toLocaleTimeString('sv-SE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {room.unreadCount > 0 && (
                  <div className="unread-badge">{room.unreadCount}</div>
                )}
                <button
                  onClick={(e) => handleDeleteConversation(room.id, e)}
                  className="btn btn-sm"
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '0.25rem 0.5rem',
                    opacity: 0.7,
                    fontSize: '0.875rem',
                    zIndex: 10
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.7';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title="Delete conversation"
                >
                  <i className="bi bi-trash"></i>
                </button>
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
                {chatRooms.find((r) => r.id === selectedChatRoom)?.otherUserName || 
                 chatRooms.find((r) => r.id === selectedChatRoom)?.otherUserId}
              </h3>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="messages-list">
              {isLoading && messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message ${msg.senderId === user?.email ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">{msg.message || msg.content || ''}</div>
                    <div className="message-time">
                      {msg.createdDate
                        ? new Date(msg.createdDate).toLocaleTimeString()
                        : ''}
                    </div>
                  </div>
                ))
              )}
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
        <div className="modal-overlay" onClick={() => {
          setShowNewChatModal(false);
          setUserSearchTerm('');
          setError('');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h3>New Message</h3>
              <button 
                className="modal-close" 
                onClick={() => {
                  setShowNewChatModal(false);
                  setUserSearchTerm('');
                  setError('');
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="Search users..."
                  className="message-input"
                  autoFocus
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              
              {loadingUsers ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div>Loading users...</div>
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {users
                    .filter(u => {
                      const name = `${u.firstName} ${u.lastName}`.trim().toLowerCase();
                      const email = (u.email || '').toLowerCase();
                      const search = userSearchTerm.toLowerCase();
                      return name.includes(search) || email.includes(search);
                    })
                    .map((u) => {
                      const name = `${u.firstName} ${u.lastName}`.trim() || u.email;
                      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                      return (
                        <button
                          key={u.id}
                          onClick={() => createNewChat(u.email)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            marginBottom: '0.5rem',
                            border: 'none',
                            background: 'transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              flexShrink: 0
                            }}
                          >
                            {initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{name}</div>
                            {u.email && (
                              <div style={{ fontSize: '0.875rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {u.email}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  {users.filter(u => {
                    const name = `${u.firstName} ${u.lastName}`.trim().toLowerCase();
                    const email = (u.email || '').toLowerCase();
                    const search = userSearchTerm.toLowerCase();
                    return name.includes(search) || email.includes(search);
                  }).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                      <p style={{ margin: 0 }}>No users found</p>
                    </div>
                  )}
                </div>
              )}
              {error && <div className="error-message" style={{ marginTop: '0.5rem' }}>{error}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => {
                setShowNewChatModal(false);
                setUserSearchTerm('');
                setError('');
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

