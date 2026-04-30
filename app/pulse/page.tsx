/**
 * Pulse Overview Page
 * Main dashboard for Pulse module
 */

"use client";

import { useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PageTemplate from "@/components/PageTemplate";
import { useApiFetch } from "@/hooks/useApiFetch";
import type { PulseOverview } from "@/types/pulse";
import { PremiumLoader } from "@/components/loading";

function PulseOverviewContent() {
  const {
    data: overview,
    loading,
    error,
    errorMessage,
    fetchData,
  } = useApiFetch<PulseOverview>({
    module: "pulse",
    service: "overview",
    retries: 2,
    retryDelay: 1000,
  });

  useEffect(() => {
    fetchData("/api/pulse/overview");
  }, [fetchData]);

  if (loading) {
    return (
      <PageTemplate
        title="Pulse Overview"
        description="Wellbeing + Gamified Execution + Tokens + Scoreboards"
        icon="ri-pulse-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Loading Pulse overview..."
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
        title="Pulse Overview"
        description="Wellbeing + Gamified Execution + Tokens + Scoreboards"
        icon="ri-pulse-line"
      >
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Error Loading Overview
            </h3>
            <p className="text-red-600 mb-4">
              {errorMessage || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => fetchData("/api/pulse/overview")}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (!overview) {
    return (
      <PageTemplate
        title="Pulse Overview"
        description="Wellbeing + Gamified Execution + Tokens + Scoreboards"
        icon="ri-pulse-line"
      >
        <div className="text-center py-12">
          <p className="text-gray-500">No data available</p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Pulse Overview"
      description="Wellbeing + Gamified Execution + Tokens + Scoreboards"
      icon="ri-pulse-line"
    >
      <div className="space-y-6">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Pulse Points</div>
            <div className="text-3xl font-bold text-blue-600">
              {overview.balance.balancePP}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Lifetime: {overview.balance.lifetimePP}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Impact Credits</div>
            <div className="text-3xl font-bold text-green-600">
              {overview.balance.balanceIC}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Lifetime: {overview.balance.lifetimeIC}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Today's Points</div>
            <div className="text-3xl font-bold text-purple-600">
              {overview.todayProgress.pointsEarned}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Credits: {overview.todayProgress.creditsEarned}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Missions</div>
            <div className="text-3xl font-bold text-orange-600">
              {overview.todayProgress.completed}/
              {overview.todayProgress.missions}
            </div>
            <div className="text-xs text-gray-400 mt-1">Completed today</div>
          </div>
        </div>

        {/* Pillar Scores */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Pillar Scores (Today)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Move</div>
              <div className="text-2xl font-bold text-blue-600">
                {overview.pillarScores.Move}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Execute</div>
              <div className="text-2xl font-bold text-green-600">
                {overview.pillarScores.Execute}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Safe</div>
              <div className="text-2xl font-bold text-red-600">
                {overview.pillarScores.Safe}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Grow</div>
              <div className="text-2xl font-bold text-purple-600">
                {overview.pillarScores.Grow}
              </div>
            </div>
          </div>
        </div>

        {/* Active Missions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Active Missions</h3>
          {overview.activeMissions.length === 0 ? (
            <p className="text-gray-500">No active missions</p>
          ) : (
            <div className="space-y-3">
              {overview.activeMissions.map((mission) => (
                <div key={mission.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{mission.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {mission.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-blue-600">
                        +{mission.rewardJson.PP} PP
                      </div>
                      <div className="text-xs text-gray-500">
                        +{mission.rewardJson.IC} IC
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          {overview.recentEvents.length === 0 ? (
            <p className="text-gray-500">No recent activity</p>
          ) : (
            <div className="space-y-2">
              {overview.recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-700">{event.eventType}</span>
                  <span className="font-semibold text-blue-600">
                    +{event.pointsAwardedPP} PP
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
}

export default function PulseOverviewPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Pulse Overview"
          description="Wellbeing + Gamified Execution + Tokens + Scoreboards"
          icon="ri-pulse-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <PulseOverviewContent />
    </ErrorBoundary>
  );
}
