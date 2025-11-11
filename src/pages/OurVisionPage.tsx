import { Card, Container, Row, Col } from 'react-bootstrap';

OurVisionPage.route = {
  path: '/vision',
  menuLabel: 'Our Vision',
  parent: '/'
};

export default function OurVisionPage() {
  return (
    <Container className="mt-4">
      <Row>
        <Col lg={8} className="mx-auto">
          <Card>
            <Card.Body>
              <h1 className="card-title">Our Vision</h1>
              <p className="card-text">
                We envision a world where communities are connected, informed, and engaged. 
                Our platform serves as a digital town square where neighbors can:
              </p>
              <ul>
                <li>Share local news and events</li>
                <li>Connect with community services</li>
                <li>Promote local businesses</li>
                <li>Build stronger neighborhood relationships</li>
              </ul>
              <p className="card-text">
                Together, we're building a more connected and vibrant community.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
