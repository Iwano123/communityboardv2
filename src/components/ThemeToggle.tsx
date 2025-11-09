import { cn } from "../lib/utils";
import "../../sass/components/theme-toggle.scss";

interface ThemeToggleProps {
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
  className?: string;
}

export function ThemeToggle({ isDarkMode, setIsDarkMode, className }: ThemeToggleProps) {
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn("theme-toggle", className)}
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <i className="bi bi-sun"></i>
      ) : (
        <i className="bi bi-moon"></i>
      )}
    </button>
  );
}

