import { useState, useEffect } from 'react';
import { Card, Container, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { postApi } from '../utils/api';
import { mapBackendPostToFrontend } from '../utils/dataMapper';
import type { Post } from '../interfaces/BulletinBoard';

EditPostPage.route = {
  path: '/edit-post/:id',
  parent: '/'
};

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    price: '',
    location: '',
    image_url: ''
  });

  useEffect(() => {
    if (!id) return;
    
    const loadPost = async () => {
      try {
        setLoading(true);
        setError('');

        const backendPost = await postApi.getById(id);
        const mappedPost = mapBackendPostToFrontend(backendPost);
        setPost(mappedPost);

        // Check if user is authorized to edit this post
        const isAuthor = user && (mappedPost.author_email === user.email || mappedPost.author_name === `${user.firstName} ${user.lastName}`);
        const isAdmin = user && user.role === 'admin';
        
        if (!isAuthor && !isAdmin) {
          throw new Error('You are not authorized to edit this post');
        }

        // Populate form with existing data
        setFormData({
          title: mappedPost.title || '',
          content: mappedPost.content || '',
          price: '',
          location: '',
          image_url: ''
        });

      } catch (err: any) {
        setError(err.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await postApi.update(id, {
        title: formData.title,
        content: formData.content,
      });

      setSuccess('Post updated successfully!');
      setTimeout(() => {
        navigate(`/post/${id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <Row>
          <Col lg={8} className="mx-auto">
            <Card>
              <Card.Body className="text-center">
                <Spinner animation="border" className="mb-3" />
                <p>Loading post...</p>
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
                  <h4>Error</h4>
                  <p>{error || 'The post you are trying to edit does not exist.'}</p>
                  <Button variant="primary" onClick={() => navigate('/')}>
                    Back to Home
                  </Button>
                </Alert>
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
        <Col lg={8} className="mx-auto">
          <Card>
            <Card.Header>
              <h1 className="mb-0">Edit Post</h1>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Content</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Price (optional)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0.00"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Location (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="City, State"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Image URL (optional)</Form.Label>
                  <Form.Control
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? 'Updating...' : 'Update Post'}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate(`/post/${id}`)}
                    disabled={saving}
                  >
                    Cancel
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
