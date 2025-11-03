import { Card, Container, Row, Col } from 'react-bootstrap';

AboutPage.route = {
  path: '/about',
  menuLabel: 'About',
  parent: '/'
};

export default function AboutPage() {
  return (
    <Container className="mt-4">
      <Row>
        <Col lg={8} className="mx-auto">
          <Card>
            <Card.Body>
              <h1 className="card-title">About Community Board</h1>
              <p className="card-text">
                Welcome to our community bulletin board! This platform connects neighbors, 
                promotes local events, and helps build stronger communities.
              </p>
              <p className="card-text">
                Whether you're looking for local services, community events, or want to 
                share something with your neighbors, this is the place to be.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
