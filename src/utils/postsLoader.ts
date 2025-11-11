export default async function postsLoader() {
  try {
    const response = await fetch('/api/posts', {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    const posts = await response.json();
    return { posts };
  } catch (error) {
    console.error('Error loading posts:', error);
    return { posts: [] };
  }
}