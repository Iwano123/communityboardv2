import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import "../../../sass/components/dropdown-menu.scss";

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

const useDropdownMenu = () => {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("DropdownMenu components must be used within DropdownMenu");
  }
  return context;
};

interface DropdownMenuProps {
  children: React.ReactNode;
}

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      // Find trigger element
      if (menuRef.current) {
        triggerRef.current = menuRef.current.querySelector('.dropdown-menu-trigger, .header-avatar-button') as HTMLElement;
      }
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      <div ref={menuRef} className="dropdown-menu-wrapper">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ className, asChild, children, ...props }, ref) => {
    const { open, setOpen, triggerRef } = useDropdownMenu();
    const internalRef = React.useRef<HTMLElement>(null);

    React.useEffect(() => {
      if (internalRef.current) {
        triggerRef.current = internalRef.current;
      }
    }, []);

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ref: (node: HTMLElement) => {
          internalRef.current = node;
          triggerRef.current = node;
          if (typeof ref === 'function') {
            ref(node as any);
          } else if (ref) {
            ref.current = node as any;
          }
        },
        onClick: () => setOpen(!open),
        ...props,
      } as any);
    }

    return (
      <button
        ref={(node) => {
          internalRef.current = node;
          triggerRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn("dropdown-menu-trigger", className)}
        onClick={() => setOpen(!open)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end" | "center";
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = "start", children, ...props }, ref) => {
    const { open, triggerRef } = useDropdownMenu();
    const contentRef = React.useRef<HTMLDivElement>(null);

    // Position the dropdown menu
    React.useEffect(() => {
      if (!open || !contentRef.current || !triggerRef.current) return;

      const content = contentRef.current;
      const trigger = triggerRef.current;
      const rect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Reset positioning
      content.style.position = 'fixed';
      content.style.top = '';
      content.style.left = '';
      content.style.right = '';
      content.style.bottom = '';
      content.style.transform = '';

      // Force a reflow to get accurate dimensions
      content.style.visibility = 'hidden';
      content.style.display = 'block';
      const contentRect = content.getBoundingClientRect();
      const menuWidth = contentRect.width;
      const menuHeight = contentRect.height;
      content.style.visibility = '';
      content.style.display = '';

      let top = rect.bottom + 4; // 4px gap below trigger
      let left = '';
      let right = '';
      let transform = '';

      if (align === 'end') {
        // Align right edge of menu to right edge of trigger
        left = rect.right - menuWidth;
        // Check if menu goes off left edge
        if (left < 0) {
          left = 0.5 * 16; // 0.5rem padding from viewport edge
        }
      } else if (align === 'center') {
        // Center menu on trigger
        left = rect.left + (rect.width / 2) - (menuWidth / 2);
        // Check if menu goes off edges
        if (left < 0) {
          left = 0.5 * 16; // 0.5rem padding from left edge
        } else if (left + menuWidth > viewportWidth) {
          left = viewportWidth - menuWidth - (0.5 * 16); // 0.5rem padding from right edge
        }
      } else {
        // start - align left edge of menu to left edge of trigger
        left = rect.left;
        // Check if menu goes off right edge
        if (left + menuWidth > viewportWidth) {
          left = viewportWidth - menuWidth - (0.5 * 16); // 0.5rem padding from right edge
        }
      }

      // Check if menu goes off bottom edge
      if (top + menuHeight > viewportHeight) {
        // Position above trigger instead
        top = rect.top - menuHeight - 4;
        // Make sure it doesn't go off top edge
        if (top < 0) {
          top = 0.5 * 16; // 0.5rem padding from top edge
        }
      }

      // Apply positioning
      content.style.top = `${top}px`;
      content.style.left = `${left}px`;
      if (transform) content.style.transform = transform;
    }, [open, align]);

    if (!open) return null;

    return (
      <div
        ref={(node) => {
          contentRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn("dropdown-menu-content", `dropdown-menu-content-${align}`, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("dropdown-menu-label", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("dropdown-menu-separator", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, asChild, children, ...props }, ref) => {
    const { setOpen } = useDropdownMenu();

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn("dropdown-menu-item", className, children.props.className),
        onClick: (e: React.MouseEvent) => {
          setOpen(false);
          if (children.props.onClick) {
            children.props.onClick(e);
          }
        },
        ...props,
      } as any);
    }

    return (
      <div
        ref={ref}
        className={cn("dropdown-menu-item", className)}
        onClick={() => setOpen(false)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuItem.displayName = "DropdownMenuItem";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
};

