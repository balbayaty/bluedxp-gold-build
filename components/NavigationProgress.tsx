"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

/**
 * Navigation Progress Indicator
 * Shows a progress bar at the top during page transitions
 * Optimized for fast navigation feedback and minimal re-renders
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Clean up any existing timers
    cleanup();

    // Show loading indicator when pathname changes
    setLoading(true);
    setProgress(10); // Start immediately

    // Fast progress animation for better perceived performance
    intervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        cleanup();
        return;
      }
      setProgress((prev) => {
        if (prev >= 85) {
          cleanup();
          return 85; // Hold at 85% until page loads
        }
        return prev + 15; // Faster increments
      });
    }, 30); // Faster updates

    // Complete progress when navigation finishes - much faster
    timeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setProgress(100);
      const fadeTimer = setTimeout(() => {
        if (isMountedRef.current) {
          setLoading(false);
          setProgress(0);
        }
      }, 50); // Very quick fade out
      timeoutRef.current = fadeTimer;
    }, 50); // Minimal delay - instant navigation feedback

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [pathname, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 transition-all duration-200 ease-out shadow-lg shadow-blue-500/50"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
