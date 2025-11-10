import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

ForYouPage.route = {
  path: "/for-you",
  menuLabel: "For You",
  parent: "/",
};

// Redirect to community page
export default function ForYouPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/community', { replace: true });
  }, [navigate]);
  
  return null;
}
