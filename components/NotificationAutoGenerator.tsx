"use client";

/**
 * Auto-generate demo notifications on app load (development only)
 * This ensures users can see notifications working immediately
 */

"use client";

import { useEffect, useState } from "react";

interface NotificationAutoGeneratorProps {
  userId?: string;
  tenantId?: string;
}

export default function NotificationAutoGenerator({
  userId,
  tenantId,
}: NotificationAutoGeneratorProps) {
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    // Only in development mode
    if (
      process.env.NODE_ENV !== "development" &&
      !process.env.NEXT_PUBLIC_ENABLE_DEMO_NOTIFICATIONS
    ) {
      return;
    }

    // Only generate once per session
    if (hasGenerated || !userId) {
      return;
    }

    // Check if we've already generated notifications this session
    const sessionKey = `notifications-generated-${userId}`;
    if (sessionStorage.getItem(sessionKey)) {
      return;
    }

    // Generate notifications after a short delay to ensure app is loaded
    const timer = setTimeout(async () => {
      try {
        console.log(
          "[NotificationAutoGenerator] Generating demo notifications...",
        );

        // Dynamically import to avoid SSR issues
        const { demoNotificationService } =
          await import("@/lib/services/notifications/demoNotificationService");

        await demoNotificationService.generateDemoNotifications({
          userId,
          tenantId,
          count: 8, // Generate 8 notifications to show variety
          includeAllModules: true,
        });
        sessionStorage.setItem(sessionKey, "true");
        setHasGenerated(true);
        console.log(
          "[NotificationAutoGenerator] Demo notifications generated successfully",
        );
      } catch (error) {
        console.error(
          "[NotificationAutoGenerator] Failed to generate notifications:",
          error,
        );
      }
    }, 2000); // Wait 2 seconds after page load

    return () => clearTimeout(timer);
  }, [userId, tenantId, hasGenerated]);

  return null; // This component doesn't render anything
}
