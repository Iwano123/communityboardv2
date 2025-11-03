import { Card, Row, Col, Badge } from 'react-bootstrap';

FeaturedPostsPage.route = {
  path: '/featured',
  menuLabel: 'Featured',
  parent: '/'
};

export default function FeaturedPostsPage() {
  // Sample featured posts data (like restaurants and businesses)
  const featuredPosts = [
    {
      id: 1,
      title: "Amusement Park Family Event",
      distance: "3.6 km",
      address: "Linköping City, Linköping",
      image: "https://images.unsplash.com/photo-1589197471564-8266ed7f59b5?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      category: "Amusement Park",
      rating: 4.5
    },
    {
      id: 2,
      title: "Market Day",
      distance: "12.1 km",
      address: "Skänninge, Mjölby",
      image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      category: "Market",
      rating: 4.2
    },
    {
      id: 3,
      title: "Sana Duri",
      distance: "7.4 km",
      address: "Saab Arena, Linköping",
      image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      category: "Festival",
      rating: 4.8
    },
    {
      id: 4,
      title: "Sunday Church Service",
      distance: "7.4 km",
      address: "Berga Kyrka, Berga",
      image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      category: "Church",
      rating: 4.8
    },
    {
      id: 5,
      title: "Fall Harvest Market: Where Community Meets tradition",
      distance: "3.1 km",
      address: "Hospitaltorget, Linköping",
      image: "https://images.unsplash.com/photo-1567306295427-94503f8300d7?q=80&w=1142&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      category: "Market",
      rating: 4.0
    }
  ];

  return <>
    <div className="container mt-4">
      <Row>
        <Col lg={8} className="mx-auto">
          <div className="featured-posts-grid">
            {featuredPosts.map((post) => (
              <Card key={post.id} className="featured-post-card-desktop mb-3">
                <Row className="g-0">
                  <Col md={4}>
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="img-fluid h-100"
                      style={{ objectFit: 'cover' }}
                    />
                  </Col>
                  <Col md={8}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title fw-bold mb-0">{post.title}</h5>
                        <Badge bg="primary">{post.category}</Badge>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <span className="text-muted me-3">📍 {post.distance}</span>
                        <div className="rating">
                          <span className="text-warning">⭐</span>
                          <span className="small text-muted ms-1">{post.rating}</span>
                        </div>
                      </div>
                      <p className="card-text text-muted small mb-0">{post.address}</p>
                    </Card.Body>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        </Col>
      </Row>
    </div>
  </>;
};