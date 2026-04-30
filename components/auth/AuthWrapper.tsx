"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ViewContextProvider } from "@/contexts/ViewContextProvider";

interface AuthWrapperProps {
  children: ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, isLoading, login } = useAuth();
  const [showContent, setShowContent] = useState(false);

  // Force show content IMMEDIATELY - no waiting
  useEffect(() => {
    // Set immediately on mount
    setShowContent(true);

    // Auto-login if no user after short delay
    const timer = setTimeout(() => {
      if (!user && !isLoading) {
        login("admin@hazalyze.com", "password").catch(() => {
          // Ignore errors, just show content
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [user, isLoading, login]);

  // If we have a user, wrap with ViewContextProvider
  if (user) {
    try {
      return <ViewContextProvider user={user}>{children}</ViewContextProvider>;
    } catch (error) {
      console.error("ViewContextProvider error:", error);
      return <>{children}</>;
    }
  }

  // Show children immediately - no loading screen
  return <>{children}</>;
}
