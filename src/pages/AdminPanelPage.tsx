import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import { postApi, eventApi } from '../utils/api';
import { mapBackendPostToFrontend } from '../utils/dataMapper';
import type { Post } from '../interfaces/BulletinBoard';
import type { Event } from '../hooks/useEvents';

AdminPanelPage.route = {
  path: '/admin',
  menuLabel: 'Admin Panel',
  parent: '/'
};

export default function AdminPanelPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventsError, setEventsError] = useState('');

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

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const backendEvents = await eventApi.getAll({ orderby: '-eventDate' });
        // Map backend events to frontend format
        const mappedEvents = Array.isArray(backendEvents) ? backendEvents.map((e: any) => ({
          id: e.id || e.contentItemId,
          title: e.title || e.displayText || "",
          description: e.description || "",
          location: e.location,
          event_date: e.event_date || e.eventDate || e.event_date,
          category: e.category,
          image_url: e.image_url || e.imageUrl,
          author_id: e.author_id || e.authorId || e.organizerId,
        })) : [];
        setEvents(mappedEvents);
      } catch (err) {
        setEventsError('Error loading events');
        console.error('Error loading events:', err);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
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

  const handleDeleteEvent = async (eventId: string | number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventApi.delete(String(eventId));
        setEvents(events.filter(event => String(event.id) !== String(eventId)));
      } catch (err) {
        console.error('Error deleting event:', err);
        alert('Failed to delete event');
      }
    }
  };

  if (loading && eventsLoading) {
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
          {eventsError && <Alert variant="danger">{eventsError}</Alert>}

          <Alert variant="info" className="mb-4">
            <strong>Note:</strong> User management endpoints are not available in the backend. 
            Post and Event management is available.
          </Alert>

          <Tabs defaultActiveKey="posts" id="admin-tabs" className="mb-4">
            <Tab eventKey="posts" title="Posts Management">
              <Row>
                <Col lg={12} className="mb-4">
                  <Card className="card-twitter">
                    <Card.Header className="border-0">
                      <h5 className="text-twitter-dark mb-0">Posts Management</h5>
                    </Card.Header>
                    <Card.Body className="twitter-spacing">
                      {loading ? (
                        <div className="text-center py-4">
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      ) : posts.length === 0 ? (
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
            </Tab>

            <Tab eventKey="events" title="Events Management">
              <Row>
                <Col lg={12} className="mb-4">
                  <Card className="card-twitter">
                    <Card.Header className="border-0">
                      <h5 className="text-twitter-dark mb-0">Events Management</h5>
                    </Card.Header>
                    <Card.Body className="twitter-spacing">
                      {eventsLoading ? (
                        <div className="text-center py-4">
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      ) : events.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-muted">No events found</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <Table hover>
                            <thead>
                              <tr>
                                <th>Title</th>
                                <th>Location</th>
                                <th>Event Date</th>
                                <th>Description Preview</th>
                                <th>Organizer</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {events.map(event => (
                                <tr key={event.id}>
                                  <td>{event.title || 'Untitled'}</td>
                                  <td>
                                    <small>{event.location || 'N/A'}</small>
                                  </td>
                                  <td>
                                    <small className="text-muted">
                                      {event.event_date 
                                        ? new Date(event.event_date).toLocaleDateString() + ' ' + 
                                          new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : 'N/A'}
                                    </small>
                                  </td>
                                  <td>
                                    <small className="text-muted">
                                      {event.description ? event.description.substring(0, 50) + '...' : 'No description'}
                                    </small>
                                  </td>
                                  <td>
                                    <small className="text-muted">
                                      {event.author_id || 'Unknown'}
                                    </small>
                                  </td>
                                  <td>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => handleDeleteEvent(event.id)}
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
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
}