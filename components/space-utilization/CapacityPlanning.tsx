"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import {
  CapacityPlan,
  CapacityAction,
  CapacityRisk,
} from "@/types/spaceUtilization";
import { format } from "date-fns";
import Modal from "@/components/Modal";
import Tooltip from "@/components/Tooltip";

interface CapacityPlanningProps {
  plans: CapacityPlan[];
  onPlanSelect?: (plan: CapacityPlan) => void;
  className?: string;
}

export default function CapacityPlanning({
  plans,
  onPlanSelect,
  className = "",
}: CapacityPlanningProps) {
  const [selectedPlan, setSelectedPlan] = useState<CapacityPlan | null>(null);
  const [viewMode, setViewMode] = useState<
    "overview" | "projections" | "actions" | "risks"
  >("overview");

  // Active Plans
  const activePlans = useMemo(() => {
    return plans.filter(
      (p) => p.status === "APPROVED" || p.status === "IN_PROGRESS",
    );
  }, [plans]);

  // Projection Data
  const projectionData = useMemo(() => {
    if (!selectedPlan) return [];

    return selectedPlan.customerProjections.map((projection) => ({
      name: projection.customerName.substring(0, 15),
      current: projection.currentAllocation.usedArea,
      projected: projection.projectedAllocation.area,
      growth: projection.projectedAllocation.growthRate,
      confidence: projection.confidence,
    }));
  }, [selectedPlan]);

  // Actions Timeline
  const actionsTimeline = useMemo(() => {
    if (!selectedPlan) return [];

    return selectedPlan.actions
      .filter((a) => a.status !== "CANCELLED")
      .sort(
        (a, b) =>
          new Date(a.timeline.start).getTime() -
          new Date(b.timeline.start).getTime(),
      )
      .map((action) => ({
        name: action.description.substring(0, 20),
        start: format(new Date(action.timeline.start), "MMM dd"),
        end: format(new Date(action.timeline.end), "MMM dd"),
        cost: action.cost,
        impact: action.expectedImpact.utilizationChange,
        status: action.status,
      }));
  }, [selectedPlan]);

  // Risk Severity Distribution
  const riskDistribution = useMemo(() => {
    if (!selectedPlan) return [];

    const severities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
    return severities.map((severity) => ({
      severity,
      count: selectedPlan.risks.filter((r) => r.severity === severity).length,
      totalImpact: selectedPlan.risks
        .filter((r) => r.severity === severity)
        .reduce((sum, r) => sum + r.impact.utilization, 0),
    }));
  }, [selectedPlan]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Plans Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => {
              setSelectedPlan(plan);
              onPlanSelect?.(plan);
            }}
            className={`bg-white/5 backdrop-blur-xl border rounded-xl p-4 cursor-pointer transition-all ${
              selectedPlan?.id === plan.id
                ? "border-cyan-500 bg-cyan-500/10"
                : "border-white/10 hover:border-cyan-500/50"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white mb-1">
                  {plan.planName}
                </h4>
                <p className="text-xs text-[#9ca3af]">
                  {plan.planType.replace("_", " ")}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  plan.status === "APPROVED"
                    ? "bg-green-500/20 text-green-400"
                    : plan.status === "IN_PROGRESS"
                      ? "bg-blue-500/20 text-blue-400"
                      : plan.status === "COMPLETED"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {plan.status}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9ca3af]">Current Utilization</span>
                <span className="text-white font-medium">
                  {plan.currentUtilization.utilizationPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9ca3af]">Projected Utilization</span>
                <span className="text-white font-medium">
                  {plan.projectedUtilization.utilizationPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9ca3af]">Actions</span>
                <span className="text-white font-medium">
                  {plan.actions.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9ca3af]">Risks</span>
                <span className="text-white font-medium">
                  {
                    plan.risks.filter(
                      (r) => r.severity === "CRITICAL" || r.severity === "HIGH",
                    ).length
                  }
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selected Plan Details */}
      {selectedPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <i className="ri-file-chart-line text-cyan-400 text-lg"></i>
              <span>{selectedPlan.planName}</span>
            </h3>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
              {(["overview", "projections", "actions", "risks"] as const).map(
                (mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      viewMode === mode
                        ? "bg-cyan-500 text-white"
                        : "text-[#9ca3af] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Overview */}
          {viewMode === "overview" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-4">
                    Current vs Projected
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={[
                        {
                          name: "Current",
                          utilization:
                            selectedPlan.currentUtilization
                              .utilizationPercentage,
                          pallets:
                            selectedPlan.currentUtilization.usedPalletPositions,
                        },
                        {
                          name: "Projected",
                          utilization:
                            selectedPlan.projectedUtilization
                              .utilizationPercentage,
                          pallets:
                            selectedPlan.projectedUtilization
                              .usedPalletPositions,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Bar
                        dataKey="utilization"
                        fill="#06b6d4"
                        name="Utilization %"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white mb-4">
                    Risk Distribution
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={riskDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="severity"
                        stroke="#9ca3af"
                        fontSize={12}
                      />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Bar dataKey="count" fill="#ef4444" name="Risk Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Projections */}
          {viewMode === "projections" && projectionData.length > 0 && (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar
                    dataKey="current"
                    fill="#374151"
                    name="Current Area (m²)"
                  />
                  <Bar
                    dataKey="projected"
                    fill="#06b6d4"
                    name="Projected Area (m²)"
                  />
                  <Line
                    type="monotone"
                    dataKey="growth"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Growth Rate %"
                  />
                  <Legend />
                </ComposedChart>
              </ResponsiveContainer>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                        Current
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                        Projected
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                        Growth
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                        Confidence
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {selectedPlan.customerProjections.map(
                      (projection, index) => (
                        <tr
                          key={projection.customerId}
                          className="hover:bg-white/5"
                        >
                          <td className="px-4 py-3 text-sm text-white">
                            {projection.customerName}
                          </td>
                          <td className="px-4 py-3 text-sm text-white">
                            {projection.currentAllocation.usedArea.toLocaleString()}{" "}
                            m²
                          </td>
                          <td className="px-4 py-3 text-sm text-white">
                            {projection.projectedAllocation.area.toLocaleString()}{" "}
                            m²
                          </td>
                          <td className="px-4 py-3 text-sm text-white">
                            {projection.projectedAllocation.growthRate > 0
                              ? "+"
                              : ""}
                            {projection.projectedAllocation.growthRate.toFixed(
                              1,
                            )}
                            %
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full bg-cyan-500"
                                  style={{ width: `${projection.confidence}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-white w-12 text-right">
                                {projection.confidence}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          {viewMode === "actions" && (
            <div className="space-y-4">
              <div className="grid gap-4">
                {selectedPlan.actions.map((action) => (
                  <div
                    key={action.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              action.type === "EXPAND"
                                ? "bg-green-500/20 text-green-400"
                                : action.type === "REDUCE"
                                  ? "bg-red-500/20 text-red-400"
                                  : action.type === "REALLOCATE"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : action.type === "OPTIMIZE"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {action.type}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              action.status === "COMPLETED"
                                ? "bg-green-500/20 text-green-400"
                                : action.status === "IN_PROGRESS"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {action.status}
                          </span>
                        </div>
                        <p className="text-sm text-white">
                          {action.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white">
                          {action.cost.toLocaleString()}{" "}
                          {selectedPlan.planName.includes("AED")
                            ? "AED"
                            : "USD"}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {format(new Date(action.timeline.start), "MMM dd")} -{" "}
                          {format(new Date(action.timeline.end), "MMM dd")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#9ca3af] mt-2">
                      <span>
                        Impact:{" "}
                        {action.expectedImpact.utilizationChange > 0 ? "+" : ""}
                        {action.expectedImpact.utilizationChange.toFixed(1)}%
                      </span>
                      <span>
                        Efficiency: +
                        {action.expectedImpact.efficiencyImprovement.toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {viewMode === "risks" && (
            <div className="space-y-4">
              {selectedPlan.risks.map((risk) => (
                <div
                  key={risk.id}
                  className={`border rounded-lg p-4 ${
                    risk.severity === "CRITICAL"
                      ? "bg-red-500/10 border-red-500/30"
                      : risk.severity === "HIGH"
                        ? "bg-orange-500/10 border-orange-500/30"
                        : risk.severity === "MEDIUM"
                          ? "bg-yellow-500/10 border-yellow-500/30"
                          : "bg-gray-500/10 border-gray-500/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            risk.severity === "CRITICAL"
                              ? "bg-red-500/20 text-red-400"
                              : risk.severity === "HIGH"
                                ? "bg-orange-500/20 text-orange-400"
                                : risk.severity === "MEDIUM"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {risk.severity}
                        </span>
                        <span className="text-xs text-[#9ca3af]">
                          {risk.type.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-white">{risk.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">
                        {risk.probability}% probability
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        {format(
                          new Date(risk.timeline.expectedDate),
                          "MMM dd, yyyy",
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-xs text-[#9ca3af] mb-1">
                      Mitigation:
                    </div>
                    <ul className="list-disc list-inside text-xs text-white space-y-1">
                      {risk.mitigation.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
