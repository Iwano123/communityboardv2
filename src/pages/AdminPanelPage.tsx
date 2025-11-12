import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert } from 'react-bootstrap';
import { postApi } from '../utils/api';
import { mapBackendPostToFrontend } from '../utils/dataMapper';
import type { Post } from '../interfaces/BulletinBoard';

// Note: User management endpoints don't exist in the backend
// This page shows posts only

AdminPanelPage.route = {
  path: '/admin',
  menuLabel: 'Admin Panel',
  parent: '/'
};

export default function AdminPanelPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const backendPosts = await postApi.getAll({ orderby: '-createdDate' });
        const mappedPosts = backendPosts.map(mapBackendPostToFrontend);
        setPosts(mappedPosts);
      } catch (err) {
        setError('Error loading posts');
        console.error('Error loading posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeletePost = async (postId: string | number) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postApi.delete(String(postId));
        setPosts(posts.filter(post => String(post.id) !== String(postId)));
      } catch (err) {
        console.error('Error deleting post:', err);
        alert('Failed to delete post');
      }
    }
  };

  if (loading) {
    return (
      <Container className="mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <h1 className="text-twitter-dark mb-4">Admin Panel</h1>
          
          {error && <Alert variant="danger">{error}</Alert>}

          <Alert variant="info" className="mb-4">
            <strong>Note:</strong> User management endpoints are not available in the backend. 
            Only post management is available.
          </Alert>

          <Row>
            <Col lg={12} className="mb-4">
              <Card className="card-twitter">
                <Card.Header className="border-0">
                  <h5 className="text-twitter-dark mb-0">Posts Management</h5>
                </Card.Header>
                <Card.Body className="twitter-spacing">
                  {posts.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted">No posts found</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Content Preview</th>
                            <th>Created</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {posts.map(post => (
                            <tr key={post.id}>
                              <td>{post.title || 'Untitled'}</td>
                              <td>{post.author_name || post.author_email || 'Unknown'}</td>
                              <td>
                                <small className="text-muted">
                                  {post.content ? post.content.substring(0, 50) + '...' : 'No content'}
                                </small>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'N/A'}
                                </small>
                              </td>
                              <td>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeletePost(post.id)}
                                >
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
}