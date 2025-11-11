import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

MarketplacePage.route = {
  path: "/marketplace",
  menuLabel: "Marketplace",
  parent: "/",
};

// Redirect to for-you page (marketplace items are shown there)
export default function MarketplacePage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/for-you', { replace: true });
  }, [navigate]);
  
  return null;
}

