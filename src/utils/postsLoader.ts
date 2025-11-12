import { mapBackendPostToFrontend } from './dataMapper';
import type { Post } from '../interfaces/BulletinBoard';

export default async function postsLoader() {
  try {
    // Use raw endpoint to get published posts, then filter and clean
    const response = await fetch('/api/raw/Post?orderby=-createdDate', {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    const rawPosts = await response.json();
    // Raw endpoint returns array of ContentItems
    // Filter for published posts and extract Post data
    const posts: Post[] = rawPosts
      .filter((item: any) => item.Published) // Only published posts
      .map((item: any) => {
        const postData = item.Post || {};
        return {
          id: item.ContentItemId,
          title: item.DisplayText || 'Untitled',
          content: postData.Content?.Text || '',
          author_id: item.Author || item.Owner,
          author_name: item.Author || item.Owner,
          author_email: item.Author || item.Owner,
          created_at: item.CreatedUtc || item.PublishedUtc,
          likes: postData.Likes?.Value || 0,
          likes_count: postData.Likes?.Value || 0,
          image_url: postData.ImageUrl?.Text || undefined,
          category: undefined,
          is_published: item.Published
        };
      });
    return { posts };
  } catch (error) {
    console.error('Error loading posts:', error);
    return { posts: [] };
  }
}