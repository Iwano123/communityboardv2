import type Route from './interfaces/Route.ts';
import { createElement } from 'react';

// page components
import AboutPage from './pages/AboutPage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';
import OurVisionPage from './pages/OurVisionPage.tsx';
import BulletinBoardPage from './pages/BulletinBoardPage.tsx';
import FeaturedPostsPage from './pages/FeaturedPostsPage.tsx';
import PostDetailsPage from './pages/PostDetailsPage.tsx';
import CreatePostPage from './pages/CreatePostPage.tsx';
import EditPostPage from './pages/EditPostPage.tsx';
import AdminPanelPage from './pages/AdminPanelPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';

export default [
  AboutPage,
  NotFoundPage,
  OurVisionPage,
  BulletinBoardPage,
  FeaturedPostsPage,
  PostDetailsPage,
  CreatePostPage,
  EditPostPage,
  AdminPanelPage,
  LoginPage,
  RegisterPage,
  ProfilePage
]
  // map the route property of each page component to a Route
  .map(x => {
    const route = x.route;
    const baseRoute: any = {
      element: createElement(x)
    };

    // Add menuLabel if it exists
    if ('menuLabel' in route && route.menuLabel) {
      baseRoute.menuLabel = route.menuLabel;
    }

    // Add loader if it exists
    if ('loader' in route && route.loader) {
      baseRoute.loader = route.loader;
    }

    if ('index' in route && route.index === true) {
      baseRoute.index = true;
    } else if ('path' in route && route.path) {
      baseRoute.path = route.path;
    }

    return baseRoute as Route;
  });