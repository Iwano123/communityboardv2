import { NavLink } from "./NavLink";
import type { User } from "../interfaces/BulletinBoard";
import "../../sass/components/navigation.scss";

interface NavigationProps {
  user: User | null;
}

export function Navigation({ user }: NavigationProps) {
  const isAdmin = user?.role === "admin";

  return (
    <nav className="navigation">
      <NavLink to="/" icon="bi-house-door">Home</NavLink>
      <NavLink to="/for-you" icon="bi-stars"><span style={{ whiteSpace: 'nowrap' }}>For You</span></NavLink>
      <NavLink to="/events" icon="bi-calendar">Events</NavLink>
      <NavLink to="/messages" icon="bi-chat-square">Messages</NavLink>
      <NavLink to="/profile" icon="bi-person">Profile</NavLink>
      {isAdmin && <NavLink to="/admin" icon="bi-shield-check">Admin</NavLink>}
      <NavLink to="/create-post" icon="bi-plus-circle" style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>Create Post</NavLink>
    </nav>
  );
}

