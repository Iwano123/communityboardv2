import { useState, useEffect } from 'react';
import { useLoaderData } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { postApi, eventApi, marketplaceApi } from '../utils/api';
import postsLoader from '../utils/postsLoader';
import type { Post } from '../interfaces/BulletinBoard';

ForYouPage.route = {
  path: "/for-you",
  menuLabel: "For You",
  parent: "/",
  loader: postsLoader
};

// Helper function to format dates (similar to formatDistanceToNow from date-fns)
function formatDistanceToNow(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffInMs = now.getTime() - then.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo ago`;
  return `${Math.floor(diffInDays / 365)}y ago`;
}

// Generate avatar color from string
function getAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;
}

interface MixedContent {
  id: string;
  type: 'post' | 'event' | 'marketplace';
  title?: string;
  content?: string;
  description?: string;
  image_url?: string;
  authorId?: string;
  author_name?: string;
  author_email?: string;
  created_at?: string;
  likes?: number;
  likes_count?: number;
  price?: number;
  location?: string;
  event_date?: string;
  category?: string;
  condition?: string;
}

export default function ForYouPage() {
  const rawPosts = (useLoaderData() as { posts: Post[] }).posts;
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [mixedContent, setMixedContent] = useState<MixedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Process posts from loader
        const processedPosts: Post[] = rawPosts.map((post: Post) => ({
          ...post,
          author_name: post.author_name || post.author_email || 'Unknown',
          author_email: post.author_email || post.author_name || '',
        }));
        setPosts(processedPosts);

        // Fetch events
        try {
          const eventsData = await eventApi.getAll({ 
            where: 'isPublished=true', 
            orderby: '-eventDate',
            limit: 2 
          });
          setEvents(eventsData || []);
        } catch (err) {
          console.error('Error fetching events:', err);
          setEvents([]);
        }

        // Fetch marketplace items
        try {
          const itemsData = await marketplaceApi.getAll({ 
            where: 'isPublished=true AND isSold=false', 
            orderby: '-createdDate',
            limit: 2 
          });
          setItems(itemsData || []);
        } catch (err) {
          console.error('Error fetching marketplace items:', err);
          setItems([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [rawPosts]);

  // Mix content from different sources
  useEffect(() => {
    const mixed: MixedContent[] = [
      ...(posts.slice(0, 3).map((post: Post) => ({ 
        ...post, 
        type: 'post' as const,
        likes_count: post.views || 0
      })) || []),
      ...(events.slice(0, 2).map((event: any) => ({ 
        ...event, 
        type: 'event' as const 
      })) || []),
      ...(items.slice(0, 2).map((item: any) => ({ 
        ...item, 
        type: 'marketplace' as const 
      })) || []),
      ...(posts.slice(3, 5).map((post: Post) => ({ 
        ...post, 
        type: 'post' as const,
        likes_count: post.views || 0
      })) || []),
    ];
    setMixedContent(mixed);
  }, [posts, events, items]);

  const toggleLike = (id: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const trendingTopics = [
    { tag: "#CommunityEvents", count: "2.5K posts" },
    { tag: "#LocalMarket", count: "1.8K posts" },
    { tag: "#MeetupSunday", count: "956 posts" },
    { tag: "#OrchidLife", count: "743 posts" },
  ];

  const suggestedUsers = [
    { name: "Sarah Johnson", handle: "@sarahj", followers: "1.2K" },
    { name: "Mike Chen", handle: "@mikec", followers: "856" },
    { name: "Emma Wilson", handle: "@emmaw", followers: "2.1K" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen for-you-page">
        <Container className="py-5">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen for-you-page">
      <Container className="py-4" style={{ maxWidth: '1200px' }}>
        {/* Header */}
        <div className="mb-4">
          <div className="d-flex align-items-center gap-3 mb-2">
            <i className="bi bi-stars for-you-icon"></i>
            <h1 className="mb-0 for-you-title">
              For You
            </h1>
          </div>
          <p className="text-muted">Personalized content based on your interests and activity</p>
        </div>

        <Row>
          {/* Main Feed */}
          <Col lg={8}>
            <div className="d-flex flex-column gap-4">
              {mixedContent.length === 0 ? (
                <Card className="text-center py-5">
                  <Card.Body>
                    <i className="bi bi-inbox for-you-empty-icon"></i>
                    <h5 className="mt-3">No content yet</h5>
                    <p className="text-muted">Be the first to share something!</p>
                    <Link to="/create-post">
                      <Button variant="primary" className="mt-2">
                        Create Post
                      </Button>
                    </Link>
                  </Card.Body>
                </Card>
              ) : (
                mixedContent.map((item, index) => (
                  <Card 
                    key={`${item.type}-${item.id}`} 
                    className="shadow-sm"
                    style={{ 
                      transition: 'all 0.3s',
                      animationDelay: `${index * 50}ms`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                  >
                    {item.type === 'post' && (
                      <>
                        <Card.Header className="bg-white border-bottom for-you-card-header">
                          <div className="d-flex align-items-start gap-3">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                              style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: getAvatarColor(item.author_email || item.authorId || 'user'),
                                fontSize: '20px',
                                flexShrink: 0
                              }}
                            >
                              {item.author_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <span className="fw-semibold">
                                  {item.author_name || `User ${(item.authorId || item.id)?.toString().substring(0, 8)}`}
                                </span>
                                <Badge bg="secondary" className="text-xs">Post</Badge>
                              </div>
                              <p className="text-muted small mb-0">
                                {item.created_at ? formatDistanceToNow(item.created_at) : 'recently'}
                              </p>
                            </div>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <p className="mb-3" style={{ whiteSpace: 'pre-wrap' }}>
                            {item.content || item.title}
                          </p>
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt="Post"
                              className="rounded mb-3 w-100"
                              style={{ maxHeight: '400px', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Image+Not+Available';
                              }}
                            />
                          )}
                          <div className="d-flex align-items-center gap-4 pt-2">
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => toggleLike(item.id)}
                              className="text-decoration-none p-0 d-flex align-items-center gap-2"
                              style={{ 
                                color: likedPosts.has(item.id) ? '#dc3545' : '#6c757d'
                              }}
                            >
                              <i className={`bi ${likedPosts.has(item.id) ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                              <span className="small">{item.likes_count || 0}</span>
                            </Button>
                            <Link 
                              to={`/post/${item.id}`}
                              className="text-decoration-none text-muted d-flex align-items-center gap-2"
                            >
                              <i className="bi bi-chat"></i>
                              <span className="small">Reply</span>
                            </Link>
                            <Button
                              variant="link"
                              size="sm"
                              className="text-decoration-none text-muted p-0 d-flex align-items-center gap-2"
                            >
                              <i className="bi bi-share"></i>
                              <span className="small">Share</span>
                            </Button>
                          </div>
                        </Card.Body>
                      </>
                    )}

                    {item.type === 'event' && (
                      <>
                        <Card.Header className="bg-white border-bottom for-you-card-header">
                          <div className="d-flex align-items-start gap-3">
                            <div 
                              className="rounded d-flex align-items-center justify-content-center"
                              style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                                flexShrink: 0
                              }}
                            >
                              <i className="bi bi-calendar-event" style={{ fontSize: '24px', color: '#0d6efd' }}></i>
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <Badge bg="secondary" className="text-xs">Event</Badge>
                              </div>
                              <h5 className="fw-semibold mb-0 mt-1">{item.title}</h5>
                            </div>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <p className="text-muted mb-3">{item.description}</p>
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="rounded mb-3 w-100"
                              style={{ maxHeight: '300px', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x300?text=Event+Image';
                              }}
                            />
                          )}
                          <div className="d-flex align-items-center gap-4 text-muted small mb-3">
                            <span>📍 {item.location || 'TBA'}</span>
                            <span>📅 {item.event_date ? new Date(item.event_date).toLocaleDateString() : 'TBA'}</span>
                          </div>
                          <Link to="/events">
                            <Button variant="outline-primary" className="w-100">
                              View Event Details
                            </Button>
                          </Link>
                        </Card.Body>
                      </>
                    )}

                    {item.type === 'marketplace' && (
                      <>
                        <Card.Header className="bg-white border-bottom for-you-card-header">
                          <div className="d-flex align-items-start gap-3">
                            <div 
                              className="rounded d-flex align-items-center justify-content-center"
                              style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: 'rgba(111, 66, 193, 0.1)',
                                flexShrink: 0
                              }}
                            >
                              <i className="bi bi-bag" style={{ fontSize: '24px', color: '#6f42c1' }}></i>
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <Badge bg="secondary" className="text-xs">Marketplace</Badge>
                                {item.price && (
                                  <Badge bg="success" className="text-xs">${item.price}</Badge>
                                )}
                              </div>
                              <h5 className="fw-semibold mb-0 mt-1">{item.title}</h5>
                            </div>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="rounded mb-3 w-100"
                              style={{ maxHeight: '300px', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x300?text=Item+Image';
                              }}
                            />
                          )}
                          <p className="text-muted mb-3" style={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {item.description}
                          </p>
                          <div className="d-flex align-items-center gap-2 mb-3">
                            {item.category && (
                              <Badge variant="outline" className="text-xs">{item.category}</Badge>
                            )}
                            {item.condition && (
                              <Badge variant="outline" className="text-xs">{item.condition}</Badge>
                            )}
                          </div>
                          <Link to="/marketplace">
                            <Button variant="outline-primary" className="w-100">
                              View in Marketplace
                            </Button>
                          </Link>
                        </Card.Body>
                      </>
                    )}
                  </Card>
                ))
              )}
            </div>
          </Col>

          {/* Sidebar */}
          <Col lg={4}>
            <div className="position-sticky" style={{ top: '80px' }}>
              <div className="d-flex flex-column gap-4">
                {/* Trending Topics */}
                <Card>
                  <Card.Header className="bg-white border-bottom for-you-card-header">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-graph-up-arrow" style={{ color: '#0d6efd' }}></i>
                      <h6 className="mb-0 fw-semibold">Trending on Orchid</h6>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex flex-column gap-3">
                      {trendingTopics.map((topic) => (
                        <div 
                          key={topic.tag}
                          className="p-2 rounded"
                          style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <p className="fw-medium text-primary mb-0 small">{topic.tag}</p>
                          <p className="text-muted small mb-0">{topic.count}</p>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>

                {/* Suggested Users */}
                <Card>
                  <Card.Header className="bg-white border-bottom for-you-card-header">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-people" style={{ color: '#0d6efd' }}></i>
                      <h6 className="mb-0 fw-semibold">Who to Follow</h6>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex flex-column gap-4">
                      {suggestedUsers.map((user) => (
                        <div key={user.handle} className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                              style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: getAvatarColor(user.handle),
                                fontSize: '18px'
                              }}
                            >
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="fw-medium small mb-0">{user.name}</p>
                              <p className="text-muted small mb-0">{user.handle}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline-primary">
                            Follow
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
