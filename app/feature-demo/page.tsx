"use client";

/**
 * Feature Tooltips Demo Page
 * Visualize the feature requirements tooltip system before rollout
 * Path: /feature-demo
 */

import React, { useState } from "react";
import { FeatureTooltip, FeatureCard } from "@/components/ui/FeatureTooltip";
import {
  featureRequirements,
  getFeaturesByPhase,
  getFeaturesByPriority,
  getFeaturesByStatus,
} from "@/data/featureRequirements";
import { FeatureRequirement } from "@/types/featureTooltips";

// Phase labels
const phaseLabels: Record<number, string> = {
  1: "Phase 1: IoT Management System",
  2: "Phase 2: Dashboard Management",
  3: "Phase 3: Enhanced Dashboards",
  4: "Phase 4: Edge AI & Model Deployment",
  5: "Phase 5: Network Optimization",
};

export default function FeatureDemoPage() {
  const [selectedFeature, setSelectedFeature] =
    useState<FeatureRequirement | null>(null);
  const [viewMode, setViewMode] = useState<"phase" | "priority" | "status">(
    "phase",
  );
  const [filterPriority, setFilterPriority] = useState<
    "ALL" | "HIGH" | "MEDIUM" | "LOW"
  >("ALL");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            🚀 Feature Requirements Demo
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Hover over any feature card to see its requirements tooltip
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 mr-2">Group by:</span>
          <div className="flex rounded-lg border border-slate-700 overflow-hidden">
            {["phase", "priority", "status"].map((mode) => (
              <button
                key={mode}
                onClick={() =>
                  setViewMode(mode as "phase" | "priority" | "status")
                }
                className={`px-3 py-1.5 text-xs font-medium transition-all ${
                  viewMode === mode
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Features"
          value={featureRequirements.length}
          icon="📦"
          color="cyan"
        />
        <StatCard
          label="High Priority"
          value={getFeaturesByPriority("HIGH").length}
          icon="🔴"
          color="red"
        />
        <StatCard
          label="Ready"
          value={getFeaturesByStatus("ready").length}
          icon="✅"
          color="green"
        />
        <StatCard
          label="Planned"
          value={getFeaturesByStatus("planned").length}
          icon="📋"
          color="purple"
        />
      </div>

      {/* Instructions */}
      <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-semibold text-cyan-400 mb-1">How to Use</h3>
            <p className="text-sm text-slate-300">
              <strong>Hover over any feature card</strong> to see a detailed
              tooltip with:
            </p>
            <ul className="text-sm text-slate-400 mt-2 grid grid-cols-1 md:grid-cols-2 gap-1">
              <li>
                • <span className="text-orange-400">Dependencies</span> -
                Required modules
              </li>
              <li>
                • <span className="text-slate-300">Required Services</span> -
                Service files
              </li>
              <li>
                • <span className="text-indigo-400">Integration Points</span> -
                Systems to connect
              </li>
              <li>
                • <span className="text-cyan-400">Time Estimate</span> -
                Implementation duration
              </li>
              <li>
                • <span className="text-purple-400">4IR/5IR Alignment</span> -
                Industrial revolution compatibility
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Priority Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">Filter by priority:</span>
        <div className="flex gap-2">
          {["ALL", "HIGH", "MEDIUM", "LOW"].map((priority) => (
            <button
              key={priority}
              onClick={() =>
                setFilterPriority(priority as "ALL" | "HIGH" | "MEDIUM" | "LOW")
              }
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterPriority === priority
                  ? priority === "HIGH"
                    ? "bg-red-500 text-white"
                    : priority === "MEDIUM"
                      ? "bg-yellow-500 text-black"
                      : priority === "LOW"
                        ? "bg-green-500 text-white"
                        : "bg-cyan-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {priority === "ALL"
                ? "🎯 All"
                : priority === "HIGH"
                  ? "🔴 High"
                  : priority === "MEDIUM"
                    ? "🟡 Medium"
                    : "🟢 Low"}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Cards Grid - By Phase */}
      {viewMode === "phase" && (
        <div className="space-y-8">
          {[1, 2, 3, 4, 5].map((phase) => {
            const phaseFeatures = getFeaturesByPhase(phase).filter(
              (f) => filterPriority === "ALL" || f.priority === filterPriority,
            );
            if (phaseFeatures.length === 0) return null;

            return (
              <section key={phase}>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                    {phase}
                  </span>
                  {phaseLabels[phase]}
                  <span className="text-sm text-slate-500 font-normal ml-2">
                    ({phaseFeatures.length} feature
                    {phaseFeatures.length !== 1 ? "s" : ""})
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {phaseFeatures.map((feature) => (
                    <FeatureCard
                      key={feature.id}
                      feature={feature}
                      onClick={() => setSelectedFeature(feature)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Feature Cards Grid - By Priority */}
      {viewMode === "priority" && (
        <div className="space-y-8">
          {(["HIGH", "MEDIUM", "LOW"] as const).map((priority) => {
            const priorityFeatures = getFeaturesByPriority(priority).filter(
              (f) => filterPriority === "ALL" || f.priority === filterPriority,
            );
            if (priorityFeatures.length === 0) return null;

            const icons = { HIGH: "🔴", MEDIUM: "🟡", LOW: "🟢" };
            const colors = {
              HIGH: "from-red-500 to-orange-500",
              MEDIUM: "from-yellow-500 to-amber-500",
              LOW: "from-green-500 to-emerald-500",
            };

            return (
              <section key={priority}>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span
                    className={`w-8 h-8 rounded-full bg-gradient-to-r ${colors[priority]} flex items-center justify-center text-sm`}
                  >
                    {icons[priority]}
                  </span>
                  {priority} Priority
                  <span className="text-sm text-slate-500 font-normal ml-2">
                    ({priorityFeatures.length} feature
                    {priorityFeatures.length !== 1 ? "s" : ""})
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {priorityFeatures.map((feature) => (
                    <FeatureCard
                      key={feature.id}
                      feature={feature}
                      onClick={() => setSelectedFeature(feature)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Feature Cards Grid - By Status */}
      {viewMode === "status" && (
        <div className="space-y-8">
          {(["ready", "partial", "planned", "not-ready"] as const).map(
            (status) => {
              const statusFeatures = getFeaturesByStatus(status).filter(
                (f) =>
                  filterPriority === "ALL" || f.priority === filterPriority,
              );
              if (statusFeatures.length === 0) return null;

              const icons = {
                ready: "✅",
                partial: "🔧",
                planned: "📋",
                "not-ready": "❌",
              };
              const labels = {
                ready: "Ready",
                partial: "Partial",
                planned: "Planned",
                "not-ready": "Not Ready",
              };
              const colors = {
                ready: "from-emerald-500 to-green-500",
                partial: "from-blue-500 to-cyan-500",
                planned: "from-purple-500 to-violet-500",
                "not-ready": "from-red-500 to-rose-500",
              };

              return (
                <section key={status}>
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span
                      className={`w-8 h-8 rounded-full bg-gradient-to-r ${colors[status]} flex items-center justify-center text-sm`}
                    >
                      {icons[status]}
                    </span>
                    {labels[status]}
                    <span className="text-sm text-slate-500 font-normal ml-2">
                      ({statusFeatures.length} feature
                      {statusFeatures.length !== 1 ? "s" : ""})
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {statusFeatures.map((feature) => (
                      <FeatureCard
                        key={feature.id}
                        feature={feature}
                        onClick={() => setSelectedFeature(feature)}
                      />
                    ))}
                  </div>
                </section>
              );
            },
          )}
        </div>
      )}

      {/* Selected Feature Detail Modal */}
      {selectedFeature && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setSelectedFeature(null)}
        >
          <div
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  {selectedFeature.name}
                </h2>
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="text-slate-400 hover:text-white transition-colors text-xl"
                >
                  ✕
                </button>
              </div>

              <p className="text-slate-300 mb-6">
                {selectedFeature.description}
              </p>

              {/* Capabilities */}
              {selectedFeature.capabilities && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Key Capabilities
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedFeature.capabilities.map((cap, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-slate-300"
                      >
                        <span className="text-cyan-400">✓</span>
                        {cap}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                  <div className="text-xs text-slate-500 mb-1">Priority</div>
                  <div
                    className={`font-bold ${
                      selectedFeature.priority === "HIGH"
                        ? "text-red-400"
                        : selectedFeature.priority === "MEDIUM"
                          ? "text-yellow-400"
                          : "text-green-400"
                    }`}
                  >
                    {selectedFeature.priority}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                  <div className="text-xs text-slate-500 mb-1">Time</div>
                  <div className="font-bold text-cyan-400">
                    {selectedFeature.estimatedTime}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                  <div className="text-xs text-slate-500 mb-1">Phase</div>
                  <div className="font-bold text-purple-400">
                    {selectedFeature.phase || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-8 border-t border-slate-800/50 text-center text-sm text-slate-500">
        <p>Feature Tooltips Demo • BlueDXP Platform • Hazalyze Module</p>
        <p className="mt-1 text-xs">
          This is a preview. Hover over cards to see tooltips in action.
        </p>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    cyan: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30",
    red: "from-red-500/20 to-orange-500/20 border-red-500/30",
    green: "from-green-500/20 to-emerald-500/20 border-green-500/30",
    purple: "from-purple-500/20 to-violet-500/20 border-purple-500/30",
  };

  return (
    <div
      className={`p-4 rounded-xl border bg-gradient-to-br ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
