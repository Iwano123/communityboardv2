import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";

interface NavLinkProps {
  to: string;
  icon: string; // Bootstrap icon class
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function NavLink({ to, icon, children, style }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "nav-link-item",
        isActive && "nav-link-active"
      )}
      style={style}
    >
      <i className={`bi ${icon} nav-link-icon`} aria-hidden="true"></i>
      <span>{children}</span>
    </Link>
  );
}

