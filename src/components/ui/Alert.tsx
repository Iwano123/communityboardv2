import * as React from "react";
import { cn } from "../../lib/utils";
import "../../../sass/components/alert.scss";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variantClasses = {
      default: "alert-variant-default",
      destructive: "alert-variant-destructive",
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn("alert-base", variantClasses[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("alert-title", className)}
      {...props}
    />
  )
);

AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("alert-description", className)}
      {...props}
    />
  )
);

AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };

