import React from "react";

interface ModernSendIconProps {
  className?: string;
  size?: number;
  isActive?: boolean;
}

export const ModernSendIcon: React.FC<ModernSendIconProps> = ({
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
      {/* Gradient definition */}
      <defs>
        <linearGradient id="sendGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="1" />
          <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
        </linearGradient>
        <linearGradient
          id="sendBodyGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="1" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Outer glow effect when active */}
      {isActive && (
        <circle
          cx="12"
          cy="12"
          r="11"
          fill="url(#sendGradient)"
          opacity="0.2"
          className="animate-pulse"
        />
      )}

      {/* Modern sleek arrow/paper plane - fluid curved design */}
      <g>
        {/* Main arrow body - sleek and modern */}
        <path
          d="M 2 12 L 20 4 L 18 20 Z"
          fill={isActive ? "url(#sendBodyGradient)" : "currentColor"}
          stroke={isActive ? "none" : "currentColor"}
          strokeWidth={isActive ? "0" : "1.5"}
          strokeLinejoin="round"
          className="transition-all duration-300"
        />

        {/* Inner accent line for depth */}
        <path
          d="M 4 12 L 16 6.5"
          stroke={isActive ? "rgba(255,255,255,0.3)" : "currentColor"}
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          opacity={isActive ? "1" : "0.2"}
          className="transition-all duration-300"
        />

        {/* Speed lines - animated when active */}
        {isActive ? (
          <>
            <line
              x1="0"
              y1="10"
              x2="-2"
              y2="8"
              stroke="url(#sendGradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.8"
              className="animate-pulse"
            />
            <line
              x1="0"
              y1="12"
              x2="-2"
              y2="12"
              stroke="url(#sendGradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.6"
              className="animate-pulse"
              style={{ animationDelay: "0.1s" }}
            />
            <line
              x1="0"
              y1="14"
              x2="-2"
              y2="16"
              stroke="url(#sendGradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.4"
              className="animate-pulse"
              style={{ animationDelay: "0.2s" }}
            />
          </>
        ) : (
          <>
            {/* Subtle accent dots - inactive state */}
            <circle cx="1" cy="11" r="0.5" fill="currentColor" opacity="0.2" />
            <circle cx="1" cy="13" r="0.5" fill="currentColor" opacity="0.2" />
          </>
        )}
      </g>
    </svg>
  );
};
