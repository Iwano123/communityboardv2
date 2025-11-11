import type { Post, User } from '../interfaces/BulletinBoard';

/**
 * Maps backend Post format to frontend Post format
 */
export function mapBackendPostToFrontend(backendPost: any): Post {
  // Store original backend ID for API operations
  const backendId = backendPost.id || '';
  
  return {
    id: backendId as any, // Keep as string for now, PostCard expects number but we'll handle it
    title: backendPost.title || '',
    content: backendPost.content || '',
    category_id: 0, // Categories not implemented in new backend yet
    category_name: 'Community', // Default category
    category_color: '#1d9bf0',
    author_id: 0, // Will need to map from authorId
    author_name: backendPost.authorId || 'Unknown',
    author_email: backendPost.authorId || '',
    contact_info: undefined,
    price: undefined,
    location: undefined,
    image_url: backendPost.image_url || backendPost.imageUrl || backendPost.ImageUrl || undefined,
    is_featured: false,
    views: backendPost.likes || 0,
    comments_count: 0,
    created_at: backendPost.createdDate || new Date().toISOString(),
    // Store backend ID for API operations
    _backendId: backendId,
  } as Post & { _backendId?: string };
}

/**
 * Maps backend User format to frontend User format
 */
export function mapBackendUserToFrontend(backendUser: any): User {
  const username = backendUser.username || '';
  const nameParts = username.split(' ');
  
  return {
    id: 0, // Backend doesn't return numeric ID
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    email: backendUser.email || username,
    role: backendUser.roles?.includes('Administrator') ? 'admin' : 
          backendUser.roles?.includes('Moderator') ? 'moderator' : 'user',
    created: new Date().toISOString(),
  };
}

/**
 * Maps frontend Post format to backend Post format for creating/updating
 */
export function mapFrontendPostToBackend(frontendPost: Partial<Post>): any {
  return {
    title: frontendPost.title || '',
    content: frontendPost.content || '',
    authorId: frontendPost.author_email || frontendPost.author_name || '',
    likes: 0,
    isPublished: true, // Default to published, can be adjusted based on role
  };
}

