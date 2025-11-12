import { Button, Card, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

const Home = () => {
  const stats = [
    { label: "Active Members", value: "2.4K", icon: "bi-people" },
    { label: "Posts Today", value: "156", icon: "bi-chat-square" },
    { label: "Upcoming Events", value: "24", icon: "bi-file-text" },
    { label: "Items Listed", value: "89", icon: "bi-graph-up" },
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background"></div>
        <div className="hero-radial-gradient"></div>
        <Container className="hero-container">
          <div className="hero-badge">
            <i className="bi bi-stars me-2"></i>
            <span>Your Social Community Platform</span>
          </div>
          <h1 className="hero-title">
            Welcome to
            <span className="hero-title-gradient">Orchid</span>
          </h1>
          <p className="hero-description">
            Share your thoughts, connect with others, discover events, buy and sell in the marketplace, and build your community.
          </p>
          <div className="hero-buttons">
            <Link to="/for-you">
              <Button size="lg" className="hero-btn-primary">
                Explore Orchid
                <i className="bi bi-arrow-right ms-2 hero-icon-hover"></i>
              </Button>
            </Link>
            <Link to="/events">
              <Button size="lg" variant="outline" className="hero-btn-outline">
                Browse Events
                <i className="bi bi-file-earmark-text ms-2 hero-icon-hover"></i>
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <Container>
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <Card 
                key={stat.label} 
                className="stat-card"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card.Body className="text-center p-4">
                  <div className="stat-icon-wrapper">
                    <i className={`bi ${stat.icon} stat-icon`}></i>
                  </div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
};

Home.route = {
  index: true,
  menuLabel: 'Home',
  parent: '/',
};

export default Home;

