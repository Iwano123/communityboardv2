// Custom bell icon component - simple outlined bell
export const BellIcon = ({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {/* Bell top loop/handle */}
      <path d="M12 2a1.5 1.5 0 0 0-1.5 1.5v1" />
      <path d="M12 2a1.5 1.5 0 0 1 1.5 1.5v1" />
      {/* Bell body - curved outline */}
      <path d="M8 5.5c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2 0 6.5 2.5 8.5 2.5 8.5H5.5S8 12 8 5.5z" />
      {/* Clapper - small circle at bottom center */}
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  );
};

