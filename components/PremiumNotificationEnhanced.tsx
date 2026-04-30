"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createContext, useContext } from "react";
import { useBrandMessaging } from "@/lib/services/brand-messaging/useBrandMessaging";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomer } from "@/contexts/CustomerContext";
import type { MessagingType, MessagingContext } from "@/types/brand-messaging";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type NotificationType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "loading";

export interface PremiumNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // Auto-dismiss after milliseconds (0 = no auto-dismiss, default: 5000)
  position?:
    | "top-right"
    | "top-left"
    | "top-center"
    | "bottom-right"
    | "bottom-left"
    | "bottom-center";
  icon?: string;
  image?: string;
  actions?: NotificationAction[];
  sound?: boolean;
  progress?: boolean;
  dismissible?: boolean;
  onClose?: () => void;
  onClick?: () => void;
  // Brand messaging integration
  useBrandMessaging?: boolean;
  messagingType?: MessagingType;
  messagingContext?: MessagingContext;
  // Smart features
  priority?: "low" | "medium" | "high" | "critical";
  groupId?: string; // Group similar notifications
  analytics?: {
    category?: string;
    action?: string;
    label?: string;
  };
}

interface NotificationAction {
  label: string;
  action: () => void;
  variant?: "primary" | "secondary" | "danger";
  icon?: string;
}

interface NotificationContextType {
  showNotification: (notification: Omit<PremiumNotification, "id">) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  clearGroup: (groupId: string) => void;
}

// ============================================================================
// MOCK DATA FOR DEMONSTRATION
// ============================================================================

export const MOCK_NOTIFICATIONS = {
  workflowSaved: {
    type: "success" as NotificationType,
    title: "Workflow Saved",
    message:
      'Your workflow "test" has been saved successfully and is ready to use.',
    duration: 4000,
    useBrandMessaging: true,
    messagingType: "success_message" as MessagingType,
    analytics: { category: "workflow", action: "save", label: "success" },
  },
  workflowError: {
    type: "error" as NotificationType,
    title: "Save Failed",
    message:
      "Unable to save workflow. Please check your connection and try again.",
    duration: 6000,
    useBrandMessaging: true,
    messagingType: "error_message" as MessagingType,
    actions: [
      {
        label: "Retry",
        action: () => console.log("Retry"),
        variant: "primary" as const,
      },
      {
        label: "Report Issue",
        action: () => console.log("Report"),
        variant: "danger" as const,
      },
    ],
  },
  lowStorage: {
    type: "warning" as NotificationType,
    title: "Storage Warning",
    message:
      "You are running low on storage space. Consider cleaning up old files.",
    duration: 8000,
    priority: "medium" as const,
    actions: [
      {
        label: "Free Up Space",
        action: () => console.log("Free space"),
        variant: "primary" as const,
      },
    ],
  },
  newFeature: {
    type: "info" as NotificationType,
    title: "New Feature Available",
    message:
      "Check out our new AI-powered analytics dashboard. Click to learn more.",
    duration: 7000,
    onClick: () => console.log("Feature clicked"),
  },
  processing: {
    type: "loading" as NotificationType,
    title: "Processing Request",
    message: "Please wait while we process your workflow...",
    duration: 0, // No auto-dismiss
    dismissible: false,
  },
};

// ============================================================================
// CONTEXT
// ============================================================================

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function usePremiumNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "usePremiumNotification must be used within PremiumNotificationProvider",
    );
  }
  return context;
}

// ============================================================================
// PROVIDER WITH BRAND MESSAGING INTEGRATION
// ============================================================================

export function PremiumNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<PremiumNotification[]>([]);
  const { getMessage } = useBrandMessaging();
  const { user } = useAuth();
  const { currentCustomer } = useCustomer();

  const showNotification = useCallback(
    (notification: Omit<PremiumNotification, "id">) => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      // Default values
      const newNotification: PremiumNotification = {
        id,
        position: "top-right",
        duration: 5000,
        dismissible: true,
        progress: true,
        sound: true,
        priority: "medium",
        ...notification,
      };

      // Brand messaging integration (async, non-blocking)
      if (
        newNotification.useBrandMessaging &&
        newNotification.messagingType &&
        newNotification.messagingContext
      ) {
        // Don't await - update title asynchronously if available
        getMessage(newNotification.messagingType, {
          ...newNotification.messagingContext,
          language: "en",
          moduleId: newNotification.messagingContext.moduleId,
          userRole: user?.role,
          metadata: {
            ...newNotification.messagingContext.metadata,
            customerId: currentCustomer?.id,
            tenantId: currentCustomer?.tenantId,
          },
        })
          .then((brandMessage) => {
            if (brandMessage) {
              setNotifications((prev) =>
                prev.map((n) =>
                  n.id === id ? { ...n, title: brandMessage } : n,
                ),
              );
            }
          })
          .catch((error) => {
            console.debug("Brand messaging unavailable, using default:", error);
            // Continue with default message
          });
      }

      setNotifications((prev) => {
        // Group similar notifications if groupId is provided
        if (newNotification.groupId) {
          const existingGroup = prev.filter(
            (n) => n.groupId === newNotification.groupId,
          );
          if (existingGroup.length > 0) {
            // Replace existing group notifications
            return prev
              .filter((n) => n.groupId !== newNotification.groupId)
              .concat(newNotification);
          }
        }
        return [...prev, newNotification];
      });

      // Play sound if enabled
      if (newNotification.sound) {
        playNotificationSound(newNotification.type, newNotification.priority);
      }

      // Analytics tracking
      if (newNotification.analytics) {
        // Track notification shown
        console.log("Notification Analytics:", newNotification.analytics);
      }

      return id;
    },
    [getMessage, user, currentCustomer],
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearGroup = useCallback((groupId: string) => {
    setNotifications((prev) => prev.filter((n) => n.groupId !== groupId));
  }, []);

  // Group notifications by position
  const groupedNotifications = useMemo(() => {
    return notifications.reduce(
      (acc, notif) => {
        const position = notif.position || "top-right";
        if (!acc[position]) acc[position] = [];
        acc[position].push(notif);
        return acc;
      },
      {} as Record<string, PremiumNotification[]>,
    );
  }, [notifications]);

  // Set global notification handler for API client and error boundaries
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handler = {
        success: (title: string, message?: string, options?: any) => {
          return showNotification({
            type: "success",
            title,
            message,
            ...options,
          });
        },
        error: (title: string, message?: string, options?: any) => {
          return showNotification({
            type: "error",
            title,
            message,
            ...options,
          });
        },
        warning: (title: string, message?: string, options?: any) => {
          return showNotification({
            type: "warning",
            title,
            message,
            ...options,
          });
        },
        info: (title: string, message?: string, options?: any) => {
          return showNotification({ type: "info", title, message, ...options });
        },
        loading: (title: string, message?: string) => {
          return showNotification({
            type: "loading",
            title,
            message,
            duration: 0,
            dismissible: false,
          });
        },
        removeNotification,
      };

      // Set for API client
      import("@/lib/utils/apiClient")
        .then(({ setGlobalNotificationHandler }) => {
          setGlobalNotificationHandler(handler);
        })
        .catch(() => {
          // Silently fail if module not available yet
        });

      // Set for error boundaries
      (window as any).__notificationHandler = handler;
    }
  }, [showNotification, removeNotification]);

  return (
    <NotificationContext.Provider
      value={{ showNotification, removeNotification, clearAll, clearGroup }}
    >
      {children}
      {/* Render notifications for each position */}
      {Object.entries(groupedNotifications).map(([position, notifs]) => (
        <PremiumNotificationContainer
          key={position}
          position={position as PremiumNotification["position"]}
          notifications={notifs}
          onRemove={removeNotification}
        />
      ))}
    </NotificationContext.Provider>
  );
}

// ============================================================================
// NOTIFICATION CONTAINER
// ============================================================================

interface ContainerProps {
  position: PremiumNotification["position"];
  notifications: PremiumNotification[];
  onRemove: (id: string) => void;
}

function PremiumNotificationContainer({
  position,
  notifications,
  onRemove,
}: ContainerProps) {
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  };

  // Sort by priority
  const sortedNotifications = useMemo(() => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return [...notifications].sort((a, b) => {
      const aPriority = priorityOrder[a.priority || "medium"];
      const bPriority = priorityOrder[b.priority || "medium"];
      return bPriority - aPriority;
    });
  }, [notifications]);

  return (
    <div
      className={`fixed ${positionClasses[position || "top-right"]} z-[9999] pointer-events-none`}
    >
      <div className="flex flex-col gap-3 max-w-md w-full">
        <AnimatePresence mode="popLayout">
          {sortedNotifications.map((notification, index) => (
            <PremiumNotificationItem
              key={notification.id}
              notification={notification}
              index={index}
              onRemove={onRemove}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================================
// NOTIFICATION ITEM WITH ENHANCED AUTO-DISMISS
// ============================================================================

interface ItemProps {
  notification: PremiumNotification;
  index: number;
  onRemove: (id: string) => void;
}

function PremiumNotificationItem({ notification, index, onRemove }: ItemProps) {
  const [progress, setProgress] = useState(100);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Enhanced auto-dismiss with countdown
  useEffect(() => {
    if (
      !notification.duration ||
      notification.duration <= 0 ||
      isPaused ||
      isExiting
    ) {
      return;
    }

    const duration = notification.duration;
    startTimeRef.current = Date.now() - pausedTimeRef.current;

    const updateProgress = () => {
      if (isPaused || isExiting) return;

      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, duration - elapsed);
      const progressPercent = Math.max(0, (remaining / duration) * 100);

      setProgress(progressPercent);
      setTimeRemaining(Math.ceil(remaining / 1000)); // Seconds remaining

      if (remaining <= 0) {
        setIsExiting(true);
        setTimeout(() => {
          onRemove(notification.id);
        }, 300); // Allow exit animation
      }
    };

    progressIntervalRef.current = setInterval(updateProgress, 50); // Update every 50ms for smooth progress
    timeoutRef.current = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onRemove(notification.id);
      }, 300);
    }, duration);

    return () => {
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [notification.duration, notification.id, onRemove, isPaused, isExiting]);

  // Handle pause/resume
  useEffect(() => {
    if (isPaused) {
      pausedTimeRef.current = Date.now() - startTimeRef.current;
    } else if (startTimeRef.current > 0) {
      startTimeRef.current = Date.now() - pausedTimeRef.current;
    }
  }, [isPaused]);

  const handleClose = () => {
    setIsExiting(true);
    if (notification.onClose) notification.onClose();
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  const getTypeStyles = () => {
    const baseStyles = {
      success: {
        bg: "from-green-500/20 via-emerald-500/15 to-teal-500/10",
        border: "border-green-500/40",
        icon: "ri-checkbox-circle-fill",
        iconColor: "text-green-400",
        glow: "shadow-[0_0_30px_rgba(34,197,94,0.3)]",
        progressColor: "bg-green-400",
        pulse: "animate-pulse",
      },
      error: {
        bg: "from-red-500/20 via-rose-500/15 to-pink-500/10",
        border: "border-red-500/40",
        icon: "ri-error-warning-fill",
        iconColor: "text-red-400",
        glow: "shadow-[0_0_30px_rgba(239,68,68,0.3)]",
        progressColor: "bg-red-400",
        pulse: "animate-pulse",
      },
      warning: {
        bg: "from-amber-500/20 via-yellow-500/15 to-orange-500/10",
        border: "border-amber-500/40",
        icon: "ri-alert-fill",
        iconColor: "text-amber-400",
        glow: "shadow-[0_0_30px_rgba(245,158,11,0.3)]",
        progressColor: "bg-amber-400",
        pulse: "",
      },
      info: {
        bg: "from-blue-500/20 via-cyan-500/15 to-sky-500/10",
        border: "border-blue-500/40",
        icon: "ri-information-fill",
        iconColor: "text-blue-400",
        glow: "shadow-[0_0_30px_rgba(59,130,246,0.3)]",
        progressColor: "bg-blue-400",
        pulse: "",
      },
      loading: {
        bg: "from-purple-500/20 via-indigo-500/15 to-violet-500/10",
        border: "border-purple-500/40",
        icon: "ri-loader-4-line",
        iconColor: "text-purple-400",
        glow: "shadow-[0_0_30px_rgba(168,85,247,0.3)]",
        progressColor: "bg-purple-400",
        pulse: "",
      },
    };

    const typeStyles = baseStyles[notification.type] || baseStyles.info;

    // Enhance with priority
    if (notification.priority === "critical") {
      return {
        ...typeStyles,
        glow: "shadow-[0_0_40px_rgba(239,68,68,0.5)]",
        pulse: "animate-pulse",
        border: "border-red-500/60",
      };
    }

    return typeStyles;
  };

  const styles = getTypeStyles();
  const icon = notification.icon || styles.icon;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -20,
        scale: 0.95,
        x: notification.position?.includes("right")
          ? 100
          : notification.position?.includes("left")
            ? -100
            : 0,
      }}
      animate={{
        opacity: isExiting ? 0 : 1,
        y: isExiting ? -20 : 0,
        scale: isExiting ? 0.9 : 1,
        x: isExiting
          ? notification.position?.includes("right")
            ? 100
            : notification.position?.includes("left")
              ? -100
              : 0
          : 0,
      }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        delay: index * 0.05,
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={notification.onClick}
      className={`relative pointer-events-auto ${notification.onClick ? "cursor-pointer" : ""} ${styles.pulse}`}
    >
      {/* Glow Effect */}
      <div
        className={`absolute -inset-1 bg-gradient-to-r ${styles.bg} rounded-2xl blur-xl opacity-50 ${styles.glow}`}
      />

      {/* Main Card */}
      <div
        className={`relative bg-gradient-to-br ${styles.bg} backdrop-blur-xl border ${styles.border} rounded-2xl p-5 shadow-2xl overflow-hidden`}
      >
        {/* Enhanced Progress Bar with Countdown */}
        {notification.progress &&
          notification.duration &&
          notification.duration > 0 &&
          !isPaused && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
              <motion.div
                className={`h-full ${styles.progressColor} origin-left`}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: progress / 100 }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
              {/* Countdown Badge */}
              {timeRemaining > 0 && timeRemaining <= 3 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-2 -top-6 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                >
                  {timeRemaining}s
                </motion.div>
              )}
            </div>
          )}

        {/* Pause Indicator */}
        {isPaused && notification.duration && notification.duration > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-2 right-2 bg-white/10 backdrop-blur-sm text-white/60 text-xs px-2 py-1 rounded-lg flex items-center gap-1"
          >
            <i className="ri-pause-line text-xs"></i>
            <span>Paused</span>
          </motion.div>
        )}

        <div className="flex items-start gap-4">
          {/* Icon */}
          {notification.image ? (
            <motion.img
              src={notification.image}
              alt=""
              className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
            />
          ) : (
            <motion.div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${styles.bg} border ${styles.border} flex items-center justify-center flex-shrink-0 ${styles.glow}`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.1 }}
            >
              {notification.type === "loading" ? (
                <motion.i
                  className={`${icon} ${styles.iconColor} text-2xl`}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <i className={`${icon} ${styles.iconColor} text-2xl`} />
              )}
            </motion.div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <motion.h3
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="text-white font-semibold text-base mb-1"
            >
              {notification.title}
            </motion.h3>
            {notification.message && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white/70 text-sm leading-relaxed"
              >
                {notification.message}
              </motion.p>
            )}

            {/* Actions */}
            {notification.actions && notification.actions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex items-center gap-2 mt-3 flex-wrap"
              >
                {notification.actions.map((action, idx) => (
                  <motion.button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.action();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      action.variant === "primary"
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : action.variant === "danger"
                          ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                          : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {action.icon && <i className={action.icon}></i>}
                    {action.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Close Button */}
          {notification.dismissible && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors flex-shrink-0"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              title="Dismiss"
            >
              <i className="ri-close-line text-lg" />
            </motion.button>
          )}
        </div>

        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
          animate={{ x: ["-100%", "200%"] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 2,
          }}
        />
      </div>
    </motion.div>
  );
}

// ============================================================================
// ENHANCED SOUND EFFECTS
// ============================================================================

function playNotificationSound(type: NotificationType, priority?: string) {
  try {
    const audioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const frequencies: Record<NotificationType, number> = {
      success: 800,
      error: 400,
      warning: 600,
      info: 500,
      loading: 300,
    };

    const baseFreq = frequencies[type] || 500;
    const priorityMultiplier =
      priority === "critical" ? 1.2 : priority === "high" ? 1.1 : 1;

    oscillator.frequency.value = baseFreq * priorityMultiplier;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.2,
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    // Silently fail if audio context is not available
  }
}

// ============================================================================
// CONVENIENCE HOOKS WITH BRAND MESSAGING
// ============================================================================

export function useNotificationHelpers() {
  const { showNotification, removeNotification } = usePremiumNotification();
  const { user } = useAuth();
  const { currentCustomer } = useCustomer();

  return {
    success: (
      title: string,
      message?: string,
      options?: Partial<PremiumNotification>,
    ) =>
      showNotification({
        type: "success",
        title,
        message,
        duration: 4000,
        ...options,
      }),
    error: (
      title: string,
      message?: string,
      options?: Partial<PremiumNotification>,
    ) =>
      showNotification({
        type: "error",
        title,
        message,
        duration: 7000,
        priority: "high",
        ...options,
      }),
    warning: (
      title: string,
      message?: string,
      options?: Partial<PremiumNotification>,
    ) =>
      showNotification({
        type: "warning",
        title,
        message,
        duration: 6000,
        ...options,
      }),
    info: (
      title: string,
      message?: string,
      options?: Partial<PremiumNotification>,
    ) =>
      showNotification({
        type: "info",
        title,
        message,
        duration: 5000,
        ...options,
      }),
    loading: (
      title: string,
      message?: string,
      options?: Partial<PremiumNotification>,
    ) =>
      showNotification({
        type: "loading",
        title,
        message,
        duration: 0,
        dismissible: false,
        ...options,
      }),
    // Brand messaging enhanced
    brandSuccess: (
      messagingType: MessagingType,
      context: MessagingContext,
      options?: Partial<PremiumNotification>,
    ) => {
      return showNotification({
        type: "success",
        title: "Success", // Will be replaced by brand messaging
        useBrandMessaging: true,
        messagingType,
        messagingContext: {
          ...context,
          userRole: user?.role,
          metadata: {
            ...context.metadata,
            customerId: currentCustomer?.id,
            tenantId: currentCustomer?.tenantId,
          },
        },
        duration: 4000,
        ...options,
      });
    },
    removeNotification,
  };
}
