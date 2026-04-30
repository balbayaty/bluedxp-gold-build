"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ComplianceRule,
  ComplianceViolation,
  ComplianceAction,
} from "@/types/intelligentOrchestration";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface AutonomousComplianceProps {
  rules: ComplianceRule[];
  violations: ComplianceViolation[];
  onRuleCreate?: (rule: Partial<ComplianceRule>) => void;
  onRuleUpdate?: (ruleId: string, updates: Partial<ComplianceRule>) => void;
  onRuleDelete?: (ruleId: string) => void;
  onViolationResolve?: (violationId: string) => void;
}

export default function AutonomousCompliance({
  rules,
  violations,
  onRuleCreate,
  onRuleUpdate,
  onRuleDelete,
  onViolationResolve,
}: AutonomousComplianceProps) {
  const [viewMode, setViewMode] = useState<
    "overview" | "rules" | "violations" | "analytics"
  >("overview");
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [selectedViolation, setSelectedViolation] = useState<string | null>(
    null,
  );
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "ACTIVE" | "RESOLVED" | "PENDING"
  >("ALL");
  const [filterSeverity, setFilterSeverity] = useState<
    "ALL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  >("ALL");
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);

  // Filter violations
  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "RESOLVED" && v.resolved) ||
        (filterStatus === "PENDING" && !v.resolved);
      const matchesSeverity =
        filterSeverity === "ALL" || v.severity === filterSeverity;
      return matchesStatus && matchesSeverity;
    });
  }, [violations, filterStatus, filterSeverity]);

  // Statistics
  const stats = useMemo(() => {
    const totalRules = rules.length;
    const activeRules = rules.filter((r) => r.isActive).length;
    const totalViolations = violations.length;
    const resolvedViolations = violations.filter((v) => v.resolved).length;
    const criticalViolations = violations.filter(
      (v) => v.severity === "CRITICAL" && !v.resolved,
    ).length;
    const autoEnforced = rules.filter((r) => r.autoEnforce).length;

    return {
      totalRules,
      activeRules,
      totalViolations,
      resolvedViolations,
      resolutionRate:
        totalViolations > 0 ? (resolvedViolations / totalViolations) * 100 : 0,
      criticalViolations,
      autoEnforced,
    };
  }, [rules, violations]);

  // Violations by severity
  const violationsBySeverity = useMemo(() => {
    const severityCounts: Record<string, number> = {};
    violations.forEach((v) => {
      severityCounts[v.severity] = (severityCounts[v.severity] || 0) + 1;
    });
    return Object.entries(severityCounts).map(([severity, count]) => ({
      severity,
      count,
    }));
  }, [violations]);

  // Violations over time
  const violationsOverTime = useMemo(() => {
    const sorted = [...violations].sort(
      (a, b) =>
        new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime(),
    );
    const grouped = new Map<string, { detected: number; resolved: number }>();

    sorted.slice(0, 30).forEach((v) => {
      const date = format(new Date(v.detectedAt), "MMM dd");
      if (!grouped.has(date)) {
        grouped.set(date, { detected: 0, resolved: 0 });
      }
      const group = grouped.get(date)!;
      group.detected++;
      if (v.resolved) group.resolved++;
    });

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }, [violations]);

  // Rules by category
  const rulesByCategory = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    rules.forEach((r) => {
      categoryCounts[r.ruleCategory] =
        (categoryCounts[r.ruleCategory] || 0) + 1;
    });
    return Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
    }));
  }, [rules]);

  const selectedRuleData = useMemo(() => {
    return rules.find((r) => r.id === selectedRule);
  }, [rules, selectedRule]);

  const selectedViolationData = useMemo(() => {
    return violations.find((v) => v.id === selectedViolation);
  }, [violations, selectedViolation]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "#ef4444";
      case "HIGH":
        return "#f59e0b";
      case "MEDIUM":
        return "#eab308";
      case "LOW":
        return "#84cc16";
      default:
        return "#6b7280";
    }
  };

  const getViolationTypeColor = (type: string) => {
    switch (type) {
      case "BREACH":
        return "#ef4444";
      case "AT_RISK":
        return "#f59e0b";
      case "WARNING":
        return "#eab308";
      case "EXCEPTION":
        return "#8b5cf6";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="space-y-6">
      {/* View Mode Selector */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
        {(["overview", "rules", "violations", "analytics"] as const).map(
          (mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === mode
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                  : "text-[#9ca3af] hover:text-white hover:bg-white/5"
              }`}
            >
              <i
                className={`ri-${mode === "overview" ? "dashboard-line" : mode === "rules" ? "file-list-line" : mode === "violations" ? "alert-line" : "bar-chart-line"} text-base`}
              ></i>
              <span className="capitalize">{mode}</span>
            </button>
          ),
        )}
      </div>

      {/* Overview Mode */}
      {viewMode === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <i className="ri-file-list-line text-blue-400 text-2xl"></i>
              </div>
              <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full">
                {stats.activeRules} active
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.totalRules}
            </div>
            <div className="text-sm text-blue-300">Total Rules</div>
            <div className="mt-4 text-xs text-blue-200">
              {stats.autoEnforced} auto-enforced
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30 rounded-2xl p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <i className="ri-alert-line text-red-400 text-2xl"></i>
              </div>
              <span className="text-xs text-red-300 bg-red-500/20 px-2 py-1 rounded-full">
                {stats.criticalViolations} critical
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.totalViolations}
            </div>
            <div className="text-sm text-red-300">Total Violations</div>
            <div className="mt-4 text-xs text-red-200">
              {stats.resolvedViolations} resolved
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-green-400 text-2xl"></i>
              </div>
              <span className="text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded-full">
                {stats.resolutionRate.toFixed(1)}%
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.resolutionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-green-300">Resolution Rate</div>
            <div className="mt-4 text-xs text-green-200">
              {stats.resolvedViolations} of {stats.totalViolations} resolved
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <i className="ri-shield-check-line text-purple-400 text-2xl"></i>
              </div>
              <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full">
                Auto
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.autoEnforced}
            </div>
            <div className="text-sm text-purple-300">Auto-Enforced Rules</div>
            <div className="mt-4 text-xs text-purple-200">
              {stats.totalRules > 0
                ? ((stats.autoEnforced / stats.totalRules) * 100).toFixed(0)
                : 0}
              % of rules
            </div>
          </motion.div>
        </div>
      )}

      {/* Rules Mode */}
      {viewMode === "rules" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <i className="ri-file-list-line text-cyan-400 text-xl"></i>
              Compliance Rules ({rules.length})
            </h3>
            <button
              onClick={() => setShowCreateRuleModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <i className="ri-add-line text-base"></i>
              Create Rule
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rules.map((rule, index) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() =>
                  setSelectedRule(selectedRule === rule.id ? null : rule.id)
                }
                className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 cursor-pointer transition-all ${
                  selectedRule === rule.id
                    ? "border-cyan-500 shadow-lg shadow-cyan-500/20"
                    : "border-white/10 hover:border-cyan-500/50"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-white">
                        {rule.name}
                      </h4>
                      {rule.isActive && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                          <i className="ri-checkbox-circle-line text-sm"></i>
                          Active
                        </span>
                      )}
                      {rule.autoEnforce && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full flex items-center gap-1">
                          <i className="ri-flashlight-line text-sm"></i>
                          Auto-Enforce
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          rule.priority === "CRITICAL"
                            ? "bg-red-500/20 text-red-400"
                            : rule.priority === "HIGH"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {rule.priority}
                      </span>
                    </div>
                    <p className="text-sm text-[#9ca3af] mb-3">
                      {rule.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
                      <span>Type: {rule.ruleType}</span>
                      <span>Category: {rule.ruleCategory}</span>
                      <span>Actions: {rule.actions.length}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedRule === rule.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <div className="space-y-4">
                        {/* Conditions */}
                        {rule.conditions && rule.conditions.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold text-white mb-2">
                              Conditions
                            </div>
                            <div className="space-y-2">
                              {rule.conditions.map((condition, i) => (
                                <div
                                  key={i}
                                  className="p-2 bg-white/5 rounded-lg border border-white/10 text-xs text-[#9ca3af]"
                                >
                                  {condition.field} {condition.operator}{" "}
                                  {String(condition.value)}
                                  {condition.logicalOperator &&
                                    ` ${condition.logicalOperator}`}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        {rule.actions && rule.actions.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold text-white mb-2">
                              Actions
                            </div>
                            <div className="space-y-2">
                              {rule.actions.map((action, i) => (
                                <div
                                  key={i}
                                  className="p-2 bg-white/5 rounded-lg border border-white/10 text-xs text-[#9ca3af]"
                                >
                                  <div className="text-white font-medium">
                                    {action.actionType}
                                  </div>
                                  <div>Target: {action.target}</div>
                                  {action.delay && (
                                    <div>Delay: {action.delay}s</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Escalation Rules */}
                        {rule.escalationRules &&
                          rule.escalationRules.length > 0 && (
                            <div>
                              <div className="text-sm font-semibold text-white mb-2">
                                Escalation Rules
                              </div>
                              <div className="space-y-2">
                                {rule.escalationRules.map((escalation, i) => (
                                  <div
                                    key={i}
                                    className="p-2 bg-white/5 rounded-lg border border-white/10 text-xs text-[#9ca3af]"
                                  >
                                    <div className="text-white font-medium">
                                      {escalation.level}
                                    </div>
                                    <div>
                                      Threshold: {escalation.threshold}%
                                    </div>
                                    <div>Timeframe: {escalation.timeframe}</div>
                                    <div>
                                      Stakeholders:{" "}
                                      {escalation.stakeholders.join(", ")}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Violations Mode */}
      {viewMode === "violations" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
              {(["ALL", "PENDING", "RESOLVED"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterStatus === status
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                      : "text-[#9ca3af] hover:text-white hover:bg-white/5"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Violations List */}
          <div className="space-y-4">
            {filteredViolations.map((violation, index) => (
              <motion.div
                key={violation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() =>
                  setSelectedViolation(
                    selectedViolation === violation.id ? null : violation.id,
                  )
                }
                className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 cursor-pointer transition-all ${
                  selectedViolation === violation.id
                    ? "border-cyan-500 shadow-lg shadow-cyan-500/20"
                    : "border-white/10 hover:border-cyan-500/50"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-white">
                        {violation.ruleName}
                      </h4>
                      <span
                        className="px-2 py-1 text-xs rounded-full"
                        style={{
                          backgroundColor: `${getSeverityColor(violation.severity)}20`,
                          color: getSeverityColor(violation.severity),
                        }}
                      >
                        {violation.severity}
                      </span>
                      <span
                        className="px-2 py-1 text-xs rounded-full"
                        style={{
                          backgroundColor: `${getViolationTypeColor(violation.violationType)}20`,
                          color: getViolationTypeColor(violation.violationType),
                        }}
                      >
                        {violation.violationType}
                      </span>
                      {violation.resolved && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                          <i className="ri-checkbox-circle-line text-sm"></i>
                          Resolved
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#9ca3af] mb-3">
                      <span>
                        Entity: {violation.entityType} ({violation.entityId})
                      </span>
                      <span>
                        Detected:{" "}
                        {format(
                          new Date(violation.detectedAt),
                          "MMM dd, HH:mm",
                        )}
                      </span>
                      {violation.resolvedAt && (
                        <span>
                          Resolved:{" "}
                          {format(
                            new Date(violation.resolvedAt),
                            "MMM dd, HH:mm",
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  {!violation.resolved && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViolationResolve?.(violation.id);
                      }}
                      className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <i className="ri-checkbox-circle-line text-base"></i>
                      Resolve
                    </button>
                  )}
                </div>

                {/* Impact */}
                {(violation.impact.duration ||
                  violation.impact.cost ||
                  violation.impact.quality ||
                  violation.impact.reputation) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    {violation.impact.duration && (
                      <div>
                        <div className="text-xs text-[#9ca3af] mb-1">
                          Duration Impact
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {(violation.impact.duration / 3600).toFixed(1)}h
                        </div>
                      </div>
                    )}
                    {violation.impact.cost && (
                      <div>
                        <div className="text-xs text-[#9ca3af] mb-1">
                          Cost Impact
                        </div>
                        <div className="text-lg font-semibold text-white">
                          ${violation.impact.cost.toFixed(2)}
                        </div>
                      </div>
                    )}
                    {violation.impact.quality && (
                      <div>
                        <div className="text-xs text-[#9ca3af] mb-1">
                          Quality Impact
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {violation.impact.quality.toFixed(1)}%
                        </div>
                      </div>
                    )}
                    {violation.impact.reputation && (
                      <div>
                        <div className="text-xs text-[#9ca3af] mb-1">
                          Reputation Impact
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {violation.impact.reputation.toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {violation.actions && violation.actions.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-white mb-2">
                      Actions Taken
                    </div>
                    <div className="space-y-2">
                      {violation.actions.map((action, i) => (
                        <div
                          key={i}
                          className="p-2 bg-white/5 rounded-lg border border-white/10 text-xs text-[#9ca3af]"
                        >
                          <div className="text-white font-medium">
                            {action.actionType}
                          </div>
                          <div>Target: {action.target}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedViolation === violation.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-semibold text-white mb-2">
                            Violation Details
                          </div>
                          <div className="space-y-2 text-sm text-[#9ca3af]">
                            <div>
                              <span className="text-white">Rule ID:</span>{" "}
                              {violation.ruleId}
                            </div>
                            <div>
                              <span className="text-white">Entity ID:</span>{" "}
                              {violation.entityId}
                            </div>
                            <div>
                              <span className="text-white">Entity Type:</span>{" "}
                              {violation.entityType}
                            </div>
                            {violation.caseId && (
                              <div>
                                <span className="text-white">Case ID:</span>{" "}
                                {violation.caseId}
                              </div>
                            )}
                            <div>
                              <span className="text-white">Detected:</span>{" "}
                              {format(
                                new Date(violation.detectedAt),
                                "MMM dd, yyyy HH:mm",
                              )}
                            </div>
                            {violation.resolvedAt && (
                              <div>
                                <span className="text-white">Resolved:</span>{" "}
                                {format(
                                  new Date(violation.resolvedAt),
                                  "MMM dd, yyyy HH:mm",
                                )}{" "}
                                by {violation.resolvedBy}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white mb-2">
                            Impact Analysis
                          </div>
                          <div className="space-y-2 text-sm text-[#9ca3af]">
                            {Object.entries(violation.impact).map(
                              ([key, value]) => (
                                <div key={key}>
                                  <span className="text-white capitalize">
                                    {key}:
                                  </span>{" "}
                                  {String(value)}
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Mode */}
      {viewMode === "analytics" && (
        <div className="space-y-6">
          {/* Violations by Severity */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <i className="ri-pie-chart-line text-cyan-400 text-xl"></i>
              Violations by Severity
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={violationsBySeverity}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ severity, percent }) =>
                    `${severity}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {violationsBySeverity.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getSeverityColor(entry.severity)}
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Violations Over Time */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <i className="ri-line-chart-line text-green-400 text-xl"></i>
              Violations Over Time
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={violationsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="detected"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                  name="Detected"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  name="Resolved"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Rules by Category */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <i className="ri-bar-chart-line text-purple-400 text-xl"></i>
              Rules by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rulesByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="category" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
