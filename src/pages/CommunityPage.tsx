import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { postApi } from '../utils/api';
import './CommunityPage.css';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId?: string;
  likes?: number;
  isPublished?: boolean;
}

export default function CommunityPage() {
  const { isAuthenticated, user, hasRole } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      // Hämta endast publicerade posts för vanliga användare
      const where = hasRole('Moderator') || hasRole('Administrator')
        ? undefined
        : 'isPublished=true';
      
      const data = await postApi.getAll({ where, orderby: '-createdDate', limit: 20 });
      setPosts(data || []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load posts');
      console.error('Error fetching posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      setError('You must be logged in to create posts');
      return;
    }

    try {
      const post = {
        title: newPost.title,
        content: newPost.content,
        authorId: user.username,
        likes: 0,
        // Endast moderators och admins kan publicera direkt
        isPublished: hasRole('Moderator') || hasRole('Administrator'),
      };

      await postApi.create(post);
      setNewPost({ title: '', content: '' });
      setShowCreateForm(false);
      fetchPosts();
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    }
  };

  const handlePublishPost = async (postId: string) => {
    if (!hasRole('Moderator') && !hasRole('Administrator')) {
      setError('Only moderators and administrators can publish posts');
      return;
    }

    try {
      await postApi.update(postId, { isPublished: true });
      fetchPosts();
    } catch (err: any) {
      setError(err.message || 'Failed to publish post');
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="community-header">
        <h1>Community Feed</h1>
        {isAuthenticated && (
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : '+ Create Post'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreateForm && isAuthenticated && (
        <form onSubmit={handleCreatePost} className="create-post-form">
          <h2>Create New Post</h2>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              required
              placeholder="Enter post title"
            />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              required
              rows={5}
              placeholder="What's on your mind?"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {hasRole('Moderator') || hasRole('Administrator')
                ? 'Publish Post'
                : 'Submit for Review'}
            </button>
          </div>
        </form>
      )}

      <div className="posts-list">
        {posts.length === 0 ? (
          <div className="empty-state">
            <p>No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <h3>{post.title}</h3>
                {!post.isPublished && (hasRole('Moderator') || hasRole('Administrator')) && (
                  <button
                    className="btn btn-small"
                    onClick={() => handlePublishPost(post.id)}
                  >
                    Publish
                  </button>
                )}
              </div>
              <div className="post-content">{post.content}</div>
              <div className="post-footer">
                <span className="post-author">By: {post.authorId || 'Unknown'}</span>
                <span className="post-likes">❤️ {post.likes || 0}</span>
                {!post.isPublished && (
                  <span className="post-status">⏳ Pending Review</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

