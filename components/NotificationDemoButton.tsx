"use client";

/**
 * Notification Demo Button
 * Allows users to generate intelligent demo notifications for testing
 */

import { useState } from "react";
import { motion } from "framer-motion";

interface NotificationDemoButtonProps {
  userId?: string;
  tenantId?: string;
  className?: string;
}

export default function NotificationDemoButton({
  userId,
  tenantId,
  className = "",
}: NotificationDemoButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateNotifications = async (count: number = 10) => {
    if (!userId) {
      setError("User ID required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/notifications/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          count,
          clearFirst: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate notifications");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Refresh the page to show new notifications
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate notifications",
      );
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const clearNotifications = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications/demo", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear notifications");
      }

      // Refresh the page
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to clear notifications",
      );
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Only show in development or if explicitly enabled
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.NEXT_PUBLIC_ENABLE_DEMO_NOTIFICATIONS
  ) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.button
        onClick={() => generateNotifications(10)}
        disabled={loading || !userId}
        className="px-3 py-1.5 text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Generate 10 intelligent demo notifications"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Generating...
          </span>
        ) : success ? (
          <span className="flex items-center gap-1">
            <i className="ri-check-line"></i>
            Generated!
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <i className="ri-notification-3-line"></i>
            Demo Notifications
          </span>
        )}
      </motion.button>

      {error && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs text-red-400"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
