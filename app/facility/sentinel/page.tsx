"use client";

import PageTemplate from "@/components/PageTemplate";
import SentinelDashboard from "@/components/facility/sentinel/SentinelDashboard";

export default function SentinelPage() {
  return (
    <PageTemplate
      title="The Sentinel"
      description="Autonomous Facility Nervous System - Live Dependency Graph & Failure Analysis"
      icon="ri-mind-map" // Using a generic readable icon if mind-map exists, or map-pin
    >
      <div className="space-y-6">
        <SentinelDashboard />

        {/* Legend / Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg">
            <h3 className="text-green-400 font-semibold mb-1">Operational</h3>
            <p className="text-xs text-gray-400">
              Node is functioning within normal parameters. Dependencies are
              satisfied.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg">
            <h3 className="text-amber-400 font-semibold mb-1">Warning</h3>
            <p className="text-xs text-gray-400">
              Redundancy lost or partial dependency failure detected. Risk
              elevated.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg">
            <h3 className="text-red-400 font-semibold mb-1">
              Critical / Failed
            </h3>
            <p className="text-xs text-gray-400">
              Node has ceased function due to direct damage or cascading
              power/data loss.
            </p>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
