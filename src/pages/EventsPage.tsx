import { Container } from "react-bootstrap";

EventsPage.route = {
  path: "/events",
  menuLabel: "Events",
  parent: "/",
};

export default function EventsPage() {
  return (
    <Container className="mt-5">
      <h1>Events</h1>
      <p>Discover and join community events.</p>
    </Container>
  );
}

