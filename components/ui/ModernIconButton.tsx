"use client";

import React from "react";
import { ModernMicIcon } from "../icons/ModernMicIcon";
import { ModernSendIcon } from "../icons/ModernSendIcon";

interface ModernIconButtonProps {
  type: "mic" | "send";
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: 18,
  md: 22,
  lg: 26,
};

export const ModernIconButton: React.FC<ModernIconButtonProps> = ({
  type,
  onClick,
  isActive = false,
  disabled = false,
  size = "md",
  className = "",
}) => {
  const iconSize = sizeMap[size];

  const baseStyles = `
    relative
    rounded-2xl
    p-3
    transition-all
    duration-300
    ease-out
    backdrop-blur-sm
    border
    border-transparent
    group
    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95"}
    ${
      isActive
        ? "bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border-indigo-500/30 shadow-lg shadow-purple-500/20"
        : "bg-slate-800/50 hover:bg-slate-700/60 border-slate-700/50 hover:border-slate-600/50"
    }
  `;

  const iconColor = isActive
    ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
    : "text-slate-300 group-hover:text-slate-100";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${className}`}
      aria-label={type === "mic" ? "Voice input" : "Send message"}
    >
      {/* Glow effect when active */}
      {isActive && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
      )}

      {/* Icon */}
      <div className="relative z-10 flex items-center justify-center">
        {type === "mic" ? (
          <ModernMicIcon
            size={iconSize}
            isActive={isActive}
            className={iconColor}
          />
        ) : (
          <ModernSendIcon
            size={iconSize}
            isActive={isActive}
            className={iconColor}
          />
        )}
      </div>

      {/* Hover shimmer effect */}
      {!disabled && !isActive && (
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full"
          style={{ transition: "transform 0.6s ease-in-out" }}
        />
      )}
    </button>
  );
};
