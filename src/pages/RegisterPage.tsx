import { Card, Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../interfaces/BulletinBoard';

RegisterPage.route = {
  path: '/register',
  menuLabel: 'Register',
  parent: '/'
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
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

      // Note: Email check removed - backend will handle duplicate email validation

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

      // Generate username from email (sanitize special characters)
      const emailPrefix = email.split('@')[0];
      // Remove special characters and replace with underscore, keep only alphanumeric and underscore
      const username = emailPrefix.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 50);
      
      console.log('Registering user with:', {
        username,
        email,
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      // Register user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username,
          email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password
        }),
      });

      if (response.ok) {
        // Registration successful, get the response data
        const registerData = await response.json();
        console.log('Registration successful:', registerData);
        
        // Use username for login (since that's what was created)
        // Fallback to email if username is not available
        const loginIdentifier = registerData.username || username || email;
        
        console.log('Attempting login with:', loginIdentifier);
        
        // Small delay to ensure user is fully saved in database
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Registration successful, now login
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            usernameOrEmail: loginIdentifier,
            password: formData.password
          }),
        });

        if (loginResponse.ok) {
          const userData = await loginResponse.json();
          console.log('Login successful:', userData);
          
          // Map backend user to frontend User format (same as LoginPage)
          const mappedUser: User = {
            id: 0,
            firstName: userData.firstName || formData.firstName || '',
            lastName: userData.lastName || formData.lastName || '',
            email: userData.email || email,
            role: (Array.isArray(userData.roles) && userData.roles.includes('Administrator')) ? 'admin' : 
                  (Array.isArray(userData.roles) && userData.roles.includes('Moderator')) ? 'moderator' : 'user',
            created: new Date().toISOString(),
          };
          
          // Use login function from AuthContext to update state
          login(mappedUser);
          localStorage.removeItem('viewedPosts');
          navigate('/');
        } else {
          // Registration successful but login failed
          const loginError = await loginResponse.text().catch(() => 'Unknown error');
          console.error('Login failed after registration:', {
            status: loginResponse.status,
            statusText: loginResponse.statusText,
            error: loginError
          });
          
          // Show error but allow user to manually login
          setError(`Registration successful! However, automatic login failed. Please try logging in manually with your email: ${email}`);
          
          // Redirect to login after a delay
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } else {
        // Get response status and content type
        const contentType = response.headers.get('content-type');
        console.error('Registration failed:', {
          status: response.status,
          statusText: response.statusText,
          contentType: contentType,
          url: response.url
        });
        
        let errorMessage = 'Registration failed. Please try again.';
        
        try {
          // Try to parse as JSON first
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.error('Registration error response (JSON):', errorData);
            
            // Build error message from error and details
            errorMessage = errorData.error || errorMessage;
            
            // If there are details (validation errors), append them
            if (errorData.details && typeof errorData.details === 'object') {
              const detailMessages = Object.values(errorData.details).filter(Boolean);
              if (detailMessages.length > 0) {
                errorMessage += '\n\n' + detailMessages.join('\n');
              }
            }
          } else {
            // Try to get text response
            const errorText = await response.text();
            console.error('Registration error response (text):', errorText);
            errorMessage = errorText || errorMessage;
          }
        } catch (parseErr) {
          console.error('Error parsing response:', parseErr);
          errorMessage = `Registration failed (Status: ${response.status}). Please check console for details.`;
        }
        
        setError(errorMessage);
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
                  <Alert variant="danger" className="mb-3" style={{ whiteSpace: 'pre-wrap' }}>
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
                <Alert variant="danger" className="mb-3" style={{ whiteSpace: 'pre-wrap' }}>
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
