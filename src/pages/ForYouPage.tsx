import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useStateContext } from '../utils/useStateObject';
import type { Post, Category, User } from '../interfaces/BulletinBoard';
import PostCard from '../parts/PostCard';

ForYouPage.route = {
  path: "/for-you",
  menuLabel: "For You",
  parent: "/",
};

interface MixedContentItem extends Post {
  type: 'post' | 'sale' | 'event';
}

export default function ForYouPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [mixedContent, setMixedContent] = useState<MixedContentItem[]>([]);

  // Get current user from context
  const context = useStateContext();
  const [, , user] = context || [null, null, null];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [postsResponse, categoriesResponse, usersResponse] = await Promise.all([
          fetch('/api/posts', { credentials: 'include' }),
          fetch('/api/categories', { credentials: 'include' }),
          fetch('/api/users', { credentials: 'include' })
        ]);

        if (!postsResponse.ok || !categoriesResponse.ok || !usersResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const postsData: Post[] = await postsResponse.json();
        const categoriesData: Category[] = await categoriesResponse.json();
        const usersData: User[] = await usersResponse.json();

        setCategories(categoriesData);
        setUsers(usersData);

        // Join posts with categories and users
        const joinedPosts: Post[] = postsData.map((post: any) => {
          const category = categoriesData.find((cat: Category) => cat.id === post.category_id);
          const author = usersData.find((user: User) => user.id === post.author_id);
          
          return {
            ...post,
            category_name: category?.name || 'Unknown',
            category_color: category?.color || '#1d9bf0',
            author_name: author ? `${author.firstName} ${author.lastName}` : 'Unknown',
            author_email: author?.email || '',
            comments_count: post.comments_count || 0,
            views: post.views || 0
          };
        });

        setPosts(joinedPosts);

        // Create mixed content - prioritize featured posts, sales, and recent posts
        const featuredPosts = joinedPosts.filter(p => p.is_featured);
        const salesPosts = joinedPosts.filter(p => p.price && p.price > 0);
        const regularPosts = joinedPosts.filter(p => !p.is_featured && !p.price);
        
        // Mix content: featured posts first, then sales, then regular posts
        const mixed: MixedContentItem[] = [
          ...featuredPosts.slice(0, 3).map(p => ({ ...p, type: 'sale' as const })),
          ...salesPosts.slice(0, 5).map(p => ({ ...p, type: 'sale' as const })),
          ...regularPosts.slice(0, 10).map(p => ({ ...p, type: 'post' as const })),
          ...featuredPosts.slice(3).map(p => ({ ...p, type: 'post' as const })),
          ...salesPosts.slice(5).map(p => ({ ...p, type: 'sale' as const })),
          ...regularPosts.slice(10).map(p => ({ ...p, type: 'post' as const }))
        ];

        // Sort by created_at (newest first)
        mixed.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });

        setMixedContent(mixed);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate trending topics from categories
  const trendingTopics = categories
    .map(cat => {
      const count = posts.filter(p => p.category_id === cat.id).length;
      return {
        tag: `#${cat.name.replace(/\s+/g, '')}`,
        count: `${count} posts`,
        category: cat
      };
    })
    .filter(t => parseInt(t.count) > 0)
    .sort((a, b) => parseInt(b.count) - parseInt(a.count))
    .slice(0, 5);

  // Get suggested users (users with most posts)
  const suggestedUsers = users
    .map(u => {
      const postCount = posts.filter(p => p.author_id === u.id).length;
      return {
        ...u,
        postCount
      };
    })
    .filter(u => u.postCount > 0 && u.id !== user?.id)
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 5);

  // Get sales count
  const salesCount = posts.filter(p => p.price && p.price > 0).length;

  if (loading) {
    return (
      <Container className="mt-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-twitter-secondary">Loading personalized content...</p>
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Container className="py-4">
        {/* Header */}
        <div className="mb-4">
          <div className="d-flex align-items-center gap-3 mb-2">
            <span className="fs-2">✨</span>
            <h1 className="text-4xl fw-bold mb-0" style={{
              background: 'linear-gradient(to right, #1d9bf0, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              For You
            </h1>
          </div>
          <p className="text-twitter-secondary">Personalized content based on your interests and activity</p>
        </div>

        <Row>
          {/* Main Feed */}
          <Col lg={8} className="mb-4">
            {mixedContent.length === 0 ? (
              <Card className="card-twitter text-center py-5">
                <Card.Body>
                  <div className="text-twitter-secondary mb-3">
                    <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h5 className="text-twitter-dark">No content yet</h5>
                  <p className="text-twitter-secondary">
                    Be the first to create a post or check back later for new content!
                  </p>
                  <Link to="/create-post">
                    <Button variant="primary" className="btn-twitter mt-3">
                      Create Your First Post
                    </Button>
                  </Link>
                </Card.Body>
              </Card>
            ) : (
              <div className="space-y-4">
                {mixedContent.map((item, index) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    style={{
                      animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`
                    }}
                  >
                    <PostCard
                      {...item}
                      onEdit={undefined}
                      onDelete={undefined}
                    />
                  </div>
                ))}
              </div>
            )}
          </Col>

          {/* Sidebar */}
          <Col lg={4}>
            <div className="sticky-top" style={{ top: '80px' }}>
              {/* Trending Topics */}
              <Card className="card-twitter mb-3">
                <Card.Header className="border-0">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-graph-up-arrow text-primary"></i>
                    <h6 className="fw-bold mb-0 text-twitter-dark">Trending on Orchid</h6>
                  </div>
                </Card.Header>
                <Card.Body className="twitter-spacing">
                  {trendingTopics.length === 0 ? (
                    <p className="text-twitter-secondary small mb-0">No trending topics yet</p>
                  ) : (
                    <div className="space-y-2">
                      {trendingTopics.map((topic) => (
                        <div
                          key={topic.tag}
                          className="p-2 rounded hover-bg-secondary cursor-pointer transition-colors"
                          style={{
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.03)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <p className="fw-semibold text-primary mb-0 small">{topic.tag}</p>
                          <p className="text-twitter-secondary small mb-0">{topic.count}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Stats Card */}
              <Card className="card-twitter mb-3">
                <Card.Header className="border-0">
                  <h6 className="fw-bold mb-0 text-twitter-dark">Community Stats</h6>
                </Card.Header>
                <Card.Body className="twitter-spacing">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-twitter-secondary small">Total Posts</span>
                    <span className="fw-semibold text-twitter-dark">{posts.length}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-twitter-secondary small">Items for Sale</span>
                    <span className="fw-semibold text-success">{salesCount}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-twitter-secondary small">Active Users</span>
                    <span className="fw-semibold text-twitter-dark">{users.length}</span>
                  </div>
                </Card.Body>
              </Card>

              {/* Suggested Users */}
              {suggestedUsers.length > 0 && (
                <Card className="card-twitter">
                  <Card.Header className="border-0">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-people text-primary"></i>
                      <h6 className="fw-bold mb-0 text-twitter-dark">Who to Follow</h6>
                    </div>
                  </Card.Header>
                  <Card.Body className="twitter-spacing">
                    <div className="space-y-3">
                      {suggestedUsers.map((suggestedUser) => (
                        <div key={suggestedUser.id} className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="avatar-twitter"
                              style={{
                                backgroundColor: suggestedUser.email ? 
                                  `hsl(${suggestedUser.email.charCodeAt(0) * 137.508 % 360}, 70%, 50%)` : 
                                  '#1d9bf0'
                              }}
                            >
                              {suggestedUser.firstName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="fw-semibold small text-twitter-dark mb-0">
                                {suggestedUser.firstName} {suggestedUser.lastName}
                              </p>
                              <p className="text-twitter-secondary small mb-0">
                                @{suggestedUser.email?.split('@')[0]}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline-primary" className="btn-twitter-outline">
                            Follow
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* Quick Actions */}
              <Card className="card-twitter mt-3">
                <Card.Body className="twitter-spacing">
                  <h6 className="fw-bold mb-3 text-twitter-dark">Quick Actions</h6>
                  <div className="d-grid gap-2">
                    <Link to="/create-post">
                      <Button variant="primary" className="btn-twitter w-100">
                        ✨ Create Post
                      </Button>
                    </Link>
                    <Link to="/community">
                      <Button variant="outline-primary" className="btn-twitter-outline w-100">
                        📋 Browse Community
                      </Button>
                    </Link>
                    {salesCount > 0 && (
                      <Link to="/marketplace">
                        <Button variant="outline-success" className="btn-twitter-outline w-100">
                          🛒 Browse Marketplace ({salesCount})
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .hover-shadow {
          transition: box-shadow 0.3s ease;
        }
        .hover-shadow:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }
        .space-y-2 > * + * {
          margin-top: 0.5rem;
        }
        .space-y-3 > * + * {
          margin-top: 0.75rem;
        }
        .space-y-4 > * + * {
          margin-top: 1rem;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .transition-colors {
          transition: background-color 0.2s ease;
        }
      `}</style>
    </div>
  );
}
