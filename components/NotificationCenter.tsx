"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotification } from "@/lib/services/notifications/useNotification";
import { Notification } from "@/lib/services/notifications/notificationService";
// Initialize event bus integration for real-time notifications
import "@/lib/services/notifications/eventBusIntegration";

interface NotificationCenterProps {
  userId?: string;
  tenantId?: string;
  maxVisible?: number;
}

export default function NotificationCenter({
  userId,
  tenantId,
  maxVisible = 5,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Hooks must be called unconditionally. If the underlying notification hook
  // can error, it should surface it via `notificationData.error` (handled below).
  const notificationData = useNotification({
    userId,
    tenantId,
    autoRefresh: true,
    refreshInterval: 30000,
  });

  // Handle errors from the hook
  useEffect(() => {
    if (notificationData?.error) {
      console.error(
        "NotificationCenter: Notification service error",
        notificationData.error,
      );
      setHasError(true);
    } else {
      setHasError(false);
    }
  }, [notificationData?.error]);

  // Pulse animation when new notifications arrive
  useEffect(() => {
    if (notificationData?.unreadCount && notificationData.unreadCount > 0) {
      setPulseAnimation(true);
      const timer = setTimeout(() => setPulseAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [notificationData?.unreadCount]);

  // Safely extract values with defaults
  const notifications = notificationData?.notifications || [];
  const unreadCount = notificationData?.unreadCount || 0;
  const markAsRead =
    notificationData?.markAsRead || (async (_id: string) => {});
  const markAllAsRead = notificationData?.markAllAsRead || (async () => {});
  const dismiss = notificationData?.dismiss || (async (_id: string) => {});
  const clearAll = notificationData?.clearAll || (async () => {});

  // Filter out dismissed notifications (with error handling)
  const activeNotifications = (notifications || []).filter(
    (n) => n && !n.dismissed,
  );
  const displayedNotifications = activeNotifications.slice(0, maxVisible);

  // Group notifications by priority/type for better organization
  const groupedNotifications = {
    critical: activeNotifications.filter(
      (n) => n.priority === "critical" || n.type === "error",
    ),
    high: activeNotifications.filter(
      (n) => n.priority === "high" || n.type === "alert",
    ),
    medium: activeNotifications.filter(
      (n) => !n.priority || n.priority === "medium",
    ),
    low: activeNotifications.filter((n) => n.priority === "low"),
  };

  const getTypeStyles = (
    type: Notification["type"],
    priority?: Notification["priority"],
  ) => {
    // Critical/Error notifications get special styling
    if (priority === "critical" || type === "error") {
      return "bg-gradient-to-br from-red-500/30 to-red-600/20 border-red-500/50 text-red-300 shadow-lg shadow-red-500/20";
    }
    if (priority === "high" || type === "alert") {
      return "bg-gradient-to-br from-orange-500/30 to-orange-600/20 border-orange-500/50 text-orange-300 shadow-lg shadow-orange-500/20";
    }

    switch (type) {
      case "success":
        return "bg-gradient-to-br from-green-500/30 to-emerald-600/20 border-green-500/50 text-green-300 shadow-lg shadow-green-500/20";
      case "warning":
        return "bg-gradient-to-br from-yellow-500/30 to-amber-600/20 border-yellow-500/50 text-yellow-300 shadow-lg shadow-yellow-500/20";
      default:
        return "bg-gradient-to-br from-blue-500/30 to-cyan-600/20 border-blue-500/50 text-blue-300 shadow-lg shadow-blue-500/20";
    }
  };

  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "ri-checkbox-circle-fill";
      case "error":
        return "ri-error-warning-fill";
      case "warning":
        return "ri-alert-fill";
      case "alert":
        return "ri-alarm-warning-fill";
      default:
        return "ri-information-fill";
    }
  };

  const getPriorityBadge = (priority?: Notification["priority"]) => {
    if (!priority || priority === "medium") return null;
    const colors = {
      critical: "bg-red-500 text-white",
      high: "bg-orange-500 text-white",
      low: "bg-gray-500 text-white",
    };
    return (
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${colors[priority] || ""}`}
      >
        {priority}
      </span>
    );
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        markAsRead(notification.id);
      }
      if (notification.actionUrl) {
        if (notification.actionUrl.startsWith("http")) {
          window.open(notification.actionUrl, "_blank");
        } else {
          window.location.href = notification.actionUrl;
        }
      }
      // Don't auto-close - let user manually close if they want
    },
    [markAsRead],
  );

  // Close panel when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(target) &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    // Use setTimeout to avoid immediate close on open
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Enhanced Notification Bell with Pulse Animation */}
      <motion.button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="relative p-2.5 rounded-xl hover:bg-white/10 transition-all duration-200 group"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={isOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={pulseAnimation ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5, repeat: pulseAnimation ? 2 : 0 }}
        >
          <i className="ri-notification-3-line text-xl text-gray-300 group-hover:text-white transition-colors"></i>
        </motion.div>

        {/* Enhanced Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg shadow-red-500/50 border-2 border-gray-900"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}

        {/* Error Indicator */}
        {hasError && (
          <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full border-2 border-gray-900"></span>
        )}
      </motion.button>

      {/* Enhanced Notification Panel */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop with blur - closes panel when clicked */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[45] bg-black/20 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              onMouseDown={(e) => {
                // Prevent any interaction issues
                e.stopPropagation();
              }}
            />

            {/* Enhanced Panel */}
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: 10, scale: 0.95, x: 10 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, y: 10, scale: 0.95, x: 10 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className="fixed right-4 top-20 w-[420px] max-w-[calc(100vw-2rem)] bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl shadow-2xl z-[50] overflow-hidden backdrop-blur-xl"
              onClick={(e) => {
                // Prevent clicks inside panel from closing it
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            >
              {/* Enhanced Header with gradient */}
              <div className="px-5 py-4 bg-gradient-to-r from-gray-800/80 to-gray-800/40 border-b border-gray-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <i className="ri-notification-3-fill text-cyan-400"></i>
                    Notifications
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-2.5 py-1 rounded-full font-bold shadow-lg shadow-cyan-500/30"
                      >
                        {unreadCount} new
                      </motion.span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllAsRead()}
                        className="text-xs text-gray-400 hover:text-cyan-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-700/50 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => clearAll()}
                      className="text-xs text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-700/50 font-medium"
                    >
                      Clear all
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
                      aria-label="Close notifications"
                      title="Close"
                    >
                      <i className="ri-close-line text-lg"></i>
                    </button>
                  </div>
                </div>

                {/* Quick filter tabs */}
                {activeNotifications.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    <span className="text-xs text-gray-500">
                      {activeNotifications.length} total
                    </span>
                    {groupedNotifications.critical.length > 0 && (
                      <span className="text-xs text-red-400">
                        • {groupedNotifications.critical.length} critical
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Enhanced Notification List with smooth scrolling */}
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                {displayedNotifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-5 py-12 text-center"
                  >
                    <div className="mx-auto w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
                      <i className="ri-notification-off-line text-3xl text-gray-600"></i>
                    </div>
                    <p className="text-gray-400 font-medium">All caught up!</p>
                    <p className="text-xs text-gray-500 mt-1">
                      No new notifications
                    </p>
                  </motion.div>
                ) : (
                  <div className="divide-y divide-gray-800/50">
                    {displayedNotifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`px-5 py-4 hover:bg-gray-800/40 transition-all duration-200 cursor-pointer group ${
                          !notification.read
                            ? "bg-gradient-to-r from-gray-800/30 to-transparent border-l-2 border-cyan-500"
                            : ""
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Enhanced Icon with glow effect */}
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className={`p-2.5 rounded-xl border ${getTypeStyles(notification.type, notification.priority)} flex-shrink-0`}
                          >
                            <i
                              className={`${notification.icon || getTypeIcon(notification.type)} text-lg`}
                            ></i>
                          </motion.div>

                          {/* Enhanced Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              {notification.title && (
                                <p className="font-semibold text-white text-sm leading-tight">
                                  {notification.title}
                                </p>
                              )}
                              {getPriorityBadge(notification.priority)}
                            </div>
                            <p
                              className={`text-sm leading-relaxed ${notification.title ? "text-gray-300" : "text-white font-medium"}`}
                            >
                              {notification.message}
                            </p>
                            {notification.details && (
                              <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">
                                {notification.details}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2.5">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <i className="ri-time-line"></i>
                                {formatTime(
                                  notification.createdAt || new Date(),
                                )}
                              </span>
                              {notification.category && (
                                <span className="text-xs bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-md border border-gray-600/50">
                                  {notification.category}
                                </span>
                              )}
                              {notification.source && (
                                <span className="text-xs text-gray-500">
                                  {notification.source}
                                </span>
                              )}
                              {!notification.read && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"
                                ></motion.span>
                              )}
                            </div>

                            {/* Action Button */}
                            {notification.actionUrl &&
                              notification.actionLabel && (
                                <motion.button
                                  whileHover={{ x: 3 }}
                                  className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium flex items-center gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationClick(notification);
                                  }}
                                >
                                  {notification.actionLabel}
                                  <i className="ri-arrow-right-line"></i>
                                </motion.button>
                              )}
                          </div>

                          {/* Enhanced Actions */}
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismiss(notification.id);
                              }}
                              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Dismiss"
                            >
                              <i className="ri-close-line"></i>
                            </button>
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                                title="Mark as read"
                              >
                                <i className="ri-check-line"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enhanced Footer */}
              {activeNotifications.length > maxVisible && (
                <div className="px-5 py-3 bg-gradient-to-r from-gray-800/50 to-transparent border-t border-gray-700/50 text-center">
                  <button className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium flex items-center justify-center gap-2 mx-auto">
                    View all {activeNotifications.length} notifications
                    <i className="ri-arrow-right-s-line"></i>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// TOAST NOTIFICATIONS (Legacy - kept for compatibility)
// Note: Toast notifications are now handled by NotificationToastWrapper
// which uses a more subtle, less intrusive design
// ============================================================================

interface ToastProps {
  notification: Notification;
  onDismiss: () => void;
}

export function Toast({ notification, onDismiss }: ToastProps) {
  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(onDismiss, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration, onDismiss]);

  const getTypeStyles = (
    type: Notification["type"],
    priority?: Notification["priority"],
  ) => {
    // Subtle styling
    if (priority === "critical" || type === "error") {
      return "bg-gray-900/95 border border-red-500/30 text-red-100";
    }
    return "bg-gray-900/95 border border-gray-700/50 text-gray-100";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={`px-4 py-3 rounded-lg border backdrop-blur-xl shadow-xl ${getTypeStyles(notification.type, notification.priority)}`}
    >
      <div className="flex items-start gap-2.5">
        <i
          className={`ri-information-fill text-lg ${notification.priority === "critical" ? "text-red-400" : "text-cyan-400"}`}
        ></i>
        <div className="flex-1 min-w-0">
          {notification.title && (
            <p className="font-semibold text-sm text-white mb-0.5">
              {notification.title}
            </p>
          )}
          <p className="text-xs text-gray-300 line-clamp-2">
            {notification.message}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
        >
          <i className="ri-close-line text-sm"></i>
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// TOAST CONTAINER (Legacy - kept for compatibility)
// ============================================================================

interface ToastContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center";
}

export function ToastContainer({
  notifications,
  onDismiss,
  position = "top-right",
}: ToastContainerProps) {
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-[60] flex flex-col gap-2 pointer-events-none max-w-sm`}
    >
      <AnimatePresence mode="popLayout">
        {notifications
          .filter((n) => !n.dismissed && n.channel === "in-app")
          .slice(0, 1) // Only show 1 at a time
          .map((notification) => (
            <div key={notification.id} className="pointer-events-auto">
              <Toast
                notification={notification}
                onDismiss={() => onDismiss(notification.id)}
              />
            </div>
          ))}
      </AnimatePresence>
    </div>
  );
}
