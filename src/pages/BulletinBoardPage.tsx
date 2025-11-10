// This page now redirects to CommunityFeedPage
// Keeping for backwards compatibility
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

BulletinBoardPage.route = {
  path: '/community-old',
  menuLabel: 'Community (Old)',
  parent: '/'
};

export default function BulletinBoardPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/community', { replace: true });
  }, [navigate]);
  
  return null;
}
