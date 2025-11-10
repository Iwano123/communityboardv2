import { useLoaderData, useNavigate, useSearchParams } from 'react-router-dom';
import { Row, Col, Form, Button, Card, Badge } from 'react-bootstrap';
import { useStateContext } from '../utils/useStateObject';
import Select from '../parts/Select';
import PostCard from '../parts/PostCard';
import postsLoader from '../utils/postsLoader';
import { getHelpers } from '../utils/BulletinBoardHelpers';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Post, Category, User } from '../interfaces/BulletinBoard';

// This page will be used for /community, /marketplace, and /for-you
CommunityFeedPage.route = {
  path: '/community',
  menuLabel: 'Community',
  parent: '/',
  loader: postsLoader
};

type FeedType = 'all' | 'for-sale' | 'regular' | 'featured';

export default function CommunityFeedPage() {
  const rawPosts = (useLoaderData() as { posts: Post[] }).posts;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get initial tab from URL parameter
  const tabParam = searchParams.get('tab') as FeedType;
  const [activeTab, setActiveTab] = useState<FeedType>(
    tabParam && ['all', 'for-sale', 'regular', 'featured'].includes(tabParam) 
      ? tabParam 
      : 'all'
  );

  // Get current user from context
  const context = useStateContext();
  const [, , user] = context || [null, null, null];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, usersResponse] = await Promise.all([
          fetch('/api/categories', { credentials: 'include' }),
          fetch('/api/users', { credentials: 'include' })
        ]);

        const categoriesData: Category[] = await categoriesResponse.json();
        const usersData: User[] = await usersResponse.json();

        setCategories(categoriesData);
        setUsers(usersData);

        // Join posts with categories and users
        const joinedPosts: Post[] = rawPosts.map((post: any) => {
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
      } catch (error) {
        console.error('Error fetching data:', error);
        setPosts(rawPosts);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [rawPosts]);

  const { sortOptions, sortDescriptions } = getHelpers(posts);

  // Get state object and setter from the outlet context
  const contextState = useStateContext();
  const [
    { categoryChoice, sortChoice, searchTerm, showOnlyMyPosts },
    setState
  ] = contextState || [{ categoryChoice: 'All', sortChoice: 'Newest first', searchTerm: '', showOnlyMyPosts: false }, () => {}];

  // Create categories list with counts
  const categoriesWithCounts = ['All', ...categories.map(cat => {
    const count = posts.filter(post => post.category_name === cat.name).length;
    return `${cat.name} (${count})`;
  })];

  // Handle edit post
  const handleEditPost = (postId: number) => {
    navigate(`/edit-post/${postId}`);
  };

  // Handle delete post
  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post');
    }
  };

  if (loading) {
    return <div className="container mt-5 text-center">Loading...</div>;
  }

  // Get the chosen category without the post count part
  const category = categoryChoice.split(' (')[0];
  // Get the key and order from the chosen sort option
  const sortOption = sortOptions.find(x => x.description === sortChoice);
  const sortKey = sortOption?.key || 'created_at';
  const sortOrder = sortOption?.order || -1;

  // Filter posts based on active tab
  let tabFilteredPosts = posts;
  if (activeTab === 'for-sale') {
    tabFilteredPosts = posts.filter(post => post.price && post.price > 0);
  } else if (activeTab === 'regular') {
    tabFilteredPosts = posts.filter(post => !post.price || post.price === 0);
  } else if (activeTab === 'featured') {
    tabFilteredPosts = posts.filter(post => post.is_featured);
  }

  // Filter posts based on search term, category, and user filter
  const filteredPosts = tabFilteredPosts.filter(post => {
    const matchesSearch = !searchTerm || 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = category === 'All' || post.category_name === category;
    
    const matchesUser = !showOnlyMyPosts || (user && post.author_id === user.id);
    
    return matchesSearch && matchesCategory && matchesUser;
  });

  // Sort posts
  const sortedPosts = filteredPosts.sort((a, b) => {
    if (sortKey === 'created_at') {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return (dateA > dateB ? 1 : -1) * sortOrder;
    }
    const valueA = a[sortKey as keyof Post] as string | number;
    const valueB = b[sortKey as keyof Post] as string | number;
    return (valueA > valueB ? 1 : -1) * sortOrder;
  });

  // Calculate stats
  const totalPosts = posts.length;
  const salesPosts = posts.filter(p => p.price && p.price > 0).length;
  const regularPosts = totalPosts - salesPosts;
  const featuredPosts = posts.filter(p => p.is_featured).length;

  // Get trending topics
  const trendingTopics = categories
    .map(cat => {
      const count = posts.filter(p => p.category_id === cat.id).length;
      return { tag: `#${cat.name.replace(/\s+/g, '')}`, count: `${count} posts`, category: cat };
    })
    .filter(t => parseInt(t.count) > 0)
    .sort((a, b) => parseInt(b.count) - parseInt(a.count))
    .slice(0, 5);

  // Get suggested users
  const suggestedUsers = users
    .map(u => {
      const postCount = posts.filter(p => p.author_id === u.id).length;
      return { ...u, postCount };
    })
    .filter(u => u.postCount > 0 && u.id !== user?.id)
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 5);

  return (
    <div className="container mt-4">
      <Row>
        {/* Left Sidebar */}
        <Col lg={3} className="mb-4">
          <Card className="card-twitter mb-3">
            <Card.Body className="twitter-spacing">
              <h6 className="fw-bold mb-3 text-twitter-dark">Search & Filter</h6>
              
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={e => setState({ searchTerm: e.target.value })}
                  className="form-control-twitter"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-twitter-secondary">Category</Form.Label>
                <Select
                  value={categoryChoice}
                  changeHandler={(x: string) => setState({ categoryChoice: x })}
                  options={categoriesWithCounts}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-twitter-secondary">Sort by</Form.Label>
                <Select
                  value={sortChoice}
                  changeHandler={(x: string) => setState({ sortChoice: x })}
                  options={sortDescriptions}
                />
              </Form.Group>

              <Form.Check
                type="checkbox"
                label="My posts only"
                checked={showOnlyMyPosts}
                onChange={e => setState({ showOnlyMyPosts: e.target.checked })}
                className="small text-twitter-secondary"
              />
            </Card.Body>
          </Card>

          {/* Stats Card */}
          <Card className="card-twitter mb-3">
            <Card.Body className="twitter-spacing">
              <h6 className="fw-bold mb-3 text-twitter-dark">Community Stats</h6>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-twitter-secondary small">Total Posts</span>
                <span className="fw-semibold text-twitter-dark">{totalPosts}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-twitter-secondary small">For Sale</span>
                <span className="fw-semibold text-success">{salesPosts}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-twitter-secondary small">Regular Posts</span>
                <span className="fw-semibold text-twitter-dark">{regularPosts}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-twitter-secondary small">Featured</span>
                <span className="fw-semibold text-warning">{featuredPosts}</span>
              </div>
            </Card.Body>
          </Card>

          {/* Trending Categories */}
          {trendingTopics.length > 0 && (
            <Card className="card-twitter">
              <Card.Body className="twitter-spacing">
                <h6 className="fw-bold mb-3 text-twitter-dark">Trending Topics</h6>
                {trendingTopics.map((topic) => (
                  <div
                    key={topic.tag}
                    className="p-2 rounded mb-2"
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
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Main Feed */}
        <Col lg={6}>
          {/* Feed Type Tabs */}
          <Card className="card-twitter mb-3">
            <Card.Body className="p-0">
              <div className="d-flex border-bottom">
                <button
                  className={`btn btn-link text-decoration-none flex-grow-1 py-3 ${activeTab === 'all' ? 'border-bottom border-primary border-2' : ''}`}
                  style={{
                    color: activeTab === 'all' ? '#1d9bf0' : '#6b7280',
                    fontWeight: activeTab === 'all' ? '600' : 'normal',
                    border: 'none',
                    background: 'none'
                  }}
                  onClick={() => {
                    setActiveTab('all');
                    navigate('/community', { replace: true });
                  }}
                >
                  All Posts
                </button>
                <button
                  className={`btn btn-link text-decoration-none flex-grow-1 py-3 ${activeTab === 'for-sale' ? 'border-bottom border-primary border-2' : ''}`}
                  style={{
                    color: activeTab === 'for-sale' ? '#1d9bf0' : '#6b7280',
                    fontWeight: activeTab === 'for-sale' ? '600' : 'normal',
                    border: 'none',
                    background: 'none'
                  }}
                  onClick={() => {
                    setActiveTab('for-sale');
                    navigate('/community?tab=for-sale', { replace: true });
                  }}
                >
                  For Sale ({salesPosts})
                </button>
                <button
                  className={`btn btn-link text-decoration-none flex-grow-1 py-3 ${activeTab === 'regular' ? 'border-bottom border-primary border-2' : ''}`}
                  style={{
                    color: activeTab === 'regular' ? '#1d9bf0' : '#6b7280',
                    fontWeight: activeTab === 'regular' ? '600' : 'normal',
                    border: 'none',
                    background: 'none'
                  }}
                  onClick={() => {
                    setActiveTab('regular');
                    navigate('/community?tab=regular', { replace: true });
                  }}
                >
                  Regular ({regularPosts})
                </button>
                <button
                  className={`btn btn-link text-decoration-none flex-grow-1 py-3 ${activeTab === 'featured' ? 'border-bottom border-primary border-2' : ''}`}
                  style={{
                    color: activeTab === 'featured' ? '#1d9bf0' : '#6b7280',
                    fontWeight: activeTab === 'featured' ? '600' : 'normal',
                    border: 'none',
                    background: 'none'
                  }}
                  onClick={() => {
                    setActiveTab('featured');
                    navigate('/community?tab=featured', { replace: true });
                  }}
                >
                  Featured ({featuredPosts})
                </button>
              </div>
            </Card.Body>
          </Card>

          {/* Posts Feed */}
          {sortedPosts.length === 0 ? (
            <Card className="card-twitter text-center py-5">
              <Card.Body>
                <div className="text-twitter-secondary mb-3">
                  <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
                </div>
                <h5 className="text-twitter-dark">No posts found</h5>
                <p className="text-twitter-secondary">
                  {searchTerm ? 'Try adjusting your search terms or filters.' : 'Be the first to post something!'}
                </p>
                <Link to="/create-post">
                  <Button variant="primary" className="btn-twitter mt-3">
                    Create Your First Post
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          ) : (
            sortedPosts.map(post => (
              <div key={post.id} className="mb-3">
                <PostCard 
                  {...post} 
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                />
              </div>
            ))
          )}
        </Col>

        {/* Right Sidebar */}
        <Col lg={3}>
          {/* Quick Actions */}
          <Card className="card-twitter mb-3">
            <Card.Body className="twitter-spacing">
              <h6 className="fw-bold mb-3 text-twitter-dark">Quick Actions</h6>
              <div className="d-grid gap-2">
                <Link to="/create-post">
                  <Button variant="primary" className="btn-twitter w-100">
                    ✨ Create Post
                  </Button>
                </Link>
                {salesPosts > 0 && (
                  <Button 
                    variant={activeTab === 'for-sale' ? 'primary' : 'outline-primary'}
                    className="btn-twitter-outline w-100"
                    onClick={() => {
                      setActiveTab('for-sale');
                      navigate('/community?tab=for-sale', { replace: true });
                    }}
                  >
                    🛒 Browse Sales ({salesPosts})
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Suggested Users */}
          {suggestedUsers.length > 0 && (
            <Card className="card-twitter mb-3">
              <Card.Body className="twitter-spacing">
                <h6 className="fw-bold mb-3 text-twitter-dark">Who to Follow</h6>
                {suggestedUsers.map((suggestedUser) => (
                  <div key={suggestedUser.id} className="d-flex align-items-center justify-content-between mb-3">
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
              </Card.Body>
            </Card>
          )}

          {/* What's Happening */}
          <Card className="card-twitter">
            <Card.Body className="twitter-spacing">
              <h6 className="fw-bold mb-3 text-twitter-dark">What's happening</h6>
              {trendingTopics.slice(0, 3).map((topic) => (
                <div key={topic.tag} className="mb-3">
                  <div className="small text-twitter-secondary">{topic.category.name}</div>
                  <div className="fw-semibold text-twitter-dark">{topic.tag}</div>
                  <div className="small text-twitter-secondary">{topic.count}</div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

