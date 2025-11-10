import * as React from "react";
import { cn } from "../../lib/utils";
import "../../../sass/components/badge.scss";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClasses = {
    default: "badge-variant-default",
    secondary: "badge-variant-secondary",
    destructive: "badge-variant-destructive",
    outline: "badge-variant-outline",
  };

  return (
    <div
      className={cn("badge-base", variantClasses[variant], className)}
      {...props}
    />
  );
}

export { Badge };

