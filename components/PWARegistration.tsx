/**
 * PWA Service Worker Registration
 * Registers service worker for offline support and push notifications
 */

"use client";

import { useEffect } from "react";

export default function PWARegistration() {
  useEffect(() => {
    // Never register service workers in development.
    // Dev service workers can cache old Next.js chunks and cause hard-to-debug
    // "missing bootstrap script" / runtime errors after restarts.
    if (process.env.NODE_ENV !== "production") {
      // Also aggressively unregister any previously-installed SW + clear caches,
      // so old builds can't break the current dev session.
      (async () => {
        try {
          if (typeof window === "undefined") return;
          if ("serviceWorker" in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
          }
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
        } catch {
          // Ignore
        }
      })();
      return;
    }

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✅ Service Worker registered:", registration.scope);

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available
                  console.log("🔄 New service worker available");
                  // Optionally show update notification to user
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("❌ Service Worker registration failed:", error);
        });

      // Handle service worker updates
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("Notification permission:", permission);
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
