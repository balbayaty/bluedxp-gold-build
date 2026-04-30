/**
 * Proposal User Feedback Component
 * Provides toast notifications, success messages, and error handling
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createContext, useContext } from "react";

// ============================================================================
// TYPES
// ============================================================================

type FeedbackType = "success" | "error" | "warning" | "info";

interface FeedbackMessage {
  id: string;
  type: FeedbackType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// CONTEXT
// ============================================================================

interface FeedbackContextType {
  showFeedback: (
    type: FeedbackType,
    title: string,
    message: string,
    duration?: number,
    action?: FeedbackMessage["action"],
  ) => void;
  showSuccess: (title: string, message: string, duration?: number) => void;
  showError: (title: string, message: string, duration?: number) => void;
  showWarning: (title: string, message: string, duration?: number) => void;
  showInfo: (title: string, message: string, duration?: number) => void;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return context;
};

// ============================================================================
// PROVIDER
// ============================================================================

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);

  const showFeedback = (
    type: FeedbackType,
    title: string,
    message: string,
    duration = 5000,
    action?: FeedbackMessage["action"],
  ) => {
    const id = `feedback-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const newMessage: FeedbackMessage = {
      id,
      type,
      title,
      message,
      duration,
      action,
    };

    setMessages((prev) => [...prev, newMessage]);

    if (duration > 0) {
      setTimeout(() => {
        removeMessage(id);
      }, duration);
    }
  };

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const showSuccess = (title: string, message: string, duration?: number) => {
    showFeedback("success", title, message, duration);
  };

  const showError = (title: string, message: string, duration?: number) => {
    showFeedback("error", title, message, duration || 7000);
  };

  const showWarning = (title: string, message: string, duration?: number) => {
    showFeedback("warning", title, message, duration);
  };

  const showInfo = (title: string, message: string, duration?: number) => {
    showFeedback("info", title, message, duration);
  };

  const getIcon = (type: FeedbackType) => {
    switch (type) {
      case "success":
        return "ri-checkbox-circle-fill";
      case "error":
        return "ri-error-warning-fill";
      case "warning":
        return "ri-alert-fill";
      case "info":
        return "ri-information-fill";
    }
  };

  const getColorClasses = (type: FeedbackType) => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200";
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200";
      case "info":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200";
    }
  };

  return (
    <FeedbackContext.Provider
      value={{ showFeedback, showSuccess, showError, showWarning, showInfo }}
    >
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, x: 300, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.95 }}
              className={`p-4 rounded-lg border shadow-lg ${getColorClasses(message.type)}`}
            >
              <div className="flex items-start gap-3">
                <i
                  className={`${getIcon(message.type)} text-xl flex-shrink-0 mt-0.5`}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold mb-1">{message.title}</h4>
                  <p className="text-sm">{message.message}</p>
                  {message.action && (
                    <button
                      onClick={() => {
                        message.action?.onClick();
                        removeMessage(message.id);
                      }}
                      className="mt-2 text-sm font-medium underline hover:no-underline"
                    >
                      {message.action.label}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => removeMessage(message.id)}
                  className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
                >
                  <i className="ri-close-line" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </FeedbackContext.Provider>
  );
}
