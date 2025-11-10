import { useLoaderData, useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Badge } from 'react-bootstrap';
import { useStateContext } from '../utils/useStateObject';
import Select from '../parts/Select';
import PostCard from '../parts/PostCard';
import postsLoader from '../utils/postsLoader';
import { getHelpers } from '../utils/BulletinBoardHelpers';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Post, Category, User } from '../interfaces/BulletinBoard';

ForYouPage.route = {
  path: "/for-you",
  menuLabel: "For You",
  parent: "/",
  loader: postsLoader
};

type FeedType = 'all' | 'for-sale' | 'regular' | 'featured';

export default function ForYouPage() {
  const loaderData = useLoaderData() as { posts: Post[] } | undefined;
  const rawPosts = loaderData?.posts || [];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('ForYouPage mounted, rawPosts:', rawPosts.length);
  }, []);
  
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
  const categoriesWithCounts = categories.map(cat => ({
    ...cat,
    count: posts.filter(p => p.category_id === cat.id).length
  }));

  // Filter posts based on active tab
  const filteredByTab = posts.filter(post => {
    if (activeTab === 'for-sale') {
      return post.category_name?.toLowerCase().includes('sale') || 
             post.title?.toLowerCase().includes('försäljning') ||
             post.title?.toLowerCase().includes('säljes');
    }
    if (activeTab === 'regular') {
      return !post.category_name?.toLowerCase().includes('sale') && 
             !post.title?.toLowerCase().includes('försäljning') &&
             !post.title?.toLowerCase().includes('säljes');
    }
    if (activeTab === 'featured') {
      return post.featured === 1 || post.featured === true;
    }
    return true; // 'all' shows everything
  });

  // Filter posts based on category
  const filteredByCategory = categoryChoice === 'All' 
    ? filteredByTab 
    : filteredByTab.filter(post => post.category_name === categoryChoice);

  // Filter posts based on search term
  const filteredBySearch = searchTerm 
    ? filteredByCategory.filter(post => 
        post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredByCategory;

  // Filter posts to show only user's posts if enabled
  const filteredPosts = showOnlyMyPosts && user
    ? filteredBySearch.filter(post => post.author_id === user.id)
    : filteredBySearch;

  // Sort posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortChoice) {
      case 'Newest first':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      case 'Oldest first':
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      case 'Most views':
        return (b.views || 0) - (a.views || 0);
      case 'Most comments':
        return (b.comments_count || 0) - (a.comments_count || 0);
      default:
        return 0;
    }
  });

  // Count posts by type
  const salesPosts = posts.filter(p => 
    p.category_name?.toLowerCase().includes('sale') || 
    p.title?.toLowerCase().includes('försäljning') ||
    p.title?.toLowerCase().includes('säljes')
  ).length;

  const regularPosts = posts.filter(p => 
    !p.category_name?.toLowerCase().includes('sale') && 
    !p.title?.toLowerCase().includes('försäljning') &&
    !p.title?.toLowerCase().includes('säljes')
  ).length;

  const featuredPosts = posts.filter(p => p.featured === 1 || p.featured === true).length;

  // Get suggested users (users who have posted but not the current user)
  const suggestedUsers = users
    .filter(u => u.id !== user?.id && posts.some(p => p.author_id === u.id))
    .slice(0, 5);

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        {/* Main Feed */}
        <Col lg={6}>
          <Card className="card-twitter mb-3">
            <Card.Body className="twitter-spacing">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold mb-0 text-twitter-dark">For You</h4>
              </div>

              {/* Tabs */}
              <div className="d-flex gap-2 mb-3 flex-wrap">
                <Button
                  variant={activeTab === 'all' ? 'primary' : 'outline-primary'}
                  size="sm"
                  className="btn-twitter"
                  onClick={() => {
                    setActiveTab('all');
                    navigate('/for-you', { replace: true });
                  }}
                >
                  All ({posts.length})
                </Button>
                <Button
                  variant={activeTab === 'for-sale' ? 'primary' : 'outline-primary'}
                  size="sm"
                  className="btn-twitter-outline"
                  onClick={() => {
                    setActiveTab('for-sale');
                    navigate('/for-you?tab=for-sale', { replace: true });
                  }}
                >
                  For Sale ({salesPosts})
                </Button>
                <Button
                  variant={activeTab === 'regular' ? 'primary' : 'outline-primary'}
                  size="sm"
                  className="btn-twitter-outline"
                  onClick={() => {
                    setActiveTab('regular');
                    navigate('/for-you?tab=regular', { replace: true });
                  }}
                >
                  Regular ({regularPosts})
                </Button>
                {featuredPosts > 0 && (
                  <Button
                    variant={activeTab === 'featured' ? 'primary' : 'outline-primary'}
                    size="sm"
                    className="btn-twitter-outline"
                    onClick={() => {
                      setActiveTab('featured');
                      navigate('/for-you?tab=featured', { replace: true });
                    }}
                  >
                    ⭐ Featured ({featuredPosts})
                  </Button>
                )}
              </div>

              {/* Filters */}
              <div className="d-flex gap-2 mb-3 flex-wrap">
                <Select
                  value={categoryChoice}
                  onChange={(e) => setState({ categoryChoice: e.target.value })}
                  options={['All', ...categoriesWithCounts.map(c => `${c.name} (${c.count})`)]}
                  className="form-select-twitter"
                />
                <Select
                  value={sortChoice}
                  onChange={(e) => setState({ sortChoice: e.target.value })}
                  options={sortOptions}
                  className="form-select-twitter"
                />
                <Form.Control
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setState({ searchTerm: e.target.value })}
                  className="form-control-twitter"
                />
              </div>

              {/* Show only my posts toggle */}
              {user && (
                <Form.Check
                  type="checkbox"
                  label="Show only my posts"
                  checked={showOnlyMyPosts}
                  onChange={(e) => setState({ showOnlyMyPosts: e.target.checked })}
                  className="mb-3"
                />
              )}

              {/* Posts */}
              {sortedPosts.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-twitter-secondary">No posts found. Be the first to post!</p>
                  <Link to="/create-post">
                    <Button variant="primary" className="btn-twitter mt-2">
                      Create Post
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {sortedPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
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
                      navigate('/for-you?tab=for-sale', { replace: true });
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
                <h6 className="fw-bold mb-3 text-twitter-dark">Suggested Users</h6>
                <div className="d-flex flex-column gap-2">
                  {suggestedUsers.map((suggestedUser) => (
                    <Link
                      key={suggestedUser.id}
                      to={`/profile?user=${suggestedUser.id}`}
                      className="text-decoration-none"
                    >
                      <div className="d-flex align-items-center gap-2 p-2 rounded hover-bg">
                        <div className="avatar-circle bg-primary text-white">
                          {suggestedUser.firstName?.[0]}{suggestedUser.lastName?.[0]}
                        </div>
                        <div>
                          <div className="fw-semibold text-twitter-dark">
                            {suggestedUser.firstName} {suggestedUser.lastName}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Categories */}
          {categoriesWithCounts.length > 0 && (
            <Card className="card-twitter mb-3">
              <Card.Body className="twitter-spacing">
                <h6 className="fw-bold mb-3 text-twitter-dark">Categories</h6>
                <div className="d-flex flex-wrap gap-2">
                  {categoriesWithCounts.map((category) => (
                    <Badge
                      key={category.id}
                      bg="secondary"
                      className="cursor-pointer"
                      onClick={() => setState({ categoryChoice: category.name })}
                      style={{
                        backgroundColor: category.color || '#6c757d',
                        cursor: 'pointer'
                      }}
                    >
                      {category.name} ({category.count})
                    </Badge>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}
