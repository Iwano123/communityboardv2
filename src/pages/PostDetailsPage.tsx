import { useState, useEffect } from 'react';
import { Card, Container, Row, Col, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CommentsSection from '../parts/CommentsSection';
import { postApi, commentApi } from '../utils/api';
import { mapBackendPostToFrontend } from '../utils/dataMapper';
import type { Post, Comment } from '../interfaces/BulletinBoard';

PostDetailsPage.route = {
  path: '/post/:id',
  parent: '/'
};

export default function PostDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    
    const loadPostDetails = async () => {
      try {
        setLoading(true);
        setError('');

        // Load post
        const backendPost = await postApi.getById(id);
        const mappedPost = mapBackendPostToFrontend(backendPost);
        
        // Check if user has already viewed this post in this session
        const viewedPostsKey = 'viewedPosts';
        const viewedPosts = JSON.parse(localStorage.getItem(viewedPostsKey) || '[]');
        const hasViewed = viewedPosts.includes(id);

        // Increment view count only if user hasn't viewed this post in this session
        if (!hasViewed) {
          try {
            await postApi.update(id, {
              likes: (backendPost.likes || 0) + 1
            });
            
            // Mark this post as viewed in localStorage
            const updatedViewedPosts = [...viewedPosts, id];
            localStorage.setItem(viewedPostsKey, JSON.stringify(updatedViewedPosts));
            
            // Update the post data with incremented views
            setPost({
              ...mappedPost,
              views: (mappedPost.views || 0) + 1
            });
          } catch (viewError) {
            console.log('Could not increment view count:', viewError);
            setPost(mappedPost);
          }
        } else {
          setPost(mappedPost);
        }

        // Load comments
        try {
          const commentsData = await commentApi.getByPostId(id);
          setComments(commentsData || []);
        } catch (commentError) {
          console.error('Error loading comments:', commentError);
          setComments([]);
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    loadPostDetails();
  }, [id]);

  const handleCommentAdded = async () => {
    // Reload comments
    try {
      if (id) {
        const commentsData = await commentApi.getByPostId(id);
        setComments(commentsData || []);
      }
    } catch (err) {
      console.error('Error reloading comments:', err);
    }
  };

  const handleDeletePost = async () => {
    if (!post || !id || !confirm('Are you sure you want to delete this post?')) return;

    try {
      await postApi.delete(id);
      navigate('/for-you');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <Row>
          <Col lg={8} className="mx-auto">
            <Card>
              <Card.Body className="text-center">
                <Spinner animation="border" className="mb-3" />
                <p>Loading post details...</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error || !post) {
    return (
      <Container className="mt-4">
        <Row>
          <Col lg={8} className="mx-auto">
            <Card>
              <Card.Body className="text-center">
                <Alert variant="danger">
                  <h4>Post Not Found</h4>
                  <p>{error || 'The post you are looking for does not exist.'}</p>
                  <Link to="/">
                    <Button variant="primary">
                      Back to Home
                    </Button>
                  </Link>
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  const isAuthor = user && (post.author_email === user.email || post.author_name === `${user.firstName} ${user.lastName}`);
  const isAdmin = user && user.role === 'admin';

  return (
    <Container className="mt-4">
      <Row>
        <Col lg={8} className="mx-auto">
          {/* Post Details */}
          <Card className="mb-4">
            <Card.Header className="border-0 pb-0">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <div
                    className="avatar-twitter me-2"
                    style={{
                      backgroundColor: '#1d9bf0',
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '20px'
                    }}
                  >
                    {post.author_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="fw-bold text-twitter-dark">
                      {post.author_name || 'Unknown'}
                    </div>
                    <div className="text-twitter-secondary small">
                      @{post.author_email?.split('@')[0] || 'user'}
                    </div>
                  </div>
                </div>
                <div className="text-twitter-secondary small">
                  {formatDate(post.created_at)}
                </div>
              </div>
            </Card.Header>

            <Card.Body className="pt-2">
              {/* Category Badge */}
              <div className="mb-3">
                <Badge
                  className="badge-twitter me-2"
                  style={{
                    backgroundColor: '#1d9bf0' + '20',
                    color: '#1d9bf0'
                  }}
                >
                  {(post.category_name || 'General')?.replace(/\s*\d+$/, '')}
                </Badge>
                {post.is_featured && (
                  <Badge className="badge-twitter" style={{ backgroundColor: '#ffd700', color: '#000' }}>
                    ⭐ Featured
                  </Badge>
                )}
              </div>

              {/* Post Title */}
              <h2 className="fw-bold mb-3 text-twitter-dark">{post.title}</h2>

              {/* Post Image */}
              {post.image_url && (
                <div className="mb-4">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="img-fluid rounded"
                    style={{
                      width: '100%',
                      maxHeight: '400px',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      borderRadius: '12px'
                    }}
                    onClick={() => window.open(post.image_url, '_blank')}
                  />
                </div>
              )}

              {/* Post Content */}
              <div className="mb-4">
                <p className="text-twitter-secondary" style={{ lineHeight: '1.6', fontSize: '16px' }}>
                  {post.content}
                </p>
              </div>

              {/* Post Details */}
              <div className="mb-4">
                {post.price && (
                  <div className="d-flex align-items-center mb-2">
                    <span className="text-success fw-bold fs-5">{formatPrice(post.price)}</span>
                  </div>
                )}
                {post.location && (
                  <div className="d-flex align-items-center mb-2">
                    <span className="text-twitter-secondary">📍 {post.location}</span>
                  </div>
                )}
                <div className="d-flex align-items-center">
                  <span className="text-twitter-secondary small">👁️ {post.views} views</span>
                  {comments.length > 0 && (
                    <span className="text-twitter-secondary small ms-3">💬 {comments.length} comments</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-between align-items-center border-top pt-3">
                <div className="d-flex align-items-center">
                  <Button
                    variant="outline-light"
                    size="sm"
                    className="me-3 text-twitter-secondary border-0 btn-twitter-outline"
                    style={{ fontSize: '14px', padding: '4px 8px' }}
                  >
                    🔄 Share
                  </Button>
                  <Button
                    variant="outline-light"
                    size="sm"
                    className="text-twitter-secondary border-0 btn-twitter-outline"
                    style={{ fontSize: '14px', padding: '4px 8px' }}
                  >
                    ❤️ Like
                  </Button>
                </div>

                {/* Edit/Delete buttons for author or admin */}
                {(isAuthor || isAdmin) && (
                  <div className="d-flex">
                    {isAuthor && (
                      <Link to={`/edit-post/${id}`}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2 btn-twitter-outline"
                        >
                          Edit
                        </Button>
                      </Link>
                    )}
                    {(isAuthor || isAdmin) && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="btn-twitter-outline"
                        style={{ borderColor: '#dc3545', color: '#dc3545' }}
                        onClick={handleDeletePost}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Contact Info */}
              {post.author_email && (
                <div className="mt-3 pt-3 border-top">
                  <small className="text-twitter-secondary">
                    📧 Contact: {post.author_email}
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Comments Section */}
          <CommentsSection 
            postId={post.id} 
            comments={comments} 
            onCommentAdded={handleCommentAdded}
          />
        </Col>
      </Row>
    </Container>
  );
}
