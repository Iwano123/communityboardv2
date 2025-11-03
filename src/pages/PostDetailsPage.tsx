import { useState, useEffect } from 'react';
import { Card, Container, Row, Col, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStateContext } from '../utils/useStateObject';
import CommentsSection from '../parts/CommentsSection';
import type { Post, Comment, User } from '../interfaces/BulletinBoard';

PostDetailsPage.route = {
  path: '/post/:id',
  parent: '/'
};

export default function PostDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const context = useStateContext();
  const [, , user] = context || [null, null, null];
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [author, setAuthor] = useState<User | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const loadPostDetails = async () => {
      try {
        setLoading(true);
        setError('');

        // Check if user has already viewed this post in this session
        const viewedPostsKey = 'viewedPosts';
        const viewedPosts = JSON.parse(localStorage.getItem(viewedPostsKey) || '[]');
        const hasViewed = viewedPosts.includes(parseInt(id));

        // First, get the current post and categories
        const [currentPostResponse, categoriesResponse] = await Promise.all([
          fetch(`/api/posts/${id}`, {
            credentials: 'include'
          }),
          fetch('/api/categories', {
            credentials: 'include'
          })
        ]);
        
        if (!currentPostResponse.ok) {
          throw new Error('Post not found');
        }
        
        const currentPostData = await currentPostResponse.json();
        const categoriesData = await categoriesResponse.json();
        
        // Join post with category data
        const category = categoriesData.find((cat: any) => cat.id === currentPostData.category_id);
        const postWithCategory = {
          ...currentPostData,
          category_name: category?.name || 'Unknown',
          category_color: category?.color || '#007bff'
        };
        
        // Increment view count only if user hasn't viewed this post in this session
        if (!hasViewed) {
          try {
            await fetch(`/api/posts/${id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                views: (postWithCategory.views || 0) + 1
              })
            });
            
            // Mark this post as viewed in localStorage
            const updatedViewedPosts = [...viewedPosts, parseInt(id)];
            localStorage.setItem(viewedPostsKey, JSON.stringify(updatedViewedPosts));
            
            // Update the post data with incremented views
            setPost({
              ...currentPostData,
              views: (currentPostData.views || 0) + 1
            });
          } catch (viewError) {
            console.log('Could not increment view count:', viewError);
            // Continue loading even if view increment fails
            setPost(postWithCategory);
          }
        } else {
          // User has already viewed this post, don't increment
          setPost(postWithCategory);
        }

        // Load author details
        if (postWithCategory.author_id) {
          const authorResponse = await fetch(`/api/users/${postWithCategory.author_id}`, {
            credentials: 'include'
          });
          if (authorResponse.ok) {
            const authorData = await authorResponse.json();
            setAuthor(authorData);
          }
        }

        // Load comments
        const commentsResponse = await fetch(`/api/comments?post_id=${id}`, {
          credentials: 'include'
        });
        
        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          setComments(commentsData);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    loadPostDetails();
  }, [id]);

  const handleCommentAdded = async () => {
    // Reload comments
    try {
      const response = await fetch(`/api/comments?post_id=${id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      }
    } catch (err) {
      console.error('Error reloading comments:', err);
    }
  };

  const handleDeletePost = async () => {
    if (!post || !confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        navigate('/');
      } else {
        alert('Failed to delete post');
      }
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

  const isAuthor = user && user.id === post.author_id;
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
                    {author?.firstName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="fw-bold text-twitter-dark">
                      {author?.firstName} {author?.lastName}
                    </div>
                    <div className="text-twitter-secondary small">
                      @{author?.email?.split('@')[0]}
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
                      <Link to={`/edit-post/${post.id}`}>
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
              {author?.email && (
                <div className="mt-3 pt-3 border-top">
                  <small className="text-twitter-secondary">
                    📧 Contact: {author.email}
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
