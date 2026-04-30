/**
 * Example: How to integrate HazalyzeCopilotWidget into your dashboard
 *
 * This is a reference implementation showing best practices
 */

"use client";

import { useState, useEffect } from "react";
import { HazalyzeCopilotWidget } from "./HazalyzeCopilotWidget";

interface DashboardIntegrationExampleProps {
  tenantId: string;
  userId: string;
}

export function DashboardIntegrationExample({
  tenantId,
  userId,
}: DashboardIntegrationExampleProps) {
  const [showCopilot, setShowCopilot] = useState(true);

  // Load copilot visibility preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("copilot-visible");
    if (saved !== null) {
      setShowCopilot(saved === "true");
    }
  }, []);

  // Save preference
  const handleToggleCopilot = () => {
    const newValue = !showCopilot;
    setShowCopilot(newValue);
    localStorage.setItem("copilot-visible", String(newValue));
  };

  return (
    <div className="relative min-h-screen">
      {/* Your dashboard content */}
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

        {/* Example: Toggle button */}
        <button
          onClick={handleToggleCopilot}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showCopilot ? "Hide" : "Show"} Copilot
        </button>

        {/* Your dashboard widgets, charts, etc. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Dashboard widgets here */}
        </div>
      </div>

      {/* HazalyzeCopilot Widget */}
      {showCopilot && (
        <HazalyzeCopilotWidget
          tenantId={tenantId}
          userId={userId}
          defaultPosition={{ x: window.innerWidth - 440, y: 80 }}
          defaultSize={{ width: 420, height: 600 }}
          onClose={handleToggleCopilot}
        />
      )}
    </div>
  );
}

/**
 * Alternative: Minimal integration (just add the widget)
 */
export function MinimalIntegration({
  tenantId,
  userId,
}: DashboardIntegrationExampleProps) {
  return (
    <div>
      {/* Your dashboard */}
      <div>Dashboard content</div>

      {/* Copilot widget - that's it! */}
      <HazalyzeCopilotWidget tenantId={tenantId} userId={userId} />
    </div>
  );
}
