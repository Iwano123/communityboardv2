import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { postApi } from '../utils/api';

CreatePostPage.route = {
  path: '/create-post',
  parent: '/'
};

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    location: '',
    price: '',
    contact_info: '',
    image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to create a post');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      console.log('Creating post with data:', formData);
      
      const postData: any = {
        title: formData.title,
        content: formData.content,
        authorId: user.email || `${user.firstName} ${user.lastName}`.trim(),
        likes: 0,
        isPublished: true,
      };

      // Add image URL if provided (this field exists in Post content type)
      if (formData.image_url) {
        postData.imageUrl = formData.image_url;
      }

      // Note: location, price, and contactInfo fields are not part of Post content type
      // If you need these fields, they must be added to the Post content type in Orchard Core admin

      console.log('Sending post data:', postData);
      const result = await postApi.create(postData);
      console.log('Post created successfully:', result);

      // Navigate to for-you page after successful creation
      navigate('/for-you');
    } catch (err: any) {
      console.error('Error creating post:', err);
      
      // Build detailed error message
      let errorMessage = err?.message || err?.error || err?.data?.error || err?.data?.message || 'Error creating post. Please try again.';
      
      // If backend returned invalidFields or validFields, include them in the error message
      if (err?.data?.invalidFields && Array.isArray(err.data.invalidFields) && err.data.invalidFields.length > 0) {
        errorMessage += `\n\nInvalid fields: ${err.data.invalidFields.join(', ')}`;
      }
      
      if (err?.data?.validFields && Array.isArray(err.data.validFields) && err.data.validFields.length > 0) {
        errorMessage += `\n\nValid fields: ${err.data.validFields.join(', ')}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="card-twitter">
            <Card.Header className="border-0 pb-0">
              <h2 className="text-twitter-dark mb-0">Create New Post</h2>
              <p className="text-twitter-secondary small">Share something with your community</p>
            </Card.Header>
            <Card.Body className="twitter-spacing">
              {error && (
                <Alert variant="danger" className="mb-3" dismissible onClose={() => setError('')}>
                  <Alert.Heading>Error</Alert.Heading>
                  <div style={{ whiteSpace: 'pre-line' }}>{error}</div>
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-twitter-dark">Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter post title"
                    className="form-control-twitter"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-twitter-dark">Content</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    required
                    placeholder="Describe your post..."
                    className="form-control-twitter"
                  />
                </Form.Group>


                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-twitter-dark">Location</Form.Label>
                      <Form.Control
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="City, State"
                        className="form-control-twitter"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-twitter-dark">Price</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="form-control-twitter"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-twitter-dark">Contact Information</Form.Label>
                  <Form.Control
                    type="text"
                    name="contact_info"
                    value={formData.contact_info}
                    onChange={handleChange}
                    placeholder="Email or phone number"
                    className="form-control-twitter"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-twitter-dark">Image URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="form-control-twitter"
                  />
                </Form.Group>

                <div className="d-flex justify-content-end gap-2">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/for-you')}
                    className="btn-twitter-outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="btn-twitter"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Post'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}