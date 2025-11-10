import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

MarketplacePage.route = {
  path: "/marketplace",
  menuLabel: "Marketplace",
  parent: "/",
};

// Redirect to community page with for-sale filter
export default function MarketplacePage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/community?tab=for-sale', { replace: true });
  }, [navigate]);
  
  return null;
}

