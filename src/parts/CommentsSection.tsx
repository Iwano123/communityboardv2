import { useState, useEffect } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useStateContext } from '../utils/useStateObject';
import { formatDate } from '../utils/bulletinBoardHelpers';
import type { Comment, User } from '../interfaces/BulletinBoard';

interface CommentsSectionProps {
  postId: number;
  comments: Comment[];
  onCommentAdded: () => void;
}

interface CommentWithAuthor extends Comment {
  author_name?: string;
}

export default function CommentsSection({ postId, comments, onCommentAdded }: CommentsSectionProps) {
  const context = useStateContext();
  const [, , user] = context || [null, null, null];
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [commentsWithAuthors, setCommentsWithAuthors] = useState<CommentWithAuthor[]>([]);

  // Fetch author names for comments
  useEffect(() => {
    const fetchAuthorNames = async () => {
      const commentsWithNames = await Promise.all(
        comments.map(async (comment) => {
          try {
            const response = await fetch(`/api/users/${comment.author_id}`, {
              credentials: 'include'
            });
            if (response.ok) {
              const author: User = await response.json();
              return {
                ...comment,
                author_name: `${author.firstName} ${author.lastName}`.trim()
              };
            }
          } catch (err) {
            console.error('Error fetching author:', err);
          }
          return {
            ...comment,
            author_name: 'Unknown User'
          };
        })
      );
      setCommentsWithAuthors(commentsWithNames);
    };

    if (comments.length > 0) {
      fetchAuthorNames();
    } else {
      setCommentsWithAuthors([]);
    }
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          post_id: postId,
          author_id: user.id,
          content: newComment.trim()
        }),
      });

      if (response.ok) {
        setNewComment('');
        onCommentAdded(); // Refresh comments
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add comment');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        onCommentAdded(); // Refresh comments
      } else {
        alert('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Error deleting comment');
    }
  };

  return (
    <Card className="mt-4">
      <Card.Header>
        <h5 className="mb-0">Comments ({commentsWithAuthors.length})</h5>
      </Card.Header>
      <Card.Body>
        {commentsWithAuthors.length === 0 ? (
          <p className="text-muted">No comments yet. Be the first to comment!</p>
        ) : (
          <div className="mb-4">
            {commentsWithAuthors.map(comment => (
              <div key={comment.id} className="border-bottom pb-3 mb-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <strong>{comment.author_name || 'Unknown User'}</strong>
                    <small className="text-muted ms-2">{formatDate(comment.created_at)}</small>
                  </div>
                  {(user?.id === comment.author_id || user?.role === 'admin') && (
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
                <p className="mb-0 mt-1">{comment.content}</p>
              </div>
            ))}
          </div>
        )}
        
        {user ? (
          <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Add a comment</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                required
              />
            </Form.Group>
            <Button 
              variant="primary" 
              type="submit"
              disabled={loading || !newComment.trim()}
            >
              {loading ? 'Posting...' : 'Post Comment'}
            </Button>
          </Form>
        ) : (
          <Alert variant="warning">
            <a href="/login">Login</a> to add comments
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};
