import { useState, useEffect } from 'react';
import { Card, Container, Row, Col, Form, Button, Alert, Badge, Tab, Tabs } from 'react-bootstrap';
import { useOutletContext } from 'react-router-dom';
import type { User, Post } from '../interfaces/BulletinBoard';
import { postApi } from '../utils/api';
import { mapBackendPostToFrontend } from '../utils/dataMapper';

ProfilePage.route = {
  path: '/profile',
  menuLabel: 'Profile',
  parent: '/'
};

export default function ProfilePage() {
  const [, , user, setUser] = useOutletContext<[any, any, User | null, (user: User | null) => void]>();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      });
    }
  }, [user]);

  // Load user posts
  useEffect(() => {
    const loadUserPosts = async () => {
      if (!user) return;
      
      try {
        // Get all posts and filter by author email or name
        const allPosts = await postApi.getAll({ orderby: '-createdDate' });
        const mappedPosts = allPosts.map(mapBackendPostToFrontend);
        const posts = mappedPosts.filter((post: Post) => 
          post.author_email === user.email || 
          post.author_name === `${user.firstName} ${user.lastName}`.trim() ||
          post.author_id === String(user.id)
        );
        setUserPosts(posts);
      } catch (err) {
        console.error('Error loading user posts:', err);
        setUserPosts([]);
      }
    };

    loadUserPosts();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!user) {
      setError('User not found');
      setLoading(false);
      return;
    }

    try {
      // Note: User profile update endpoint doesn't exist in the backend
      // For now, we'll just update the local state
      // In a real implementation, you would need to add a user update endpoint
      const updatedUser: User = {
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      };
      setUser(updatedUser);
      setSuccess('Profile updated successfully! (Note: Changes are local only - user update endpoint not implemented)');
      setIsEditing(false);
    } catch (err) {
      setError('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      });
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  if (!user) {
    return (
      <Container className="mt-4">
        <Row>
          <Col lg={8} className="mx-auto">
            <Card className="card-twitter">
              <Card.Body className="text-center twitter-spacing">
                <h1 className="card-title text-twitter-dark">Please Log In</h1>
                <p className="card-text text-twitter-secondary">You need to be logged in to view your profile.</p>
                <Button variant="primary" href="/login">Go to Login</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col lg={10} className="mx-auto">
          {/* Profile Header */}
          <Card className="card-twitter mb-4">
            <Card.Body className="twitter-spacing">
              <Row className="align-items-center">
                <Col md={3} className="text-center">
                  <div 
                    className="rounded-circle mx-auto mb-3" 
                    style={{ 
                      width: '120px', 
                      height: '120px', 
                      backgroundColor: '#1d9bf0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '48px'
                    }}
                  >
                    {user.firstName?.charAt(0).toUpperCase() || '?'}
                  </div>
                </Col>
                <Col md={9}>
                  <h1 className="mb-2 text-twitter-dark">
                    {user.firstName} {user.lastName}
                    {user.role === 'admin' && (
                      <Badge bg="danger" className="ms-2">Admin</Badge>
                    )}
                  </h1>
                  <p className="text-twitter-secondary mb-2">
                    <i className="bi bi-envelope me-2"></i>
                    {user.email}
                  </p>
                  <p className="text-twitter-secondary mb-3">
                    <i className="bi bi-calendar me-2"></i>
                    Member since {new Date(user.created).toLocaleDateString()}
                  </p>
                  <Button 
                    variant="outline-primary" 
                    className="btn-twitter-outline"
                    onClick={() => setIsEditing(true)}
                    disabled={isEditing}
                  >
                    <i className="bi bi-pencil me-2"></i>
                    Edit Profile
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Profile Content */}
          <Tabs defaultActiveKey="overview" className="mb-4">
            <Tab eventKey="overview" title="Overview">
              <Row>
                <Col lg={6}>
                  <Card className="card-twitter">
                    <Card.Header>
                      <h5 className="mb-0 text-twitter-dark">Profile Information</h5>
                    </Card.Header>
                    <Card.Body className="twitter-spacing">
                      <div className="mb-3">
                        <strong className="text-twitter-dark">First Name:</strong> <span className="text-twitter-secondary">{user.firstName}</span>
                      </div>
                      <div className="mb-3">
                        <strong className="text-twitter-dark">Last Name:</strong> <span className="text-twitter-secondary">{user.lastName}</span>
                      </div>
                      <div className="mb-3">
                        <strong className="text-twitter-dark">Email:</strong> <span className="text-twitter-secondary">{user.email}</span>
                      </div>
                      <div className="mb-3">
                        <strong className="text-twitter-dark">Role:</strong> 
                        <Badge bg={user.role === 'admin' ? 'danger' : 'primary'} className="ms-2">
                          {user.role}
                        </Badge>
                      </div>
                      <div className="mb-3">
                        <strong className="text-twitter-dark">Member Since:</strong> <span className="text-twitter-secondary">{new Date(user.created).toLocaleDateString()}</span>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={6}>
                  <Card className="card-twitter">
                    <Card.Header>
                      <h5 className="mb-0 text-twitter-dark">Activity Summary</h5>
                    </Card.Header>
                    <Card.Body className="twitter-spacing">
                      <div className="mb-3">
                        <strong className="text-twitter-dark">Total Posts:</strong> <span className="text-twitter-secondary">{userPosts.length}</span>
                      </div>
                      <div className="mb-3">
                        <strong className="text-twitter-dark">Featured Posts:</strong> <span className="text-twitter-secondary">{userPosts.filter(post => post.is_featured).length}</span>
                      </div>
                      <div className="mb-3">
                        <strong className="text-twitter-dark">Total Views:</strong> <span className="text-twitter-secondary">{userPosts.reduce((sum, post) => sum + post.views, 0)}</span>
                      </div>
                      <div className="mb-3">
                        <strong className="text-twitter-dark">Total Comments:</strong> <span className="text-twitter-secondary">{userPosts.reduce((sum, post) => sum + post.comments_count, 0)}</span>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="posts" title={`My Posts (${userPosts.length})`}>
              <Card className="card-twitter">
                <Card.Header>
                  <h5 className="mb-0 text-twitter-dark">Your Posts</h5>
                </Card.Header>
                <Card.Body className="twitter-spacing">
                  {userPosts.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-twitter-secondary">You haven't created any posts yet.</p>
                      <Button variant="primary" href="/create-post">
                        Create Your First Post
                      </Button>
                    </div>
                  ) : (
                    <div className="row">
                      {userPosts.map((post) => (
                        <div key={post.id} className="col-md-6 mb-3">
                          <Card className="card-twitter h-100">
                            <Card.Body className="twitter-spacing">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="card-title mb-0 text-twitter-dark">{post.title}</h6>
                                {post.is_featured && (
                                  <Badge bg="warning">Featured</Badge>
                                )}
                              </div>
                              <p className="card-text small text-twitter-secondary mb-2">
                                {post.content.substring(0, 100)}...
                              </p>
                              <div className="d-flex justify-content-between align-items-center">
                                <small className="text-twitter-secondary">
                                  {new Date(post.created_at).toLocaleDateString()}
                                </small>
                                <div className="d-flex gap-2">
                                  <span className="small text-twitter-secondary">
                                    <i className="bi bi-eye me-1"></i>
                                    {post.views}
                                  </span>
                                  <span className="small text-twitter-secondary">
                                    <i className="bi bi-chat me-1"></i>
                                    {post.comments_count}
                                  </span>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>

          {/* Edit Profile Modal */}
          {isEditing && (
            <Card className="card-twitter mt-4">
              <Card.Header>
                <h5 className="mb-0 text-twitter-dark">Edit Profile</h5>
              </Card.Header>
              <Card.Body className="twitter-spacing">
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="text-twitter-dark">First Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="form-control-twitter"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="text-twitter-dark">Last Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="form-control-twitter"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-3">
                    <Form.Label className="text-twitter-dark">Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-control-twitter"
                      required
                    />
                  </Form.Group>

                  <div className="d-flex gap-2">
                    <Button 
                      variant="primary" 
                      type="submit" 
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      className="btn-twitter-outline"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}
