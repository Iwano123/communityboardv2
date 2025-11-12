import { useState, useEffect } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { commentApi } from '../utils/api';
import { formatDate } from '../utils/BulletinBoardHelpers';
import type { Comment } from '../interfaces/BulletinBoard';

interface CommentsSectionProps {
  postId: string | number;
  comments: Comment[];
  onCommentAdded: () => void;
}

interface CommentWithAuthor extends Comment {
  author_name?: string;
}

export default function CommentsSection({ postId, comments, onCommentAdded }: CommentsSectionProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [commentsWithAuthors, setCommentsWithAuthors] = useState<CommentWithAuthor[]>([]);

  // Map comments to include author names
  useEffect(() => {
    const mappedComments = comments.map((comment: any) => ({
      ...comment,
      author_name: comment.authorId || comment.author_name || 'Unknown User',
      author_id: 0, // Backend doesn't use numeric IDs
    }));
    setCommentsWithAuthors(mappedComments);
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setLoading(true);
    setError('');

    try {
      await commentApi.create({
        title: 'Comment',
        content: newComment.trim(),
        postId: postId.toString(),
        authorId: user.email || user.firstName + ' ' + user.lastName,
      });

      setNewComment('');
      onCommentAdded(); // Refresh comments
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string | number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentApi.delete(commentId.toString());
      onCommentAdded(); // Refresh comments
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
                  {(user && ((comment.authorId === user.email || comment.author_name === `${user.firstName} ${user.lastName}`) || user.role === 'admin')) && (
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
