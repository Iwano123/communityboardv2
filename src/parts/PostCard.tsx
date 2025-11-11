import { Card, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useStateContext } from '../utils/useStateObject';

interface PostCardProps {
  id: number | string;
  title?: string;
  content: string;
  category_name?: string;
  category_color?: string;
  author_id: number | string;
  author_name: string;
  author_email: string;
  created_at: string;
  location?: string;
  price?: number;
  image_url?: string;
  is_featured: boolean;
  views: number;
  comments_count: number;
  onEdit?: (id: number | string) => void;
  onDelete?: (id: number | string) => void;
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Parse images - support comma-separated URLs or single URL
  const images = image_url 
    ? (image_url.includes(',') ? image_url.split(',').map(img => img.trim()) : [image_url])
    : [];

  // Generate avatar color from email
  const getAvatarColor = (email: string) => {
    if (!email) return '#fbbf24'; // Default yellow
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
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
        subject: title ? `Re: ${title}` : 'Re: Post',
        message: '',
        senderEmail: user.email || '',
        senderName: `${user.firstName} ${user.lastName}`.trim()
      });
    }
    setShowContactModal(true);
  };

  // Generate user handle from email
  const userHandle = author_email?.split('@')[0] || `user${author_id}`;

  return (
    <>
      <Card className="mb-3" style={{ 
        border: 'none', 
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <Card.Body className="p-0">
          {/* Header */}
          <div className="d-flex align-items-center p-3 pb-2">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: getAvatarColor(author_email),
                fontSize: '18px',
                flexShrink: 0
              }}
            >
              {author_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="ms-2 flex-grow-1">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-semibold text-dark" style={{ fontSize: '15px' }}>
                  {author_name || `User ${userHandle.substring(0, 8)}`}
                </span>
                <Badge 
                  className="rounded-pill" 
                  style={{ 
                    backgroundColor: '#e5e7eb',
                    color: '#6b7280',
                    fontSize: '11px',
                    padding: '2px 8px',
                    fontWeight: 'normal'
                  }}
                >
                  Post
                </Badge>
              </div>
              <div className="text-muted" style={{ fontSize: '13px', marginTop: '2px' }}>
                {formatDate(created_at)}
              </div>
            </div>
          </div>

          {/* Post Content */}
          {content && (
            <div className="px-3 pb-2">
              <p className="text-dark mb-0" style={{ fontSize: '15px', lineHeight: '1.5' }}>
                {content}
              </p>
            </div>
          )}

          {/* Main Image */}
          {images.length > 0 && (
            <div className="px-3 pb-2">
              <div 
                className="rounded"
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  overflow: 'hidden',
                  backgroundColor: '#f3f4f6',
                  cursor: 'pointer'
                }}
                onClick={() => images[selectedImageIndex] && window.open(images[selectedImageIndex], '_blank')}
              >
                <img
                  src={images[selectedImageIndex]}
                  alt={title || content.substring(0, 50)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x450?text=Image+Not+Available';
                  }}
                />
              </div>

              {/* Thumbnail Carousel */}
              {images.length > 1 && (
                <div className="d-flex gap-2 mt-2" style={{ overflowX: 'auto', paddingBottom: '4px' }}>
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className="rounded"
                      style={{
                        width: '80px',
                        height: '60px',
                        flexShrink: 0,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: selectedImageIndex === index ? '2px solid #1d9bf0' : '2px solid transparent',
                        backgroundColor: '#f3f4f6'
                      }}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x60?text=Error';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Price and Location (if applicable) */}
          {(price || location) && (
            <div className="px-3 pb-2">
              {price && (
                <div className="mb-1">
                  <span className="text-success fw-bold" style={{ fontSize: '16px' }}>
                    ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {location && (
                <div className="text-muted small">
                  📍 {location}
                </div>
              )}
            </div>
          )}

          {/* Interaction Bar */}
          <div 
            className="d-flex align-items-center justify-content-between px-3 py-2 border-top"
            style={{ borderColor: '#e5e7eb' }}
          >
            <div className="d-flex align-items-center gap-4">
              {/* Like Button */}
              <button
                className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-1"
                style={{ 
                  border: 'none',
                  background: 'none',
                  color: '#6b7280',
                  fontSize: '14px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span>0</span>
              </button>

              {/* Reply Button */}
              <Link 
                to={`/post/${id}`}
                className="text-decoration-none d-flex align-items-center gap-1"
                style={{ color: '#6b7280', fontSize: '14px' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1d9bf0'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Reply</span>
              </Link>

              {/* Share Button */}
              <button
                className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-1"
                style={{ 
                  border: 'none',
                  background: 'none',
                  color: '#6b7280',
                  fontSize: '14px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1d9bf0'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: title || 'Post',
                      text: content,
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                <span>Share</span>
              </button>
            </div>

            {/* Edit/Delete buttons for author or admin */}
            {(isAuthor || isAdmin) && (
              <div className="d-flex gap-2">
                {isAuthor && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => onEdit?.(id)}
                    style={{ fontSize: '12px' }}
                  >
                    Edit
                  </Button>
                )}
                {(isAuthor || isAdmin) && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onDelete?.(id)}
                    style={{ fontSize: '12px' }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Contact Modal */}
      <Modal show={showContactModal} onHide={() => setShowContactModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Contact {author_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">
            Send a message to <strong>{author_name}</strong> about their post: <em>"{title || 'Post'}"</em>
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
