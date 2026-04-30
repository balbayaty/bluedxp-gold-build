/**
 * Notification Manager
 *
 * Manages motivational notifications throughout the app
 * Shows quotes, analytics, and value-add messages
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { MotivationalNotification } from "./MotivationalNotification";
import { motivationService, TaskAnalytics } from "@/lib/services/motivation";
import { Quote } from "@/lib/services/motivation";

interface Notification {
  id: string;
  quote: Quote;
  analytics?: TaskAnalytics;
  timestamp: Date;
}

function makeNotificationId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function NotificationManager() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /**
   * Show notification for task completion
   */
  const showTaskCompletion = useCallback((analytics: TaskAnalytics) => {
    const quote = motivationService.getQuote("task_complete");
    const notification: Notification = {
      id: makeNotificationId(),
      quote,
      analytics,
      timestamp: new Date(),
    };
    setNotifications((prev) => [...prev, notification]);
  }, []);

  /**
   * Show notification for job completion
   */
  const showJobCompletion = useCallback(
    (jobName: string, duration: number, estimatedDuration?: number) => {
      const analytics = motivationService.calculateTaskAnalytics(
        jobName,
        new Date(Date.now() - duration),
        new Date(),
        estimatedDuration,
        100, // Assume 100% accuracy for completed jobs
        { itemsProcessed: 1 },
      );
      showTaskCompletion(analytics);
    },
    [showTaskCompletion],
  );

  /**
   * Show daily motivation
   */
  const showDailyMotivation = useCallback(() => {
    const quote = motivationService.getDailyQuote();
    const notification: Notification = {
      id: makeNotificationId(),
      quote,
      timestamp: new Date(),
    };
    setNotifications((prev) => [...prev, notification]);
  }, []);

  // Expose methods globally
  useEffect(() => {
    // Use globalThis to avoid edge cases where `window` access behaves unexpectedly.
    // This should never throw in SSR because this is a client component + effect.
    const w = (globalThis as any)?.window;
    if (!w) return;
    try {
      w.showTaskCompletion = showTaskCompletion;
      w.showJobCompletion = showJobCompletion;
      w.showDailyMotivation = showDailyMotivation;
    } catch (error) {
      console.warn("Failed to expose notification methods to window:", error);
    }
  }, [showTaskCompletion, showJobCompletion, showDailyMotivation]);

  // Show daily motivation on mount (once per day)
  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    try {
      const lastShown = localStorage.getItem("last-daily-motivation");
      const today = new Date().toDateString();

      if (lastShown !== today) {
        setTimeout(() => {
          showDailyMotivation();
          try {
            localStorage.setItem("last-daily-motivation", today);
          } catch (error) {
            console.warn("Failed to save daily motivation timestamp:", error);
          }
        }, 5000); // Show after 5 seconds
      }
    } catch (error) {
      console.warn("Failed to check daily motivation:", error);
    }
  }, [showDailyMotivation]);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] space-y-4 pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <MotivationalNotification
            quote={notification.quote}
            analytics={notification.analytics}
            onClose={() => removeNotification(notification.id)}
            autoClose={notification.analytics ? 10000 : 6000}
          />
        </div>
      ))}
    </div>
  );
}
