import React from "react";

interface ModernMicIconProps {
  className?: string;
  size?: number;
  isActive?: boolean;
}

export const ModernMicIcon: React.FC<ModernMicIconProps> = ({
  className = "",
  size = 24,
  isActive = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer glow ring - animated when active */}
      {isActive && (
        <circle
          cx="12"
          cy="12"
          r="11"
          fill="url(#micGradient)"
          opacity="0.3"
          className="animate-pulse"
        />
      )}

      {/* Gradient definition */}
      <defs>
        <linearGradient id="micGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="1" />
          <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
        </linearGradient>
        <linearGradient
          id="micBodyGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="1" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Microphone body - sleek modern design */}
      <path
        d="M12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2Z"
        fill={isActive ? "url(#micBodyGradient)" : "currentColor"}
        stroke={isActive ? "none" : "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
        className="transition-all duration-300"
      />

      {/* Microphone stand - curved modern base */}
      <path
        d="M8 11C8 11 8 14 12 14C16 14 16 11 16 11"
        stroke={isActive ? "url(#micGradient)" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        className="transition-all duration-300"
      />

      {/* Sound waves - animated when active */}
      {isActive ? (
        <>
          <path
            d="M5 9C5 9 4 9 4 12C4 15 5 15 5 15"
            stroke="url(#micGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            className="animate-pulse"
            opacity="0.8"
          />
          <path
            d="M19 9C19 9 20 9 20 12C20 15 19 15 19 15"
            stroke="url(#micGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            className="animate-pulse"
            opacity="0.8"
          />
        </>
      ) : (
        <>
          {/* Decorative accent lines - inactive state */}
          <line
            x1="6"
            y1="9"
            x2="6.5"
            y2="9"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.4"
          />
          <line
            x1="18"
            y1="9"
            x2="17.5"
            y2="9"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.4"
          />
        </>
      )}

      {/* Modern base stand */}
      <path
        d="M10 20L14 20"
        stroke={isActive ? "url(#micGradient)" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        className="transition-all duration-300"
      />
      <path
        d="M11 20L11 22"
        stroke={isActive ? "url(#micGradient)" : "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
        className="transition-all duration-300"
      />
      <path
        d="M13 20L13 22"
        stroke={isActive ? "url(#micGradient)" : "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
        className="transition-all duration-300"
      />
    </svg>
  );
};
