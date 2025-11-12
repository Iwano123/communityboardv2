import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../interfaces/BulletinBoard';

LoginPage.route = {
  path: '/login',
  parent: '/'
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Backend returns user data directly when successful (has username or email)
        if (data && (data.username || data.email || data.id)) {
          // Map backend user to BulletinBoard User interface
          const mappedUser: User = {
            id: 0,
            firstName: data.firstName || (data.username ? data.username.split(' ')[0] : '') || '',
            lastName: data.lastName || (data.username ? data.username.split(' ').slice(1).join(' ') : '') || '',
            email: data.email || data.username || '',
            role: (Array.isArray(data.roles) && data.roles.includes('Administrator')) ? 'admin' : 
                  (Array.isArray(data.roles) && data.roles.includes('Moderator')) ? 'moderator' : 'user',
            created: new Date().toISOString(),
          };
          login(mappedUser);
          // Clear viewed posts from localStorage on login
          localStorage.removeItem('viewedPosts');
          navigate('/');
        } else {
          setError('Invalid username or password');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Invalid username or password' }));
        setError(errorData.message || 'Invalid username or password');
      }
    } catch (err) {
      setError('Error logging in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="card-twitter">
            <Card.Header className="text-center border-0 pb-0">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div 
                  className="avatar-twitter me-2" 
                  style={{ 
                    width: '48px', 
                    height: '48px', 
                    backgroundColor: '#1d9bf0',
                    fontSize: '20px'
                  }}
                >
                  O
                </div>
                <h4 className="mb-0 text-twitter-dark">Welcome back</h4>
              </div>
              <p className="text-twitter-secondary small text-center">Sign in to your account</p>
            </Card.Header>
            <Card.Body className="twitter-spacing">
              {error && <Alert variant="danger" className="rounded-pill text-center">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-twitter-dark">Username or Email</Form.Label>
                  <Form.Control
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    required
                    placeholder="Enter your username or email"
                    className="form-control-twitter"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-twitter-dark">Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="form-control-twitter"
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="btn-twitter"
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </div>
              </Form>

              <div className="text-center mt-3">
                <p className="mb-0 text-twitter-secondary">
                  Don't have an account? <Link to="/register" className="text-twitter-primary fw-semibold">Sign up</Link>
                </p>
              </div>
            </Card.Body>
          </Card>

          <Card className="card-twitter mt-3">
            <Card.Body className="twitter-spacing text-center">
              <h6 className="text-twitter-dark fw-bold">Demo Accounts</h6>
              <div className="text-twitter-secondary small">
                <div className="mb-2">
                  <strong>Admin:</strong> thomas@nodehill.com
                </div>
                <div className="mb-2">
                  <strong>User:</strong> olle@nodehill.com
                </div>
                <div className="mb-2">
                  <strong>User:</strong> maria@nodehill.com
                </div>
                <div className="text-twitter-primary fw-semibold">
                  Password: 12345678
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}