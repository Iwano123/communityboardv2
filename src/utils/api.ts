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
  getAll: (params?: { where?: string; orderby?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.where) query.append('where', params.where);
    if (params?.orderby) query.append('orderby', params.orderby);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    
    const queryString = query.toString();
    return apiRequest<any[]>(`/Post${queryString ? `?${queryString}` : ''}`);
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
  getAll: (params?: { where?: string; orderby?: string }) => {
    const query = new URLSearchParams();
    if (params?.where) query.append('where', params.where);
    if (params?.orderby) query.append('orderby', params.orderby);
    
    const queryString = query.toString();
    return apiRequest<any[]>(`/Comment${queryString ? `?${queryString}` : ''}`);
  },

  getByPostId: (postId: string) =>
    apiRequest<any[]>(`/Comment?where=postId=${postId}&orderby=-createdDate`),

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
  getAll: (params?: { where?: string; orderby?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.where) query.append('where', params.where);
    if (params?.orderby) query.append('orderby', params.orderby);
    if (params?.limit) query.append('limit', params.limit.toString());
    
    const queryString = query.toString();
    return apiRequest<any[]>(`/Event${queryString ? `?${queryString}` : ''}`);
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
  getAll: (params?: { where?: string; orderby?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.where) query.append('where', params.where);
    if (params?.orderby) query.append('orderby', params.orderby);
    if (params?.limit) query.append('limit', params.limit.toString());
    
    const queryString = query.toString();
    return apiRequest<any[]>(`/MarketplaceItem${queryString ? `?${queryString}` : ''}`);
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

