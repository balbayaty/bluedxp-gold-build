/**
 * Pulse Missions Page
 * View and claim missions
 */

"use client";

import { useState, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PageTemplate from "@/components/PageTemplate";
import { useApiFetch } from "@/hooks/useApiFetch";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import type { PulseMission } from "@/types/pulse";
import { PremiumLoader } from "@/components/loading";

function PulseMissionsContent() {
  const [period, setPeriod] = useState<"today" | "week">("today");
  const {
    data: missions,
    loading,
    error,
    errorMessage,
    fetchData,
  } = useApiFetch<PulseMission[]>({
    module: "pulse",
    service: "missions",
    retries: 2,
  });
  const { handleError } = useErrorHandler({
    module: "pulse",
    service: "missions",
  });

  useEffect(() => {
    fetchData(`/api/pulse/missions?period=${period}`);
  }, [period, fetchData]);

  const claimMission = async (missionId: string) => {
    try {
      const res = await fetch("/api/pulse/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ missionId }),
      });
      const data = await res.json();
      if (data.success) {
        // Use toast notification in production instead of alert
        // For now, show success message
        await fetchData(`/api/pulse/missions?period=${period}`);
      } else {
        handleError(new Error(data.error || "Failed to claim mission"), {
          code: "MISSION_CLAIM_ERROR",
          retryable: true,
        });
      }
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error("Failed to claim mission"),
        {
          code: "MISSION_CLAIM_ERROR",
          retryable: true,
        },
      );
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Missions"
        description="Complete missions to earn Pulse Points and Impact Credits"
        icon="ri-target-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Loading missions..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate
        title="Missions"
        description="Complete missions to earn Pulse Points and Impact Credits"
        icon="ri-target-line"
      >
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Error Loading Missions
            </h3>
            <p className="text-red-600 mb-4">
              {errorMessage || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => fetchData(`/api/pulse/missions?period=${period}`)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Missions"
      description="Complete missions to earn Pulse Points and Impact Credits"
      icon="ri-target-line"
    >
      <div className="space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod("today")}
            className={`px-4 py-2 rounded ${period === "today" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod("week")}
            className={`px-4 py-2 rounded ${period === "week" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            This Week
          </button>
        </div>

        {/* Missions List */}
        {missions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No missions available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {missions.map((mission) => (
              <div key={mission.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{mission.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {mission.description}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      mission.missionType === "DAILY"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-purple-100 text-purple-600"
                    }`}
                  >
                    {mission.missionType}
                  </span>
                </div>

                {/* Requirements */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">Requirements:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {(mission.requirementsJson as any[]).map((req, idx) => (
                      <li key={idx}>
                        • {req.description || `${req.type}: ${req.count || 1}`}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Rewards */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <div className="text-sm font-semibold text-blue-600">
                      +{mission.rewardJson.PP} PP
                    </div>
                    <div className="text-xs text-gray-500">
                      +{mission.rewardJson.IC} IC
                    </div>
                  </div>
                  <button
                    onClick={() => claimMission(mission.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Claim
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

export default function PulseMissionsPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Missions"
          description="Complete missions to earn Pulse Points and Impact Credits"
          icon="ri-target-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <PulseMissionsContent />
    </ErrorBoundary>
  );
}
