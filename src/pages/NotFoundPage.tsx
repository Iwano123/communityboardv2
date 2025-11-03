import { Card, Container, Row, Col } from 'react-bootstrap';

NotFoundPage.route = {
  path: '*',
  parent: '/'
};

export default function NotFoundPage() {
  return (
    <Container className="mt-4">
      <Row>
        <Col lg={8} className="mx-auto">
          <Card>
            <Card.Body className="text-center">
              <h1 className="card-title">404 - Page Not Found</h1>
              <p className="card-text">
                Sorry, the page you're looking for doesn't exist.
              </p>
              <a href="/" className="btn btn-primary">Go Home</a>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
