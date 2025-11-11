import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";

interface NavLinkProps {
  to: string;
  icon: string; // Bootstrap icon class
  children: React.ReactNode;
}

export function NavLink({ to, icon, children }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "nav-link-item",
        isActive && "nav-link-active"
      )}
    >
      <i className={`bi ${icon} nav-link-icon`} aria-hidden="true"></i>
      <span>{children}</span>
    </Link>
  );
}

