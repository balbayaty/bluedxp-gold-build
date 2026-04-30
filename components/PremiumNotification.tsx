"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useMemo } from "react";
import { createContext, useContext, useCallback } from "react";
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
  duration?: number; // Auto-dismiss after milliseconds (0 = no auto-dismiss)
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
}

interface NotificationAction {
  label: string;
  action: () => void;
  variant?: "primary" | "secondary" | "danger";
}

interface NotificationContextType {
  showNotification: (notification: Omit<PremiumNotification, "id">) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

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
// PROVIDER
// ============================================================================

export function PremiumNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<PremiumNotification[]>([]);

  const showNotification = useCallback(
    (notification: Omit<PremiumNotification, "id">) => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const newNotification: PremiumNotification = {
        id,
        position: "top-right",
        duration: 5000,
        dismissible: true,
        progress: true,
        sound: true,
        ...notification,
      };

      setNotifications((prev) => [...prev, newNotification]);

      // Play sound if enabled
      if (newNotification.sound) {
        playNotificationSound(newNotification.type);
      }

      return id;
    },
    [],
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Group notifications by position
  const groupedNotifications = notifications.reduce(
    (acc, notif) => {
      const position = notif.position || "top-right";
      if (!acc[position]) acc[position] = [];
      acc[position].push(notif);
      return acc;
    },
    {} as Record<string, PremiumNotification[]>,
  );

  return (
    <NotificationContext.Provider
      value={{ showNotification, removeNotification, clearAll }}
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

  return (
    <div
      className={`fixed ${positionClasses[position || "top-right"]} z-[9999] pointer-events-none`}
    >
      <div className="flex flex-col gap-3 max-w-md w-full">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification, index) => (
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
// NOTIFICATION ITEM
// ============================================================================

interface ItemProps {
  notification: PremiumNotification;
  index: number;
  onRemove: (id: string) => void;
}

function PremiumNotificationItem({ notification, index, onRemove }: ItemProps) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-dismiss with progress
  useEffect(() => {
    if (notification.duration && notification.duration > 0 && !isPaused) {
      const startTime = Date.now();
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(
          0,
          100 - (elapsed / notification.duration!) * 100,
        );
        setProgress(remaining);

        if (remaining <= 0) {
          onRemove(notification.id);
        }
      };

      progressIntervalRef.current = setInterval(updateProgress, 50);
      timeoutRef.current = setTimeout(() => {
        onRemove(notification.id);
      }, notification.duration);

      return () => {
        if (progressIntervalRef.current)
          clearInterval(progressIntervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [notification.duration, notification.id, onRemove, isPaused]);

  const handleClose = () => {
    if (notification.onClose) notification.onClose();
    onRemove(notification.id);
  };

  const getTypeStyles = () => {
    switch (notification.type) {
      case "success":
        return {
          bg: "from-green-500/20 via-emerald-500/15 to-teal-500/10",
          border: "border-green-500/40",
          icon: "ri-checkbox-circle-fill",
          iconColor: "text-green-400",
          glow: "shadow-[0_0_30px_rgba(34,197,94,0.3)]",
          progressColor: "bg-green-400",
        };
      case "error":
        return {
          bg: "from-red-500/20 via-rose-500/15 to-pink-500/10",
          border: "border-red-500/40",
          icon: "ri-error-warning-fill",
          iconColor: "text-red-400",
          glow: "shadow-[0_0_30px_rgba(239,68,68,0.3)]",
          progressColor: "bg-red-400",
        };
      case "warning":
        return {
          bg: "from-amber-500/20 via-yellow-500/15 to-orange-500/10",
          border: "border-amber-500/40",
          icon: "ri-alert-fill",
          iconColor: "text-amber-400",
          glow: "shadow-[0_0_30px_rgba(245,158,11,0.3)]",
          progressColor: "bg-amber-400",
        };
      case "info":
        return {
          bg: "from-blue-500/20 via-cyan-500/15 to-sky-500/10",
          border: "border-blue-500/40",
          icon: "ri-information-fill",
          iconColor: "text-blue-400",
          glow: "shadow-[0_0_30px_rgba(59,130,246,0.3)]",
          progressColor: "bg-blue-400",
        };
      case "loading":
        return {
          bg: "from-purple-500/20 via-indigo-500/15 to-violet-500/10",
          border: "border-purple-500/40",
          icon: "ri-loader-4-line",
          iconColor: "text-purple-400",
          glow: "shadow-[0_0_30px_rgba(168,85,247,0.3)]",
          progressColor: "bg-purple-400",
        };
      default:
        return {
          bg: "from-gray-500/20 via-slate-500/15 to-zinc-500/10",
          border: "border-gray-500/40",
          icon: "ri-notification-line",
          iconColor: "text-gray-400",
          glow: "shadow-[0_0_30px_rgba(107,114,128,0.3)]",
          progressColor: "bg-gray-400",
        };
    }
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
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{
        opacity: 0,
        scale: 0.9,
        y: -20,
        x: notification.position?.includes("right")
          ? 100
          : notification.position?.includes("left")
            ? -100
            : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        delay: index * 0.05,
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={notification.onClick}
      className={`relative pointer-events-auto ${notification.onClick ? "cursor-pointer" : ""}`}
    >
      {/* Glow Effect */}
      <div
        className={`absolute -inset-1 bg-gradient-to-r ${styles.bg} rounded-2xl blur-xl opacity-50 ${styles.glow}`}
      />

      {/* Main Card */}
      <div
        className={`relative bg-gradient-to-br ${styles.bg} backdrop-blur-xl border ${styles.border} rounded-2xl p-5 shadow-2xl overflow-hidden`}
      >
        {/* Progress Bar */}
        {notification.progress &&
          notification.duration &&
          notification.duration > 0 && (
            <motion.div
              className={`absolute top-0 left-0 right-0 h-1 ${styles.progressColor} origin-left`}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: progress / 100 }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
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
                className="flex items-center gap-2 mt-3"
              >
                {notification.actions.map((action, idx) => (
                  <motion.button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.action();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      action.variant === "primary"
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : action.variant === "danger"
                          ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                          : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
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
            >
              <i className="ri-close-line text-lg" />
            </motion.button>
          )}
        </div>

        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}

// ============================================================================
// SOUND EFFECTS
// ============================================================================

function playNotificationSound(type: NotificationType) {
  // Create audio context for sound effects
  try {
    const audioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different frequencies for different types
    const frequencies: Record<NotificationType, number> = {
      success: 800,
      error: 400,
      warning: 600,
      info: 500,
      loading: 300,
    };

    oscillator.frequency.value = frequencies[type] || 500;
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
// CONVENIENCE HOOKS
// ============================================================================

export function useNotificationHelpers() {
  const { showNotification, removeNotification } = usePremiumNotification();

  return {
    success: (
      title: string,
      message?: string,
      options?: Partial<PremiumNotification>,
    ) => showNotification({ type: "success", title, message, ...options }),
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
        ...options,
      }),
    warning: (
      title: string,
      message?: string,
      options?: Partial<PremiumNotification>,
    ) => showNotification({ type: "warning", title, message, ...options }),
    info: (
      title: string,
      message?: string,
      options?: Partial<PremiumNotification>,
    ) => showNotification({ type: "info", title, message, ...options }),
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
    removeNotification,
  };
}
