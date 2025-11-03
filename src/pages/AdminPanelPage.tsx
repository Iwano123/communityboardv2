import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert } from 'react-bootstrap';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Post {
  id: number;
  title: string;
  author_name: string;
  category_name: string;
}

AdminPanelPage.route = {
  path: '/admin',
  menuLabel: 'Admin Panel',
  parent: '/'
};

export default function AdminPanelPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, postsResponse] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/posts')
        ]);

        if (usersResponse.ok && postsResponse.ok) {
          const usersData = await usersResponse.json();
          const postsData = await postsResponse.json();
          setUsers(usersData);
          setPosts(postsData);
        } else {
          setError('Failed to load data');
        }
      } catch (err) {
        setError('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setUsers(users.filter(user => user.id !== userId));
        }
      } catch (err) {
        console.error('Error deleting user:', err);
      }
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const response = await fetch(`/api/posts/${postId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setPosts(posts.filter(post => post.id !== postId));
        }
      } catch (err) {
        console.error('Error deleting post:', err);
      }
    }
  };

  if (loading) {
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

          <Row>
            <Col lg={6} className="mb-4">
              <Card className="card-twitter">
                <Card.Header className="border-0">
                  <h5 className="text-twitter-dark mb-0">Users</h5>
                </Card.Header>
                <Card.Body className="twitter-spacing">
                  <div className="table-responsive">
                    <Table hover>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => (
                          <tr key={user.id}>
                            <td>{user.firstName} {user.lastName}</td>
                            <td>{user.email}</td>
                            <td>
                              <Badge bg={user.role === 'admin' ? 'danger' : 'primary'}>
                                {user.role}
                              </Badge>
                            </td>
                            <td>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6} className="mb-4">
              <Card className="card-twitter">
                <Card.Header className="border-0">
                  <h5 className="text-twitter-dark mb-0">Posts</h5>
                </Card.Header>
                <Card.Body className="twitter-spacing">
                  <div className="table-responsive">
                    <Table hover>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Author</th>
                          <th>Category</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {posts.map(post => (
                          <tr key={post.id}>
                            <td>{post.title}</td>
                            <td>{post.author_name}</td>
                            <td>{post.category_name}</td>
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
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
}