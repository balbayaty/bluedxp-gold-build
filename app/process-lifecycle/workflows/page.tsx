/**
 * Advanced Workflow Management Page
 * Comprehensive workflow management with builder, execution monitoring, and analytics
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { workflowService } from "@/lib/services/process-lifecycle";
import type {
  Workflow,
  WorkflowExecution,
} from "@/lib/services/process-lifecycle";
import ErrorBoundary from "@/components/ErrorBoundary";
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
} from "recharts";

export default function WorkflowManagementPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<
    "workflows" | "executions" | "analytics" | "templates"
  >("workflows");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null,
  );
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  useEffect(() => {
    loadData();
    if (realTimeEnabled) {
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workflowsData, executionsData] = await Promise.all([
        workflowService.getWorkflows("default"),
        Promise.all([
          workflowService.getExecutionsForRecord("SO-2024-001"),
          workflowService.getExecutionsForRecord("PO-2024-001"),
        ]).then((results) => results.flat()),
      ]);
      setWorkflows(workflowsData);
      setExecutions(executionsData);
    } catch (error) {
      console.error("Error loading workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      const matchesSearch =
        workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        filterStatus === "ALL" || workflow.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [workflows, searchQuery, filterStatus]);

  const workflowStats = useMemo(() => {
    return {
      total: workflows.length,
      active: workflows.filter((w) => w.status === "active").length,
      draft: workflows.filter((w) => w.status === "draft").length,
      paused: workflows.filter((w) => w.status === "paused").length,
    };
  }, [workflows]);

  const executionStats = useMemo(() => {
    return {
      total: executions.length,
      running: executions.filter((e) => e.status === "running").length,
      completed: executions.filter((e) => e.status === "completed").length,
      failed: executions.filter((e) => e.status === "failed").length,
    };
  }, [executions]);

  const executionChartData = useMemo(() => {
    return [
      { name: "Running", value: executionStats.running, color: "#3b82f6" },
      { name: "Completed", value: executionStats.completed, color: "#10b981" },
      { name: "Failed", value: executionStats.failed, color: "#ef4444" },
    ];
  }, [executionStats]);

  if (loading && workflows.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-[#9ca3af]">Loading Workflows...</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="text-red-400 p-4">
          Error loading Workflow Management
        </div>
      }
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <i className="ri-node-tree text-purple-400"></i>
                Workflow Management
              </h1>
              <p className="text-[#9ca3af]">
                Create, manage, and monitor automated workflows
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  realTimeEnabled
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white/5 text-[#9ca3af] border border-white/10"
                }`}
              >
                <i
                  className={`ri-${realTimeEnabled ? "pause" : "play"}-line mr-2`}
                ></i>
                {realTimeEnabled ? "Live" : "Paused"}
              </button>
              <Link
                href="/process-lifecycle/workflows/builder"
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <i className="ri-add-line mr-2"></i>
                Create Workflow
              </Link>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(
              ["workflows", "executions", "analytics", "templates"] as const
            ).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-purple-500 text-white"
                    : "text-[#9ca3af] hover:text-white"
                }`}
              >
                <i
                  className={`ri-${mode === "workflows" ? "node-tree" : mode === "executions" ? "play-circle-line" : mode === "analytics" ? "bar-chart-line" : "file-list-line"} mr-2`}
                ></i>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Workflows View */}
        {viewMode === "workflows" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Workflows",
                  value: workflowStats.total,
                  icon: "ri-file-list-line",
                  color: "purple",
                },
                {
                  label: "Active",
                  value: workflowStats.active,
                  icon: "ri-play-circle-line",
                  color: "green",
                },
                {
                  label: "Draft",
                  value: workflowStats.draft,
                  icon: "ri-edit-line",
                  color: "yellow",
                },
                {
                  label: "Paused",
                  value: workflowStats.paused,
                  icon: "ri-pause-circle-line",
                  color: "gray",
                },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-${stat.color}-500/30 transition-all`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <i
                      className={`ri-${stat.icon} text-${stat.color}-400 text-xl`}
                    ></i>
                    {realTimeEnabled && (
                      <div
                        className={`w-2 h-2 rounded-full bg-${stat.color}-400 animate-pulse`}
                      ></div>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-[#9ca3af]">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Search and Filter */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"></i>
                  <input
                    type="text"
                    placeholder="Search workflows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-[#9ca3af] focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Workflows Grid */}
            {filteredWorkflows.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkflows.map((workflow, idx) => (
                  <motion.div
                    key={workflow.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() =>
                      setSelectedWorkflow(
                        selectedWorkflow?.id === workflow.id ? null : workflow,
                      )
                    }
                    className={`bg-white/5 backdrop-blur-xl border rounded-xl p-6 cursor-pointer transition-all hover:border-purple-500/30 ${
                      selectedWorkflow?.id === workflow.id
                        ? "border-purple-500/50 bg-purple-500/10"
                        : "border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <i className="ri-node-tree text-purple-400 text-xl"></i>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {workflow.name}
                          </h3>
                          <p className="text-xs text-[#9ca3af]">
                            Created{" "}
                            {format(
                              new Date(workflow.createdAt),
                              "MMM d, yyyy",
                            )}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          workflow.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : workflow.status === "draft"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : workflow.status === "paused"
                                ? "bg-gray-500/20 text-gray-400"
                                : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {workflow.status}
                      </span>
                    </div>
                    <p className="text-sm text-[#9ca3af] mb-4 line-clamp-2">
                      {workflow.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between text-xs text-[#9ca3af] mb-4">
                      <div className="flex items-center gap-1">
                        <i className="ri-node-tree"></i>
                        {workflow.steps.length} steps
                      </div>
                      <div className="flex items-center gap-1">
                        <i className="ri-flashlight-line"></i>
                        {workflow.triggers.length} triggers
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/process-lifecycle/workflows/${workflow.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-medium transition-colors text-center"
                      >
                        <i className="ri-eye-line mr-1"></i>
                        View
                      </Link>
                      <Link
                        href={`/process-lifecycle/workflows/builder?id=${workflow.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors text-center"
                      >
                        <i className="ri-edit-line mr-1"></i>
                        Edit
                      </Link>
                    </div>
                    {selectedWorkflow?.id === workflow.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 pt-4 border-t border-white/10"
                      >
                        <div className="text-xs text-[#9ca3af] mb-2">
                          Workflow Steps:
                        </div>
                        <div className="space-y-1">
                          {workflow.steps.slice(0, 3).map((step, i) => (
                            <div
                              key={step.id}
                              className="flex items-center gap-2 text-xs text-white"
                            >
                              <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                                {i + 1}
                              </div>
                              <span>{step.name}</span>
                              <span className="ml-auto text-[#9ca3af]">
                                {step.type}
                              </span>
                            </div>
                          ))}
                          {workflow.steps.length > 3 && (
                            <div className="text-xs text-[#9ca3af] pl-7">
                              +{workflow.steps.length - 3} more steps
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    <i className="ri-node-tree text-purple-400 text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No Workflows Found
                  </h3>
                  <p className="text-[#9ca3af] mb-6">
                    Create your first workflow to automate processes
                  </p>
                  <Link
                    href="/process-lifecycle/workflows/builder"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <i className="ri-add-line"></i>
                    Create Workflow
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Executions View */}
        {viewMode === "executions" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Executions",
                  value: executionStats.total,
                  icon: "ri-play-circle-line",
                  color: "blue",
                },
                {
                  label: "Running",
                  value: executionStats.running,
                  icon: "ri-loader-4-line",
                  color: "cyan",
                },
                {
                  label: "Completed",
                  value: executionStats.completed,
                  icon: "ri-checkbox-circle-line",
                  color: "green",
                },
                {
                  label: "Failed",
                  value: executionStats.failed,
                  icon: "ri-error-warning-line",
                  color: "red",
                },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <i
                      className={`ri-${stat.icon} text-${stat.color}-400 text-xl`}
                    ></i>
                    {realTimeEnabled && stat.label === "Running" && (
                      <div
                        className={`w-2 h-2 rounded-full bg-${stat.color}-400 animate-pulse`}
                      ></div>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-[#9ca3af]">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">
                  Recent Executions
                </h3>
              </div>
              <div className="divide-y divide-white/10">
                {executions.length > 0 ? (
                  executions.map((execution, idx) => (
                    <div
                      key={execution.id}
                      className="p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              execution.status === "completed"
                                ? "bg-green-500/20"
                                : execution.status === "running"
                                  ? "bg-blue-500/20 animate-pulse"
                                  : execution.status === "failed"
                                    ? "bg-red-500/20"
                                    : "bg-gray-500/20"
                            }`}
                          >
                            <i
                              className={`ri-${
                                execution.status === "completed"
                                  ? "check-line"
                                  : execution.status === "running"
                                    ? "loader-4-line animate-spin"
                                    : execution.status === "failed"
                                      ? "close-line"
                                      : "pause-line"
                              } text-xl ${
                                execution.status === "completed"
                                  ? "text-green-400"
                                  : execution.status === "running"
                                    ? "text-blue-400"
                                    : execution.status === "failed"
                                      ? "text-red-400"
                                      : "text-gray-400"
                              }`}
                            ></i>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">
                              Execution {execution.id.substring(0, 8)}
                            </div>
                            <div className="text-xs text-[#9ca3af]">
                              Record: {execution.recordId}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              execution.status === "completed"
                                ? "bg-green-500/20 text-green-400"
                                : execution.status === "running"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : execution.status === "failed"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {execution.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-13 mt-2">
                        <div className="text-xs text-[#9ca3af] mb-1">
                          Progress:{" "}
                          {
                            execution.steps.filter(
                              (s) => s.status === "completed",
                            ).length
                          }{" "}
                          / {execution.steps.length} steps
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              execution.status === "completed"
                                ? "bg-green-500"
                                : execution.status === "running"
                                  ? "bg-blue-500"
                                  : execution.status === "failed"
                                    ? "bg-red-500"
                                    : "bg-gray-500"
                            }`}
                            style={{
                              width: `${(execution.steps.filter((s) => s.status === "completed").length / execution.steps.length) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-[#9ca3af]">
                    <i className="ri-information-line text-3xl mb-2"></i>
                    <div>No executions found</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics View */}
        {viewMode === "analytics" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Execution Status
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={executionChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {executionChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Workflow Status Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: "Active", value: workflowStats.active },
                      { name: "Draft", value: workflowStats.draft },
                      { name: "Paused", value: workflowStats.paused },
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
                    />
                    <Bar dataKey="value" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Templates View */}
        {viewMode === "templates" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-600/10 border border-purple-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Workflow Templates
              </h3>
              <p className="text-sm text-[#9ca3af] mb-6">
                Start with pre-built templates for common workflows
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    name: "Order Approval",
                    description: "Automated approval workflow for orders",
                    icon: "ri-checkbox-circle-line",
                  },
                  {
                    name: "Quality Check",
                    description: "Quality inspection workflow",
                    icon: "ri-shield-check-line",
                  },
                  {
                    name: "Notification",
                    description: "Automated notification workflow",
                    icon: "ri-notification-line",
                  },
                ].map((template, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <i
                          className={`${template.icon} text-purple-400 text-xl`}
                        ></i>
                      </div>
                      <h4 className="text-sm font-semibold text-white">
                        {template.name}
                      </h4>
                    </div>
                    <p className="text-xs text-[#9ca3af] mb-3">
                      {template.description}
                    </p>
                    <button className="w-full px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-medium transition-colors">
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
