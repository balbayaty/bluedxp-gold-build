/**
 * Mobile Optimized Wrapper Component
 *
 * Ensures all transportation components are fully mobile-responsive
 * Touch-optimized interactions
 * PWA support
 */

"use client";

import { useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface MobileOptimizedWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function MobileOptimizedWrapper({
  children,
  className = "",
}: MobileOptimizedWrapperProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const [touchOptimized, setTouchOptimized] = useState(false);

  useEffect(() => {
    // Detect touch device
    setTouchOptimized("ontouchstart" in window || navigator.maxTouchPoints > 0);

    // Register service worker for PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker registered"))
        .catch((err) =>
          console.log("Service Worker registration failed:", err),
        );
    }
  }, []);

  return (
    <div
      className={`mobile-optimized ${isMobile ? "mobile" : isTablet ? "tablet" : "desktop"} ${
        touchOptimized ? "touch" : ""
      } ${className}`}
      style={{
        // Ensure touch-friendly sizing
        minHeight: isMobile ? "100vh" : "auto",
        touchAction: "manipulation", // Optimize touch interactions
        WebkitTapHighlightColor: "transparent", // Remove tap highlight
      }}
    >
      {children}
    </div>
  );
}

// Hook for media queries
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}
