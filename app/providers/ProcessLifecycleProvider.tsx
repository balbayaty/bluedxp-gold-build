"use client";

import { useEffect } from "react";

/**
 * Process Lifecycle Module Provider
 * Initializes lifecycle system and template library on app startup
 * Fails gracefully if module is not available
 */
export function ProcessLifecycleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Dynamically import to prevent blocking app startup if module has issues
    let mounted = true;

    async function initializeModule() {
      try {
        const { initializeLifecycleSystem } =
          await import("@/lib/services/process-lifecycle/lifecycle/configurations/initialize");
        const { templateLibrary } =
          await import("@/lib/services/process-lifecycle/workflow/templateLibrary");

        if (!mounted) return;

        // Initialize lifecycle system (registers all lifecycle configurations)
        initializeLifecycleSystem();

        // Initialize template library (loads all workflow templates)
        templateLibrary.initialize();

        console.log("✅ Process Lifecycle Module initialized");
      } catch (error) {
        // Fail silently - don't break the app if this module has issues
        console.warn("⚠️ Process Lifecycle Module not available:", error);
      }
    }

    initializeModule();

    return () => {
      mounted = false;
    };
  }, []);

  return <>{children}</>;
}
