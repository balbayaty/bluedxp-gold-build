"use client";

/**
 * React Hook for Notifications
 * Client-side hook for using the notification service
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { Notification } from "./notificationService";

interface NotificationHookOptions {
  userId?: string;
  tenantId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // ms
}

interface NotificationHookReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  addNotification: (
    notification: Omit<Notification, "id" | "createdAt" | "read" | "dismissed">,
  ) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Lazy load notification service to avoid issues with dynamic imports
type NotificationService =
  (typeof import("./notificationService"))["notificationService"];
let notificationService: NotificationService | null = null;
const getNotificationService = async () => {
  if (typeof window === "undefined") return null;
  if (notificationService) return notificationService;

  try {
    const notifModule = await import("./notificationService");
    notificationService = notifModule.notificationService;
    return notificationService;
  } catch (err) {
    console.error("Failed to load notification service:", err);
    return null;
  }
};

export function useNotification(
  options: NotificationHookOptions = {},
): NotificationHookReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const refresh = useCallback(async () => {
    const service = await getNotificationService();
    if (!service) {
      if (isMountedRef.current) {
        setError(new Error("Notification service not available"));
        setLoading(false);
      }
      return;
    }

    if (isMountedRef.current) {
      setLoading(true);
    }

    try {
      const data = await service.getAll({
        userId: options.userId,
        tenantId: options.tenantId,
        limit: 100,
      });
      if (isMountedRef.current) {
        setNotifications(data || []);
        setError(null);
      }
    } catch (err) {
      console.error("useNotification: Error refreshing notifications", err);
      if (isMountedRef.current) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to fetch notifications"),
        );
        setNotifications([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [options.userId, options.tenantId]);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial refresh with error handling
    const initialize = async () => {
      const service = await getNotificationService();
      if (!service) {
        if (isMountedRef.current) {
          setError(new Error("Notification service not available"));
        }
        return;
      }

      // Initial refresh
      await refresh().catch((err) => {
        console.error("useNotification: Error in initial refresh", err);
        if (isMountedRef.current) {
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to fetch notifications"),
          );
        }
      });

      // Subscribe to updates with error handling
      try {
        if (service && typeof service.subscribe === "function") {
          unsubscribeRef.current = service.subscribe(
            (allNotifications: Notification[]) => {
              if (!isMountedRef.current) return;

              try {
                // Filter for current user/tenant
                let filtered = allNotifications || [];
                if (options.userId) {
                  filtered = filtered.filter(
                    (n) => n && n.userId === options.userId,
                  );
                }
                if (options.tenantId) {
                  filtered = filtered.filter(
                    (n) => n && n.tenantId === options.tenantId,
                  );
                }
                setNotifications(filtered);
              } catch (err) {
                console.error(
                  "useNotification: Error in subscription callback",
                  err,
                );
              }
            },
          );
        }
      } catch (err) {
        console.error(
          "useNotification: Error subscribing to notifications",
          err,
        );
        if (isMountedRef.current) {
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to subscribe to notifications"),
          );
        }
      }

      // Auto refresh interval
      if (options.autoRefresh && options.refreshInterval) {
        intervalRef.current = setInterval(() => {
          refresh().catch((err) => {
            console.error("useNotification: Error in auto-refresh", err);
          });
        }, options.refreshInterval);
      }
    };

    initialize();

    return () => {
      isMountedRef.current = false;
      try {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } catch (err) {
        console.error("useNotification: Error cleaning up", err);
      }
    };
  }, [
    options.autoRefresh,
    options.refreshInterval,
    options.userId,
    options.tenantId,
    refresh,
  ]);

  const addNotification = useCallback(
    async (
      notification: Omit<
        Notification,
        "id" | "createdAt" | "read" | "dismissed"
      >,
    ) => {
      const service = await getNotificationService();
      if (!service) {
        console.warn(
          "useNotification: Cannot add notification - service not available",
        );
        return;
      }
      try {
        await service.send({
          ...notification,
          userId: notification.userId || options.userId,
          tenantId: notification.tenantId || options.tenantId,
        });
      } catch (err) {
        console.error("useNotification: Error adding notification", err);
        if (isMountedRef.current) {
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to add notification"),
          );
        }
      }
    },
    [options.userId, options.tenantId],
  );

  const markAsRead = useCallback(async (id: string) => {
    const service = await getNotificationService();
    if (!service) return;
    try {
      await service.markAsRead(id);
    } catch (err) {
      console.error("useNotification: Error marking as read", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const service = await getNotificationService();
    if (!service) return;
    try {
      await service.markAllAsRead(options.userId);
    } catch (err) {
      console.error("useNotification: Error marking all as read", err);
    }
  }, [options.userId]);

  const dismiss = useCallback(async (id: string) => {
    const service = await getNotificationService();
    if (!service) return;
    try {
      await service.dismiss(id);
    } catch (err) {
      console.error("useNotification: Error dismissing notification", err);
    }
  }, []);

  const clearAll = useCallback(async () => {
    const service = await getNotificationService();
    if (!service) return;
    try {
      await service.clearAll(options.userId);
    } catch (err) {
      console.error("useNotification: Error clearing all notifications", err);
    }
  }, [options.userId]);

  return {
    notifications: notifications || [],
    unreadCount: (notifications || []).filter(
      (n) => n && !n.read && !n.dismissed,
    ).length,
    loading,
    error,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismiss,
    clearAll,
    refresh,
  };
}
