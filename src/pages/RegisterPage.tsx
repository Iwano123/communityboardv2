import { Card, Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useState } from 'react';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import type { User } from '../interfaces/BulletinBoard';

RegisterPage.route = {
  path: '/register',
  menuLabel: 'Register',
  parent: '/'
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [, , , setUser] = useOutletContext<[any, any, User | null, (user: User | null) => void]>();
  const [step, setStep] = useState<'email' | 'complete'>('email');
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate email format
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Check if email already exists
      const checkResponse = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
      if (checkResponse.ok) {
        const existingUsers = await checkResponse.json();
        if (existingUsers && existingUsers.length > 0) {
          setError('An account with this email already exists');
          setLoading(false);
          return;
        }
      }

      // Move to next step
      setStep('complete');
    } catch (err) {
      setError('Error processing request');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate password
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        setLoading(false);
        return;
      }

      // Register user
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Auto-login after registration
        const loginResponse = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email,
            password: formData.password
          }),
        });

        if (loginResponse.ok) {
          const user = await loginResponse.json();
          setUser(user);
          localStorage.removeItem('viewedPosts');
          navigate('/');
        } else {
          // Registration successful but login failed - redirect to login
          navigate('/login');
        }
      } else {
        try {
          const errorData = await response.json();
          setError(errorData.error || 'Registration failed. Please try again.');
        } catch (jsonErr) {
          // If response is not JSON, show a generic error
          setError('Registration failed. Please try again.');
        }
      }
    } catch (err) {
      // Network error or other exception
      console.error('Registration error:', err);
      setError('Unable to connect to server. Please make sure the backend is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Step 1: Email entry
  if (step === 'email') {
    return (
      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="card-twitter border-0">
              <Card.Body className="text-center px-4 py-5">
                {/* Central Logo */}
                <div className="d-flex justify-content-center mb-4">
                  <div 
                    className="rounded-circle" 
                    style={{ 
                      width: '64px', 
                      height: '64px', 
                      backgroundColor: '#1d9bf0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '28px'
                    }}
                  >
                    O
                  </div>
                </div>

                {/* Heading */}
                <h2 className="fw-bold text-twitter-dark mb-2">Create an account</h2>
                
                {/* Instructional Text */}
                <p className="text-twitter-secondary mb-4">Enter your email to sign up for this app</p>

                {error && (
                  <Alert variant="danger" className="rounded-pill mb-3">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleEmailSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Email@domain.com"
                      className="form-control-twitter"
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #e1e8ed',
                        padding: '12px 16px',
                        fontSize: '15px'
                      }}
                    />
                  </Form.Group>

                  <div className="d-grid mb-3">
                    <Button 
                      variant="primary" 
                      type="submit" 
                      className="btn-twitter"
                      disabled={loading}
                      style={{
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '15px',
                        fontWeight: '600'
                      }}
                    >
                      {loading ? 'Processing...' : 'Continue'}
                    </Button>
                  </div>
                </Form>

                {/* Legal Text */}
                <p className="text-twitter-secondary small mb-0" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                  By clicking continue, you agree to our{' '}
                  <Link to="/terms" className="text-twitter-dark fw-semibold text-decoration-none">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-twitter-dark fw-semibold text-decoration-none">Privacy Policy</Link>
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // Step 2: Complete registration
  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="card-twitter">
            <Card.Body className="twitter-spacing">
              <h2 className="fw-bold text-twitter-dark mb-4 text-center">Complete your account</h2>

              {error && (
                <Alert variant="danger" className="rounded-pill mb-3 text-center">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleCompleteRegistration}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-twitter-dark">Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    disabled
                    className="form-control-twitter"
                    style={{ backgroundColor: '#f7f9fa' }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-twitter-dark">First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="Enter your first name"
                    className="form-control-twitter"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-twitter-dark">Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Enter your last name"
                    className="form-control-twitter"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-twitter-dark">Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    className="form-control-twitter"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold text-twitter-dark">Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm your password"
                    className="form-control-twitter"
                  />
                </Form.Group>

                <div className="d-grid mb-3">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="btn-twitter"
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </div>
              </Form>

              <div className="text-center mt-3">
                <p className="mb-0 text-twitter-secondary">
                  Already have an account? <Link to="/login" className="text-twitter-primary fw-semibold">Sign in</Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
