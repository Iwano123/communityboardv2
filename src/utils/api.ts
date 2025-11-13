const API_BASE = '/api';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `HTTP error! status: ${response.status} ${response.statusText}` };
    }
    
    // Log error for debugging
    console.error('API request failed:', {
      endpoint,
      method,
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    
    // Throw error with detailed message
    let errorMessage = errorData?.error || errorData?.message || `Request failed with status ${response.status}`;
    
    // Add detailed field information if available
    if (errorData?.invalidFields && Array.isArray(errorData.invalidFields)) {
      errorMessage += `\nInvalid fields: ${errorData.invalidFields.join(', ')}`;
    }
    if (errorData?.validFields && Array.isArray(errorData.validFields)) {
      errorMessage += `\nValid fields: ${errorData.validFields.join(', ')}`;
    }
    
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).data = errorData;
    throw error;
  }

  return response.json();
}

// Post API
export const postApi = {
  getAll: async (params?: { where?: string; orderby?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.where) query.append('where', params.where);
    if (params?.orderby) query.append('orderby', params.orderby);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    
    const queryString = query.toString();
    const result = await apiRequest<any>(`/Post${queryString ? `?${queryString}` : ''}`);
    // Backend returns { value: [...], Count: N } format, extract the array
    return Array.isArray(result) ? result : (result.value || []);
  },

  getById: (id: string) => apiRequest<any>(`/Post/${id}`),

  getExpanded: (params?: { where?: string; orderby?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.where) query.append('where', params.where);
    if (params?.orderby) query.append('orderby', params.orderby);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    
    const queryString = query.toString();
    return apiRequest<any[]>(`/expand/Post${queryString ? `?${queryString}` : ''}`);
  },

  create: (post: {
    title: string;
    content: string;
    authorId?: string;
    likes?: number;
    isPublished?: boolean;
  }) => apiRequest<any>('/Post', { method: 'POST', body: post }),

  update: (id: string, post: Partial<any>) =>
    apiRequest<any>(`/Post/${id}`, { method: 'PUT', body: post }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/Post/${id}`, { method: 'DELETE' }),
};

// Comment API
export const commentApi = {
  getAll: async (params?: { where?: string; orderby?: string }) => {
    const query = new URLSearchParams();
    if (params?.where) query.append('where', params.where);
    if (params?.orderby) query.append('orderby', params.orderby);
    
    const queryString = query.toString();
    const result = await apiRequest<any>(`/Comment${queryString ? `?${queryString}` : ''}`);
    return Array.isArray(result) ? result : (result.value || []);
  },

  getByPostId: async (postId: string) => {
    const result = await apiRequest<any>(`/Comment?where=postId=${postId}&orderby=-createdDate`);
    return Array.isArray(result) ? result : (result.value || []);
  },

  create: (comment: {
    title: string;
    content: string;
    postId: string;
    authorId?: string;
  }) => apiRequest<any>('/Comment', { method: 'POST', body: comment }),

  update: (id: string, comment: Partial<any>) =>
    apiRequest<any>(`/Comment/${id}`, { method: 'PUT', body: comment }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/Comment/${id}`, { method: 'DELETE' }),
};

// Event API
export const eventApi = {
  getAll: async (params?: { where?: string; orderby?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.where) query.append('where', params.where);
    if (params?.orderby) query.append('orderby', params.orderby);
    if (params?.limit) query.append('limit', params.limit.toString());
    
    const queryString = query.toString();
    const result = await apiRequest<any>(`/Event${queryString ? `?${queryString}` : ''}`);
    return Array.isArray(result) ? result : (result.value || []);
  },

  getById: (id: string) => apiRequest<any>(`/Event/${id}`),

  create: (event: {
    title: string;
    description: string;
    eventDate: string;
    location: string;
    organizerId?: string;
    isPublished?: boolean;
    category?: string;
    image_url?: string;
    [key: string]: any; // Allow additional fields
  }) => apiRequest<any>('/Event', { method: 'POST', body: event }),

  update: (id: string, event: Partial<any>) =>
    apiRequest<any>(`/Event/${id}`, { method: 'PUT', body: event }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/Event/${id}`, { method: 'DELETE' }),
};

// MarketplaceItem API
export const marketplaceApi = {
  getAll: async (params?: { where?: string; orderby?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.where) query.append('where', params.where);
    if (params?.orderby) query.append('orderby', params.orderby);
    if (params?.limit) query.append('limit', params.limit.toString());
    
    const queryString = query.toString();
    const result = await apiRequest<any>(`/MarketplaceItem${queryString ? `?${queryString}` : ''}`);
    return Array.isArray(result) ? result : (result.value || []);
  },

  getById: (id: string) => apiRequest<any>(`/MarketplaceItem/${id}`),

  create: (item: {
    title: string;
    description: string;
    price: number;
    sellerId?: string;
    isSold?: boolean;
    isPublished?: boolean;
  }) => apiRequest<any>('/MarketplaceItem', { method: 'POST', body: item }),

  update: (id: string, item: Partial<any>) =>
    apiRequest<any>(`/MarketplaceItem/${id}`, { method: 'PUT', body: item }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/MarketplaceItem/${id}`, { method: 'DELETE' }),
};

// Chat API
export const chatApi = {
  getAll: async (params?: { where?: string; orderby?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.where) query.append('where', params.where);
    if (params?.orderby) query.append('orderby', params.orderby);
    if (params?.limit) query.append('limit', params.limit.toString());
    
    const queryString = query.toString();
    const result = await apiRequest<any>(`/Chat${queryString ? `?${queryString}` : ''}`);
    return Array.isArray(result) ? result : (result.value || []);
  },

  getByChatRoom: async (chatRoomId: string) => {
    // URL-encode chatRoomId för att hantera specialtecken
    const encodedChatRoomId = encodeURIComponent(chatRoomId);
    const result = await apiRequest<any>(`/Chat?where=chatRoomId=${encodedChatRoomId}&orderby=createdDate`);
    return Array.isArray(result) ? result : (result.value || []);
  },

  getByUser: async (userId: string, username?: string) => {
    // Backend stöder inte OR, så vi gör separata anrop och kombinerar resultaten
    // Vi söker efter både email och username för att hitta både gamla och nya meddelanden
    // (gamla meddelanden kan ha username som senderId/receiverId, nya har email)
    
    console.log('getByUser: Searching for messages', { userId, username });
    
    const queries: Promise<any>[] = [
      // Sök med email/userId
      apiRequest<any>(`/Chat?where=senderId=${encodeURIComponent(userId)}&orderby=-createdDate`),
      apiRequest<any>(`/Chat?where=receiverId=${encodeURIComponent(userId)}&orderby=-createdDate`)
    ];
    
    // Om username finns och är annorlunda än userId, sök också med username
    if (username && username !== userId) {
      queries.push(
        apiRequest<any>(`/Chat?where=senderId=${encodeURIComponent(username)}&orderby=-createdDate`).catch(() => []),
        apiRequest<any>(`/Chat?where=receiverId=${encodeURIComponent(username)}&orderby=-createdDate`).catch(() => [])
      );
    }
    
    const results = await Promise.all(queries);
    
    // Kombinera alla resultat
    const allMessages: any[] = [];
    results.forEach((result, index) => {
      const messages = Array.isArray(result) ? result : (result.value || []);
      console.log(`getByUser: Query ${index} returned ${messages.length} messages:`, messages);
      allMessages.push(...messages);
    });
    
    // Filtrera meddelanden - se till att de verkligen tillhör denna användare
    // (extra säkerhet eftersom backend-filtreringen kan vara fel)
    const currentUserIdentifiers = [userId, username].filter(Boolean);
    const filteredMessages = allMessages.filter((msg: any) => {
      const isSender = currentUserIdentifiers.includes(msg.senderId);
      const isReceiver = currentUserIdentifiers.includes(msg.receiverId);
      const belongsToUser = isSender || isReceiver;
      
      if (!belongsToUser) {
        console.warn('getByUser: Filtered out message that does not belong to user:', {
          msgId: msg.id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          currentUserIdentifiers
        });
      }
      
      return belongsToUser;
    });
    
    // Ta bort dubbletter baserat på id
    const uniqueMessages = Array.from(
      new Map(filteredMessages.map((msg: any) => [msg.id || msg.ContentItemId, msg])).values()
    );
    
    console.log('getByUser: Final filtered messages:', uniqueMessages.length, uniqueMessages);
    
    // Sortera efter createdDate (nyaste först)
    return uniqueMessages.sort((a: any, b: any) => {
      const dateA = new Date(a.createdDate || a.created_at || a.CreatedUtc || 0).getTime();
      const dateB = new Date(b.createdDate || b.created_at || b.CreatedUtc || 0).getTime();
      return dateB - dateA;
    });
  },

  create: (chat: {
    title: string;
    message: string;
    senderId: string;
    receiverId: string;
    chatRoomId: string;
    isRead?: boolean;
  }) => apiRequest<any>('/Chat', { method: 'POST', body: chat }),

  update: (id: string, chat: Partial<any>) =>
    apiRequest<any>(`/Chat/${id}`, { method: 'PUT', body: chat }),

  markAsRead: (id: string) =>
    apiRequest<any>(`/Chat/${id}`, { method: 'PUT', body: { isRead: true } }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/Chat/${id}`, { method: 'DELETE' }),
};
