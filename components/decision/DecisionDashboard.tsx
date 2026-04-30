/**
 * Decision Infrastructure Dashboard
 * Interactive, comprehensive dashboard for managing decisions across the ecosystem
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type {
  DecisionRecord,
  DecisionStatistics,
  DecisionStatus,
  DecisionPrimitive,
} from "@/lib/services/decision-core/types";

interface DecisionDashboardProps {
  tenantId?: string;
  module?: string;
  entityType?: string;
  entityId?: string;
}

export default function DecisionDashboard({
  tenantId,
  module,
  entityType,
  entityId,
}: DecisionDashboardProps) {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [statistics, setStatistics] = useState<DecisionStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDecision, setSelectedDecision] =
    useState<DecisionRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<DecisionStatus[]>([]);
  const [filterPrimitive, setFilterPrimitive] = useState<DecisionPrimitive[]>(
    [],
  );
  const [viewMode, setViewMode] = useState<"list" | "timeline" | "stats">(
    "list",
  );

  useEffect(() => {
    loadDecisions();
    loadStatistics();
  }, [tenantId, module, entityType, entityId, filterStatus, filterPrimitive]);

  const loadDecisions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/decision-core/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          module,
          entityType,
          entityId,
          status: filterStatus.length > 0 ? filterStatus : undefined,
          primitive: filterPrimitive.length > 0 ? filterPrimitive : undefined,
          limit: 100,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
      });
      const data = await response.json();
      setDecisions(data.decisions || []);
    } catch (error) {
      console.error("Failed to load decisions:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch(
        `/api/decision-core/statistics${tenantId ? `?tenantId=${tenantId}` : ""}`,
      );
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error("Failed to load statistics:", error);
    }
  };

  const getStatusColor = (status: DecisionStatus): string => {
    const colors: Record<DecisionStatus, string> = {
      DRAFT: "bg-gray-500",
      PENDING: "bg-yellow-500",
      APPROVED: "bg-green-500",
      APPROVED_WITH_CONDITIONS: "bg-blue-500",
      REJECTED: "bg-red-500",
      ESCALATED: "bg-orange-500",
      CLOSED: "bg-gray-700",
      ON_HOLD: "bg-purple-500",
      OVERRIDE_APPLIED: "bg-pink-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getPrimitiveIcon = (primitive: DecisionPrimitive): string => {
    const icons: Record<DecisionPrimitive, string> = {
      ALLOW: "ri-check-line",
      ALLOW_WITH_CONDITIONS: "ri-check-double-line",
      BLOCK: "ri-close-line",
      HOLD_UNTIL: "ri-time-line",
      ESCALATE_TO: "ri-arrow-up-line",
      OPEN_NCR: "ri-file-warning-line",
      OPEN_CAPA: "ri-file-edit-line",
      REQUEST_EVIDENCE: "ri-file-search-line",
      REROUTE: "ri-route-line",
      RESCHEDULE: "ri-calendar-line",
      ASSIGN_RESOURCE: "ri-user-add-line",
      APPROVE_SPEND: "ri-money-dollar-circle-line",
      FLAG_FOR_PAYMENT_HOLD: "ri-money-dollar-circle-fill",
      OVERRIDE: "ri-shield-check-line",
    };
    return icons[primitive] || "ri-question-line";
  };

  if (loading && !statistics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Decision Infrastructure
          </h1>
          <p className="text-gray-400 mt-1">
            Unified decision management across BlueDXP
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/decision-infrastructure/analytics"
            className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
          >
            <i className="ri-bar-chart-box-line mr-2"></i>Analytics
          </a>
          <a
            href="/decision-infrastructure/workflows"
            className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
            <i className="ri-flow-chart-line mr-2"></i>Workflows
          </a>
          <a
            href="/decision-infrastructure/controls"
            className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
          >
            <i className="ri-shield-line mr-2"></i>Controls
          </a>
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg ${
              viewMode === "list"
                ? "bg-blue-500 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            <i className="ri-list-check mr-2"></i>List
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-4 py-2 rounded-lg ${
              viewMode === "timeline"
                ? "bg-blue-500 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            <i className="ri-time-line mr-2"></i>Timeline
          </button>
          <button
            onClick={() => setViewMode("stats")}
            className={`px-4 py-2 rounded-lg ${
              viewMode === "stats"
                ? "bg-blue-500 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            <i className="ri-bar-chart-line mr-2"></i>Statistics
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Decisions</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {statistics.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <i className="ri-file-list-3-line text-blue-400 text-xl"></i>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">
                  {statistics.byStatus.PENDING || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <i className="ri-time-line text-yellow-400 text-xl"></i>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Escalated</p>
                <p className="text-2xl font-bold text-orange-400 mt-1">
                  {statistics.escalatedDecisions.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <i className="ri-arrow-up-line text-orange-400 text-xl"></i>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Compliance Rate</p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  {statistics.complianceRate.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <i className="ri-shield-check-line text-green-400 text-xl"></i>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-400 mb-2">Status</label>
            <select
              multiple
              value={filterStatus}
              onChange={(e) => {
                const values = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value as DecisionStatus,
                );
                setFilterStatus(values);
              }}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="APPROVED_WITH_CONDITIONS">
                Approved with Conditions
              </option>
              <option value="REJECTED">Rejected</option>
              <option value="ESCALATED">Escalated</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-400 mb-2">
              Primitive
            </label>
            <select
              multiple
              value={filterPrimitive}
              onChange={(e) => {
                const values = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value as DecisionPrimitive,
                );
                setFilterPrimitive(values);
              }}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
            >
              <option value="ALLOW">Allow</option>
              <option value="ALLOW_WITH_CONDITIONS">
                Allow with Conditions
              </option>
              <option value="BLOCK">Block</option>
              <option value="ESCALATE_TO">Escalate</option>
              <option value="APPROVE_SPEND">Approve Spend</option>
              <option value="OVERRIDE">Override</option>
            </select>
          </div>
        </div>
      </div>

      {/* Decisions List */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {decisions.map((decision) => (
            <motion.div
              key={decision.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setSelectedDecision(decision)}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(decision.status)} text-white`}
                    >
                      {decision.status}
                    </span>
                    <i
                      className={`${getPrimitiveIcon(decision.primitive)} text-gray-400`}
                    ></i>
                    <span className="text-sm text-gray-400">
                      {decision.primitive}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-sm text-gray-400">
                      {decision.module}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-sm text-gray-400">
                      {decision.entityType}
                    </span>
                  </div>
                  {decision.reason && (
                    <p className="text-white mb-2">{decision.reason}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>ID: {decision.id}</span>
                    <span>•</span>
                    <span>{new Date(decision.createdAt).toLocaleString()}</span>
                    {decision.decidedBy && (
                      <>
                        <span>•</span>
                        <span>By: {decision.decidedBy}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <i className="ri-arrow-right-s-line text-gray-400 text-xl"></i>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Decision Detail Modal */}
      {selectedDecision && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDecision(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">
                Decision Details
              </h2>
              <button
                onClick={() => setSelectedDecision(null)}
                className="text-gray-400 hover:text-white"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Status</label>
                <div className="mt-1">
                  <span
                    className={`px-3 py-1 rounded ${getStatusColor(selectedDecision.status)} text-white`}
                  >
                    {selectedDecision.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Primitive</label>
                <p className="text-white mt-1">{selectedDecision.primitive}</p>
              </div>

              {selectedDecision.reason && (
                <div>
                  <label className="text-sm text-gray-400">Reason</label>
                  <p className="text-white mt-1">{selectedDecision.reason}</p>
                </div>
              )}

              {selectedDecision.conditions &&
                selectedDecision.conditions.length > 0 && (
                  <div>
                    <label className="text-sm text-gray-400">Conditions</label>
                    <ul className="list-disc list-inside text-white mt-1">
                      {selectedDecision.conditions.map((condition, idx) => (
                        <li key={idx}>{condition}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {selectedDecision.controlsApplied &&
                selectedDecision.controlsApplied.length > 0 && (
                  <div>
                    <label className="text-sm text-gray-400">
                      Controls Applied
                    </label>
                    <div className="mt-2 space-y-2">
                      {selectedDecision.controlsApplied.map((control, idx) => (
                        <div key={idx} className="bg-gray-700 rounded p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm">
                              {control.reference}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                control.result === "PASS"
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              } text-white`}
                            >
                              {control.result}
                            </span>
                          </div>
                          {control.notes && (
                            <p className="text-gray-400 text-xs mt-1">
                              {control.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Module</label>
                  <p className="text-white mt-1">{selectedDecision.module}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Entity Type</label>
                  <p className="text-white mt-1">
                    {selectedDecision.entityType}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Created</label>
                  <p className="text-white mt-1">
                    {new Date(selectedDecision.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">
                    Correlation ID
                  </label>
                  <p className="text-white mt-1 font-mono text-xs">
                    {selectedDecision.correlationId}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
