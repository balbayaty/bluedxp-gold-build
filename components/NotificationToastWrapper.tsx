"use client";

/**
 * Notification Toast Wrapper
 * Displays subtle, non-intrusive toast notifications for CRITICAL alerts only
 * Regular notifications should be checked in the notification center
 */

import { useEffect, useState, useCallback } from "react";
import { useNotification } from "@/lib/services/notifications/useNotification";
import { motion, AnimatePresence } from "framer-motion";
import type { Notification } from "@/lib/services/notifications/notificationService";

interface NotificationToastWrapperProps {
  userId?: string;
  tenantId?: string;
}

export default function NotificationToastWrapper({
  userId,
  tenantId,
}: NotificationToastWrapperProps) {
  const [toastNotifications, setToastNotifications] = useState<Notification[]>(
    [],
  );
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const notificationData = useNotification({
    userId,
    tenantId,
    autoRefresh: true,
    refreshInterval: 30000, // Refresh every 30s
  });

  // Only show CRITICAL notifications as toasts - much more selective
  useEffect(() => {
    if (!notificationData?.notifications) return;

    const notifications = notificationData.notifications.filter((n) => {
      // Only show critical priority notifications
      if (n.dismissed || n.read) return false;
      if (dismissedIds.has(n.id)) return false;
      // ONLY critical priority - nothing else
      if (n.priority === "critical") return true;
      // Also allow critical errors
      if (n.type === "error" && n.priority === "critical") return true;
      return false;
    });

    // Only show the 1 most recent critical notification at a time
    const recentNotifications = notifications
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 1); // Only 1 toast at a time

    setToastNotifications(recentNotifications);
  }, [notificationData?.notifications, dismissedIds]);

  const handleDismiss = useCallback(
    (id: string) => {
      setDismissedIds((prev) => new Set(prev).add(id));
      setToastNotifications((prev) => prev.filter((n) => n.id !== id));
      // Also dismiss in the service
      if (notificationData?.dismiss) {
        notificationData.dismiss(id);
      }
    },
    [notificationData],
  );

  // Auto-dismiss after 8 seconds for toasts
  useEffect(() => {
    toastNotifications.forEach((notification) => {
      const timer = setTimeout(() => {
        handleDismiss(notification.id);
      }, 8000); // 8 seconds

      return () => clearTimeout(timer);
    });
  }, [toastNotifications, handleDismiss]);

  if (!userId || toastNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2 pointer-events-none max-w-sm">
      <AnimatePresence mode="popLayout">
        {toastNotifications.map((notification) => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onDismiss={() => handleDismiss(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// SUBTLE TOAST NOTIFICATION COMPONENT
// ============================================================================

interface ToastNotificationProps {
  notification: Notification;
  onDismiss: () => void;
}

function ToastNotification({
  notification,
  onDismiss,
}: ToastNotificationProps) {
  const getTypeStyles = () => {
    // Much more subtle styling
    if (notification.priority === "critical" || notification.type === "error") {
      return "bg-gray-900/95 border border-red-500/30 text-red-100 backdrop-blur-xl shadow-xl shadow-red-500/10";
    }
    return "bg-gray-900/95 border border-gray-700/50 text-gray-100 backdrop-blur-xl shadow-xl";
  };

  const getIcon = () => {
    if (notification.priority === "critical" || notification.type === "error") {
      return "ri-error-warning-fill text-red-400";
    }
    return "ri-information-fill text-cyan-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
      }}
      className={`${getTypeStyles()} rounded-lg p-3 pointer-events-auto border-l-4 ${
        notification.priority === "critical"
          ? "border-l-red-500"
          : "border-l-cyan-500"
      }`}
      onClick={onDismiss}
    >
      <div className="flex items-start gap-2.5">
        {/* Subtle Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <i className={`${getIcon()} text-lg`}></i>
        </div>

        {/* Compact Content */}
        <div className="flex-1 min-w-0">
          {notification.title && (
            <p className="font-semibold text-sm text-white mb-0.5 leading-tight">
              {notification.title}
            </p>
          )}
          <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
            {notification.message}
          </p>

          {/* Minimal metadata */}
          {notification.category && (
            <span className="inline-block mt-1.5 text-[10px] text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">
              {notification.category}
            </span>
          )}
        </div>

        {/* Subtle Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
          aria-label="Dismiss"
        >
          <i className="ri-close-line text-sm"></i>
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 8, ease: "linear" }}
        className="absolute bottom-0 left-0 h-0.5 bg-cyan-500/30 rounded-b-lg"
      />
    </motion.div>
  );
}
