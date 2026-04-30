"use client";

/**
 * Demo Mode Toggle Component
 *
 * Allows users to enable/disable demo data mode
 * Makes dashboards look impressive with realistic demo data
 * Also includes option to skip session verification for faster loading
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function DemoModeToggle() {
  const [enabled, setEnabled] = useState(true); // Default to enabled
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check current demo mode status
    fetch("/api/demo/toggle")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEnabled(data.enabled);
        }
      })
      .catch(() => {
        // Default to enabled in development
        setEnabled(process.env.NODE_ENV === "development");
      });
  }, []);

  const toggleDemoMode = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      const data = await res.json();
      if (data.success) {
        setEnabled(data.enabled);
        // Store in localStorage for client-side checks
        if (typeof window !== "undefined") {
          localStorage.setItem("demo-mode", data.enabled ? "true" : "false");
        }
        // Reload to see changes
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to toggle demo mode:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={toggleDemoMode}
      disabled={loading}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
        enabled ? "bg-gradient-to-r from-cyan-500 to-blue-500" : "bg-gray-600"
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={
        enabled
          ? "Demo mode: ON - Showing demo data"
          : "Demo mode: OFF - Showing real data"
      }
    >
      <motion.span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
          enabled ? "translate-x-7" : "translate-x-1"
        }`}
        layout
      />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-white">
        {enabled ? "DEMO" : "LIVE"}
      </span>
    </motion.button>
  );
}
