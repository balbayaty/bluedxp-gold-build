"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleDefinition } from "@/types/user";
import PremiumLoadingScreen from "@/components/PremiumLoadingScreen";

/**
 * Home Route (`/`)
 *
 * Goal: keep startup fast and predictable.
 * - If authenticated: go to the user's role dashboard
 * - If not authenticated: go to `/login` (instead of the heavy `/ultimate` experience)
 */
export default function Home() {
  const { user, isLoading, isHydrated } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Safety timeout: if hydration takes too long, force redirect after 500ms for faster loading
    const safetyTimeout = setTimeout(() => {
      if (!hasRedirected) {
        console.warn("[Home] Safety timeout triggered - forcing redirect");
        setHasRedirected(true);
        const targetRoute = user ? "/mind-blowing-home" : "/login";
        console.log("[Home] Safety redirect to:", targetRoute);
        // Use window.location for more reliable redirect
        window.location.href = targetRoute;
      }
    }, 500);

    // Wait for hydration to complete before redirecting
    if (!isHydrated || isLoading) {
      return () => clearTimeout(safetyTimeout);
    }

    // Prevent multiple redirects
    if (hasRedirected) {
      return () => clearTimeout(safetyTimeout);
    }

    setHasRedirected(true);
    clearTimeout(safetyTimeout);

    // Immediate redirect (removed delay for faster loading)
    try {
      // Use the new mind-blowing home dashboard for all users
      const targetRoute = user ? "/mind-blowing-home" : "/login";
      console.log("[Home] Redirecting to:", targetRoute, {
        user: !!user,
        isHydrated,
        isLoading,
      });

      // Try router first, fallback to window.location for reliability
      router.replace(targetRoute).catch((err) => {
        console.error(
          "[Home] Router replace failed, using window.location:",
          err,
        );
        window.location.href = targetRoute;
      });
    } catch (error) {
      console.error("[Home] Redirect error:", error);
      // Fallback redirect
      const targetRoute = user ? "/mind-blowing-home" : "/login";
      window.location.href = targetRoute;
    }

    return () => {
      clearTimeout(safetyTimeout);
    };
  }, [user, isLoading, isHydrated, router, hasRedirected]);

  return <PremiumLoadingScreen />;
}
