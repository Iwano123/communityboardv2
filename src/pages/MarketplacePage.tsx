import { Container } from "react-bootstrap";

MarketplacePage.route = {
  path: "/marketplace",
  menuLabel: "Marketplace",
  parent: "/",
};

export default function MarketplacePage() {
  return (
    <Container className="mt-5">
      <h1>Marketplace</h1>
      <p>Buy and sell items in the community marketplace.</p>
    </Container>
  );
}

