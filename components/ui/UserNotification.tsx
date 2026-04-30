/**
 * User-Friendly Notification Component
 * Provides toast-style notifications for user feedback
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type NotificationType = "success" | "error" | "info" | "warning";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface UserNotificationProps {
  notification: Notification | null;
  onClose: () => void;
}

export function UserNotification({
  notification,
  onClose,
}: UserNotificationProps) {
  useEffect(() => {
    if (notification) {
      const duration = notification.duration || 5000;
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const icons = {
    success: "ri-checkbox-circle-line",
    error: "ri-error-warning-line",
    info: "ri-information-line",
    warning: "ri-alert-line",
  };

  const colors = {
    success: "bg-green-500/20 border-green-500/50 text-green-400",
    error: "bg-red-500/20 border-red-500/50 text-red-400",
    info: "bg-blue-500/20 border-blue-500/50 text-blue-400",
    warning: "bg-yellow-500/20 border-yellow-500/50 text-yellow-400",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-4 right-4 z-50 min-w-[300px] max-w-[500px] p-4 rounded-lg border ${colors[notification.type]} shadow-lg`}
      >
        <div className="flex items-start gap-3">
          <i className={`${icons[notification.type]} text-xl mt-0.5`}></i>
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
            {notification.message && (
              <p className="text-xs opacity-90">{notification.message}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-current opacity-70 hover:opacity-100 transition-opacity"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = (
    type: NotificationType,
    title: string,
    message?: string,
    duration?: number,
  ) => {
    setNotification({
      id: Date.now().toString(),
      type,
      title,
      message,
      duration,
    });
  };

  const showSuccess = (title: string, message?: string) => {
    showNotification("success", title, message);
  };

  const showError = (title: string, message?: string) => {
    showNotification("error", title, message, 7000); // Errors stay longer
  };

  const showInfo = (title: string, message?: string) => {
    showNotification("info", title, message);
  };

  const showWarning = (title: string, message?: string) => {
    showNotification("warning", title, message);
  };

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearNotification: () => setNotification(null),
  };
}
