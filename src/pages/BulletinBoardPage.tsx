import { useLoaderData, useNavigate } from 'react-router-dom';
import { Row, Col, Form, Button, Card } from 'react-bootstrap';
import { useStateContext } from '../utils/useStateObject';
import Select from '../parts/Select';
import PostCard from '../parts/PostCard';
import postsLoader from '../utils/postsLoader';
import { getHelpers } from '../utils/BulletinBoardHelpers';
import { useState, useEffect } from 'react';
import type { Post, Category, User } from '../interfaces/BulletinBoard';

BulletinBoardPage.route = {
  index: true,
  menuLabel: 'Home',
  parent: '/',
  loader: postsLoader
};

export default function BulletinBoardPage() {
  const rawPosts = (useLoaderData() as { posts: Post[] }).posts;
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, usersResponse] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/users')
        ]);

        const categoriesData: Category[] = await categoriesResponse.json();
        const usersData: User[] = await usersResponse.json();

        setCategories(categoriesData);

        // Join posts with categories and users
        const joinedPosts: Post[] = rawPosts.map((post: any) => {
          const category = categoriesData.find((cat: Category) => cat.id === post.category_id);
          const author = usersData.find((user: User) => user.id === post.author_id);
          
          return {
            ...post,
            category_name: category?.name || 'Unknown',
            category_color: category?.color || '#007bff',
            author_name: author ? `${author.firstName} ${author.lastName}` : 'Unknown',
            author_email: author?.email || '',
            comments_count: 0, // Default value
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

  // get state object and setter from the outlet context
  const context = useStateContext();
  const [
    { categoryChoice, sortChoice, searchTerm, showOnlyMyPosts },
    setState
  ] = context || [{ categoryChoice: 'All', sortChoice: 'Newest first', searchTerm: '', showOnlyMyPosts: false }, () => {}];

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
        // Remove the post from the local state
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

  // get the chosen category without the post count part
  const category = categoryChoice.split(' (')[0];
  // get the key and order to from the chosen sort option
  const sortOption = sortOptions.find(x => x.description === sortChoice);
  const sortKey = sortOption?.key || 'created_at';
  const sortOrder = sortOption?.order || -1;

  // Filter posts based on search term
  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchTerm || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = category === 'All' || post.category_name === category;
    
    return matchesSearch && matchesCategory;
  });

  return <>
    <div className="container mt-4">
      <Row>
        {/* Left Sidebar - Twitter-like */}
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

          {/* Trending Categories */}
          <Card className="card-twitter">
            <Card.Body className="twitter-spacing">
              <h6 className="fw-bold mb-3 text-twitter-dark">Trending Categories</h6>
              {categoriesWithCounts.slice(1, 6).map((cat, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-twitter-secondary">{cat.split(' (')[0]}</span>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Main Feed - Twitter-like */}
        <Col lg={6}>
          {filteredPosts.length === 0 ? (
            <Card className="card-twitter text-center py-5">
              <Card.Body>
                <div className="text-twitter-secondary mb-3">
                  <i className="bi bi-chat-square-text" style={{ fontSize: '3rem' }}></i>
                </div>
                <h5 className="text-twitter-dark">No posts found</h5>
                <p className="text-twitter-secondary">
                  {searchTerm ? 'Try adjusting your search terms or filters.' : 'Be the first to post something!'}
                </p>
              </Card.Body>
            </Card>
          ) : (
            filteredPosts
              .sort((a, b) => {
                if (sortKey === 'created_at') {
                  const dateA = new Date(a.created_at);
                  const dateB = new Date(b.created_at);
                  return (dateA > dateB ? 1 : -1) * sortOrder;
                }
                const valueA = a[sortKey as keyof Post] as string;
                const valueB = b[sortKey as keyof Post] as string;
                return (valueA > valueB ? 1 : -1) * sortOrder;
              })
              .map(post => (
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

        {/* Right Sidebar - Twitter-like */}
        <Col lg={3}>
          <Card className="card-twitter mb-3">
            <Card.Body className="twitter-spacing">
              <h6 className="fw-bold mb-3 text-twitter-dark">What's happening</h6>
              <div className="mb-3">
                <div className="small text-twitter-secondary">Community Events</div>
                <div className="fw-semibold text-twitter-dark">Garden Meeting</div>
                <div className="small text-twitter-secondary">2.1K posts</div>
              </div>
              <div className="mb-3">
                <div className="small text-twitter-secondary">Jobs</div>
                <div className="fw-semibold text-twitter-dark">Web Developer</div>
                <div className="small text-twitter-secondary">156 posts</div>
              </div>
              <div className="mb-3">
                <div className="small text-twitter-secondary">For Sale</div>
                <div className="fw-semibold text-twitter-dark">Vintage Bicycle</div>
                <div className="small text-twitter-secondary">89 posts</div>
              </div>
            </Card.Body>
          </Card>

          <Card className="card-twitter">
            <Card.Body className="twitter-spacing">
              <h6 className="fw-bold mb-3 text-twitter-dark">Who to follow</h6>
              <div className="d-flex align-items-center mb-3">
                <div className="avatar-twitter me-2" style={{ backgroundColor: '#1d9bf0' }}>J</div>
                <div className="flex-grow-1">
                  <div className="fw-semibold small text-twitter-dark">John Doe</div>
                  <div className="text-twitter-secondary small">@johndoe</div>
                </div>
                <Button variant="outline-primary" size="sm" className="btn-twitter-outline">
                  Follow
                </Button>
              </div>
              <div className="d-flex align-items-center mb-3">
                <div className="avatar-twitter me-2" style={{ backgroundColor: '#17a2b8' }}>J</div>
                <div className="flex-grow-1">
                  <div className="fw-semibold small text-twitter-dark">Jane Smith</div>
                  <div className="text-twitter-secondary small">@janesmith</div>
                </div>
                <Button variant="outline-primary" size="sm" className="btn-twitter-outline">
                  Follow
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  </>;
};