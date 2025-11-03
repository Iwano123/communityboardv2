import { useState, useEffect } from 'react';
import { Card, Container, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import type { Post, User } from '../interfaces/BulletinBoard';

EditPostPage.route = {
  path: '/edit-post/:id',
  parent: '/'
};

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [, , user] = useOutletContext<[any, any, User | null, (user: User | null) => void]>();
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    price: '',
    location: '',
    image_url: ''
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!id) return;
    
    const loadPost = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/posts/${id}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Post not found');
        }
        
        const postData = await response.json();
        setPost(postData);

        // Check if user is authorized to edit this post
        if (user?.id !== postData.author_id && user?.role !== 'admin') {
          throw new Error('You are not authorized to edit this post');
        }

        // Populate form with existing data
        setFormData({
          title: postData.title || '',
          content: postData.content || '',
          category_id: postData.category_id?.toString() || '',
          price: postData.price?.toString() || '',
          location: postData.location || '',
          image_url: postData.image_url || ''
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
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
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        title: formData.title,
        content: formData.content,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        price: formData.price ? parseFloat(formData.price) : null,
        location: formData.location || null,
        image_url: formData.image_url || null
      };

      const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setSuccess('Post updated successfully!');
        setTimeout(() => {
          navigate(`/post/${id}`);
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update post');
      }
    } catch (err) {
      setError('Error updating post');
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
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category: any) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Select>
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
