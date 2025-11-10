import { Container } from "react-bootstrap";

ForYouPage.route = {
  path: "/for-you",
  menuLabel: "For You",
  parent: "/",
};

export default function ForYouPage() {
  return (
    <Container className="mt-5">
      <h1>For You</h1>
      <p>Personalized content and recommendations for you.</p>
    </Container>
  );
}

