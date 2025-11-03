import { Card, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useStateContext } from '../utils/useStateObject';

interface PostCardProps {
  id: number;
  title: string;
  content: string;
  category_name: string;
  category_color?: string;
  author_id: number;
  author_name: string;
  author_email: string;
  created_at: string;
  location?: string;
  price?: number;
  image_url?: string;
  is_featured: boolean;
  views: number;
  comments_count: number;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function PostCard({
  id,
  title,
  content,
  category_name,
  category_color,
  author_id,
  author_name,
  author_email,
  created_at,
  location,
  price,
  image_url,
  is_featured,
  views,
  comments_count,
  onEdit,
  onDelete
}: PostCardProps) {
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    senderEmail: '',
    senderName: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`;
    return date.toLocaleDateString();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Get current user from context
  const context = useStateContext();
  const [, , user] = context || [null, null, null];
  
  const isAuthor = user && user.id === author_id;
  const isAdmin = user && user.role === 'admin';

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setContactError('');
    setContactSuccess('');

    try {
      // In a real application, you would send this to your backend
      // For now, we'll simulate the contact functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setContactSuccess('Your message has been sent successfully!');
      setContactForm({
        subject: '',
        message: '',
        senderEmail: '',
        senderName: ''
      });
      
      setTimeout(() => {
        setShowContactModal(false);
        setContactSuccess('');
      }, 2000);
      
    } catch (err) {
      setContactError('Failed to send message. Please try again.');
    } finally {
      setContactLoading(false);
    }
  };

  const handleContactClick = () => {
    if (user) {
      setContactForm({
        subject: `Re: ${title}`,
        message: '',
        senderEmail: user.email || '',
        senderName: `${user.firstName} ${user.lastName}`.trim()
      });
    }
    setShowContactModal(true);
  };

  return (
    <>
      <Card className="card-twitter hover-shadow mb-3">
        {/* Post Header */}
        <Card.Header className="border-0 pb-0">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <div
                className="avatar-twitter me-2"
                style={{
                  backgroundColor: category_color || '#1d9bf0'
                }}
              >
                {author_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="fw-bold small text-twitter-dark">{author_name}</div>
                <div className="text-twitter-secondary small">@{author_email?.split('@')[0]}</div>
              </div>
            </div>
            <div className="text-twitter-secondary small">
              {formatDate(created_at)}
            </div>
          </div>
        </Card.Header>

        <Card.Body className="pt-2">
          {/* Category Badge */}
          <div className="mb-2">
            <Badge
              className="badge-twitter me-1"
              style={{
                backgroundColor: (category_color || '#1d9bf0') + '20',
                color: category_color || '#1d9bf0'
              }}
            >
              {category_name?.replace(/\s*\d+$/, '') || 'Unknown'}
            </Badge>
            {!!is_featured && (
              <Badge className="badge-twitter" style={{ backgroundColor: '#ffd700', color: '#000' }}>
                ⭐ Featured
              </Badge>
            )}
          </div>

          {/* Post Content */}
          <div className="mb-3">
            <h5 className="fw-bold mb-2 text-twitter-dark">
              <Link to={`/post/${id}`} className="text-decoration-none text-twitter-dark">
                {title}
              </Link>
            </h5>
            <p className="text-twitter-secondary mb-2" style={{ lineHeight: '1.5' }}>
              {content.length > 200 ? `${content.substring(0, 200)}...` : content}
            </p>
          </div>

          {/* Post Image */}
          {image_url && (
            <div className="mb-3">
              <img
                src={image_url}
                alt={title}
                className="img-fluid rounded"
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  cursor: 'pointer',
                  borderRadius: '12px'
                }}
                onClick={() => window.open(image_url, '_blank')}
              />
            </div>
          )}

          {/* Post Details */}
          <div className="mb-3">
            {price && (
              <div className="d-flex align-items-center mb-1">
                <span className="text-success fw-bold">{formatPrice(price)}</span>
              </div>
            )}
            {location && (
              <div className="d-flex align-items-center mb-1">
                <span className="text-twitter-secondary small">📍 {location}</span>
              </div>
            )}
            <div className="d-flex align-items-center">
              <span className="text-twitter-secondary small">👁️ {views} views</span>
              {comments_count > 0 && (
                <span className="text-twitter-secondary small ms-3">💬 {comments_count} comments</span>
              )}
            </div>
          </div>

          {/* Action Buttons - Twitter-like */}
          <div className="d-flex justify-content-between align-items-center border-top pt-3">
            <div className="d-flex align-items-center">
              <Link to={`/post/${id}`}>
                <Button
                  variant="outline-light"
                  size="sm"
                  className="me-3 text-twitter-secondary border-0 btn-twitter-outline"
                  style={{ fontSize: '14px', padding: '4px 8px' }}
                >
                  💬 Reply
                </Button>
              </Link>
              <Button
                variant="outline-light"
                size="sm"
                className="me-3 text-twitter-secondary border-0 btn-twitter-outline"
                style={{ fontSize: '14px', padding: '4px 8px' }}
                onClick={handleContactClick}
                disabled={isAuthor}
              >
                📧 Contact
              </Button>
              <Button
                variant="outline-light"
                size="sm"
                className="text-twitter-secondary border-0 btn-twitter-outline"
                style={{ fontSize: '14px', padding: '4px 8px' }}
              >
                🔄 Share
              </Button>
            </div>

            {/* Edit/Delete buttons for author or admin */}
            {(isAuthor || isAdmin) && (
              <div className="d-flex">
                {isAuthor && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2 btn-twitter-outline"
                    onClick={() => onEdit?.(id)}
                  >
                    Edit
                  </Button>
                )}
                {(isAuthor || isAdmin) && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="btn-twitter-outline"
                    style={{ borderColor: '#dc3545', color: '#dc3545' }}
                    onClick={() => onDelete?.(id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Contact Info */}
          {author_email && (
            <div className="mt-3 pt-3 border-top">
              <small className="text-twitter-secondary">
                📧 Contact: {author_email}
              </small>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Contact Modal */}
      <Modal show={showContactModal} onHide={() => setShowContactModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Contact {author_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">
            Send a message to <strong>{author_name}</strong> about their post: <em>"{title}"</em>
          </p>
          
          {contactSuccess && (
            <Alert variant="success">{contactSuccess}</Alert>
          )}
          
          {contactError && (
            <Alert variant="danger">{contactError}</Alert>
          )}

          <Form onSubmit={handleContactSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Your Name</Form.Label>
              <Form.Control
                type="text"
                value={contactForm.senderName}
                onChange={(e) => setContactForm({...contactForm, senderName: e.target.value})}
                required
                disabled={!!user}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Your Email</Form.Label>
              <Form.Control
                type="email"
                value={contactForm.senderEmail}
                onChange={(e) => setContactForm({...contactForm, senderEmail: e.target.value})}
                required
                disabled={!!user}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control
                type="text"
                value={contactForm.subject}
                onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={contactForm.message}
                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                placeholder="Write your message here..."
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="outline-secondary"
                onClick={() => setShowContactModal(false)}
                disabled={contactLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={contactLoading}
              >
                {contactLoading ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}