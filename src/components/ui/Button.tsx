import * as React from "react";
import { cn } from "../../lib/utils";
import "../../../sass/components/button.scss";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
    const variantClasses = {
      default: "btn-variant-default",
      destructive: "btn-variant-destructive",
      outline: "btn-variant-outline",
      secondary: "btn-variant-secondary",
      ghost: "btn-variant-ghost",
      link: "btn-variant-link",
    };

    const sizeClasses = {
      default: "btn-size-default",
      sm: "btn-size-sm",
      lg: "btn-size-lg",
      icon: "btn-size-icon",
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn(
          "btn-base",
          variantClasses[variant],
          sizeClasses[size],
          className,
          children.props.className
        ),
        ...props,
      } as any);
    }

    return (
      <button
        ref={ref}
        className={cn(
          "btn-base",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };

