/**
 * Loading State Component
 * Consistent loading UI across intelligence pages
 */

"use client";

interface LoadingStateProps {
  message?: string;
  size?: "small" | "medium" | "large";
}

export default function LoadingState({
  message = "Loading...",
  size = "medium",
}: LoadingStateProps) {
  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-16 h-16",
    large: "w-24 h-24",
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div
          className={`${sizeClasses[size]} border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4`}
        ></div>
        <p className="text-[#9ca3af]">{message}</p>
      </div>
    </div>
  );
}
