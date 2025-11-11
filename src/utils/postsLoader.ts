import { mapBackendPostToFrontend } from './dataMapper';
import type { Post } from '../interfaces/BulletinBoard';

export default async function postsLoader() {
  try {
    const response = await fetch('/api/Post?where=isPublished=true&orderby=-createdDate', {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    const backendPosts = await response.json();
    // Map backend posts to frontend format
    const posts: Post[] = Array.isArray(backendPosts) 
      ? backendPosts.map(mapBackendPostToFrontend)
      : [];
    return { posts };
  } catch (error) {
    console.error('Error loading posts:', error);
    return { posts: [] };
  }
}