/**
 * Error Display Component
 * Standardized error display with retry functionality
 */

"use client";

import { motion } from "framer-motion";

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
  showHomeLink?: boolean;
  variant?: "page" | "inline" | "card";
  icon?: string;
  className?: string;
}

export default function ErrorDisplay({
  title = "Something went wrong",
  message,
  onRetry,
  onBack,
  showHomeLink = true,
  variant = "page",
  icon = "ri-error-warning-line",
  className = "",
}: ErrorDisplayProps) {
  if (variant === "inline") {
    return (
      <div
        className={`flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg ${className}`}
      >
        <i className={`${icon} text-red-400 text-lg flex-shrink-0`}></i>
        <div className="flex-1 min-w-0">
          <p className="text-red-400 text-sm">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-1 flex-shrink-0"
          >
            <i className="ri-refresh-line"></i>
            Retry
          </button>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-xl p-6 text-center ${className}`}
      >
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className={`${icon} text-3xl text-red-400`}></i>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-[#9ca3af] text-sm mb-6">{message}</p>
        <div className="flex items-center justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <i className="ri-refresh-line"></i>
              Try Again
            </button>
          )}
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm font-medium transition-colors hover:bg-white/10"
            >
              Go Back
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // Full page error
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-[60vh] flex items-center justify-center p-8 ${className}`}
    >
      <div className="text-center max-w-md">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <i className={`${icon} text-5xl text-red-400`}></i>
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
        <p className="text-[#9ca3af] mb-8 leading-relaxed">{message}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              <i className="ri-refresh-line"></i>
              Try Again
            </button>
          )}
          {onBack && (
            <button
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg font-medium transition-colors hover:bg-white/10 flex items-center justify-center gap-2"
            >
              <i className="ri-arrow-left-line"></i>
              Go Back
            </button>
          )}
          {showHomeLink && (
            <a
              href="/"
              className="w-full sm:w-auto px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg font-medium transition-colors hover:bg-white/10 flex items-center justify-center gap-2"
            >
              <i className="ri-home-line"></i>
              Home
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Toast-style error (for API errors)
export function ApiError({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3"
    >
      <i className="ri-error-warning-fill text-red-400 text-lg mt-0.5"></i>
      <div className="flex-1 min-w-0">
        <p className="text-red-400 text-sm font-medium mb-1">Request Failed</p>
        <p className="text-[#9ca3af] text-xs">{message}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-red-400 hover:text-red-300 p-1"
            aria-label="Retry"
          >
            <i className="ri-refresh-line"></i>
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-[#6b7280] hover:text-white p-1"
            aria-label="Dismiss"
          >
            <i className="ri-close-line"></i>
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Form field error
export function FieldError({
  message,
  className = "",
}: {
  message: string;
  className?: string;
}) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-red-400 text-xs mt-1 flex items-center gap-1 ${className}`}
    >
      <i className="ri-error-warning-fill"></i>
      {message}
    </motion.p>
  );
}
