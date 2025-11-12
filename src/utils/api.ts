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
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
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
    const result = await apiRequest<any>(`/Chat?where=chatRoomId=${chatRoomId}&orderby=createdDate`);
    return Array.isArray(result) ? result : (result.value || []);
  },

  getByUser: async (userId: string) => {
    const result = await apiRequest<any>(`/Chat?where=senderId=${userId} OR receiverId=${userId}&orderby=-createdDate`);
    return Array.isArray(result) ? result : (result.value || []);
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
