"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";

interface Workflow {
  id: string;
  name: string;
  description: string;
  category:
    | "APPROVAL"
    | "NOTIFICATION"
    | "AUTOMATION"
    | "INTEGRATION"
    | "COMPLIANCE"
    | "CUSTOM";
  status: "ACTIVE" | "INACTIVE" | "DRAFT" | "ERROR";
  trigger: {
    type: "EVENT" | "SCHEDULE" | "MANUAL" | "API";
    eventType?: string;
    schedule?: string;
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };
  steps: Array<{
    id: string;
    type:
      | "ACTION"
      | "CONDITION"
      | "APPROVAL"
      | "NOTIFICATION"
      | "INTEGRATION"
      | "DELAY";
    name: string;
    config: Record<string, any>;
    nextStepId?: string;
    onSuccessId?: string;
    onFailureId?: string;
  }>;
  version: number;
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastExecuted?: Date | string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  avgExecutionTime: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  startedAt: Date | string;
  completedAt?: Date | string;
  duration?: number;
  currentStep?: string;
  errorMessage?: string;
  triggeredBy: string;
  context: Record<string, any>;
}

export default function WorkflowEngine() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>(() => {
    const categories: Workflow["category"][] = [
      "APPROVAL",
      "NOTIFICATION",
      "AUTOMATION",
      "INTEGRATION",
      "COMPLIANCE",
      "CUSTOM",
    ];
    const statuses: Workflow["status"][] = [
      "ACTIVE",
      "INACTIVE",
      "DRAFT",
      "ERROR",
    ];
    const priorities: Workflow["priority"][] = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL",
    ];

    return Array.from({ length: 25 }, (_, i) => {
      const category =
        categories[Math.floor(Math.random() * categories.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const priority =
        priorities[Math.floor(Math.random() * priorities.length)];
      const executionCount = Math.floor(Math.random() * 1000) + 100;
      const successCount = Math.floor(
        executionCount * (0.85 + Math.random() * 0.1),
      );
      const failureCount = executionCount - successCount;

      return {
        id: `WF-${String(i + 1).padStart(6, "0")}`,
        name: `${category} Workflow ${i + 1}`,
        description: `Automated ${category.toLowerCase()} workflow for process management`,
        category,
        status,
        trigger: {
          type:
            Math.random() > 0.5 ? ("EVENT" as const) : ("SCHEDULE" as const),
          eventType:
            category === "APPROVAL"
              ? "APPROVAL_REQUESTED"
              : category === "NOTIFICATION"
                ? "ALERT_TRIGGERED"
                : "ORDER_CREATED",
          schedule: Math.random() > 0.5 ? "DAILY" : "HOURLY",
          conditions: [
            {
              field: "priority",
              operator: "equals",
              value: priority,
            },
          ],
        },
        steps: [
          {
            id: "step-1",
            type: "ACTION" as const,
            name: "Initial Action",
            config: { action: "validate" },
            nextStepId: "step-2",
          },
          {
            id: "step-2",
            type:
              category === "APPROVAL"
                ? ("APPROVAL" as const)
                : ("NOTIFICATION" as const),
            name:
              category === "APPROVAL"
                ? "Request Approval"
                : "Send Notification",
            config: { target: "manager" },
          },
        ],
        version: 1,
        createdBy: `User ${Math.floor(Math.random() * 10) + 1}`,
        createdAt: new Date(Date.now() - Math.random() * 90 * 86400000),
        updatedAt: new Date(Date.now() - Math.random() * 30 * 86400000),
        lastExecuted:
          status === "ACTIVE"
            ? new Date(Date.now() - Math.random() * 24 * 3600000)
            : undefined,
        executionCount,
        successCount,
        failureCount,
        avgExecutionTime: Math.random() * 5000 + 500,
        priority,
      };
    });
  });

  const [executions, setExecutions] = useState<WorkflowExecution[]>(() => {
    return Array.from({ length: 50 }, (_, i) => {
      const workflow = workflows[Math.floor(Math.random() * workflows.length)];
      const statuses: WorkflowExecution["status"][] = [
        "COMPLETED",
        "COMPLETED",
        "COMPLETED",
        "RUNNING",
        "FAILED",
      ];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const startedAt = new Date(Date.now() - Math.random() * 7 * 86400000);

      return {
        id: `EXEC-${String(i + 1).padStart(6, "0")}`,
        workflowId: workflow.id,
        workflowName: workflow.name,
        status,
        startedAt,
        completedAt:
          status === "COMPLETED" || status === "FAILED"
            ? new Date(startedAt.getTime() + Math.random() * 60000)
            : undefined,
        duration:
          status === "COMPLETED" || status === "FAILED"
            ? Math.random() * 60000
            : undefined,
        currentStep: status === "RUNNING" ? "step-2" : undefined,
        errorMessage: status === "FAILED" ? "Timeout error" : undefined,
        triggeredBy: `User ${Math.floor(Math.random() * 10) + 1}`,
        context: { orderId: `ORDER-${i + 1}` },
      };
    });
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<
    "workflows" | "executions" | "analytics" | "builder"
  >("workflows");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null,
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalWorkflows: 0,
    activeWorkflows: 0,
    runningExecutions: 0,
    successRate: 0,
  });

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      const matchesSearch =
        workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || workflow.status === selectedStatus;
      const matchesCategory =
        selectedCategory === "ALL" || workflow.category === selectedCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [workflows, searchQuery, selectedStatus, selectedCategory]);

  // Analytics
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    workflows.forEach((w) => {
      counts[w.status] = (counts[w.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [workflows]);

  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    workflows.forEach((w) => {
      counts[w.category] = (counts[w.category] || 0) + 1;
    });
    return Object.entries(counts).map(([category, count]) => ({
      category: category.replace(/_/g, " "),
      count,
    }));
  }, [workflows]);

  const executionTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; completed: number; failed: number }
    > = {};

    executions.forEach((e) => {
      const date = e.startedAt
        ? format(new Date(e.startedAt), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, completed: 0, failed: 0 };
      }
      if (e.status === "COMPLETED") {
        dailyData[date].completed++;
      }
      if (e.status === "FAILED") {
        dailyData[date].failed++;
      }
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        completed: d.completed,
        failed: d.failed,
        successRate:
          d.completed + d.failed > 0
            ? (d.completed / (d.completed + d.failed)) * 100
            : 0,
      }));
  }, [executions]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const total = workflows.length;
    const active = workflows.filter((w) => w.status === "ACTIVE").length;
    const running = executions.filter((e) => e.status === "RUNNING").length;
    const totalExecutions = executions.length;
    const successExecutions = executions.filter(
      (e) => e.status === "COMPLETED",
    ).length;
    const successRate =
      totalExecutions > 0 ? (successExecutions / totalExecutions) * 100 : 0;

    return {
      total,
      active,
      running,
      successRate,
    };
  }, [workflows, executions]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "workflow-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "workflow-stats",
      () => ({
        totalWorkflows: aggregateStats.total,
        activeWorkflows: simulateKPIUpdates(aggregateStats.active, 0.1),
        runningExecutions: simulateKPIUpdates(aggregateStats.running, 0.1),
        successRate: simulateKPIUpdates(aggregateStats.successRate, 0.02),
      }),
      5000,
      true,
    );

    return () => {
      unsubscribe();
      stop();
    };
  }, [
    realTimeEnabled,
    aggregateStats.total,
    aggregateStats.active,
    aggregateStats.running,
    aggregateStats.successRate,
  ]);

  // Simulate real-time execution updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setExecutions((prev) =>
        prev.map((e) => {
          if (e.status === "RUNNING" && Math.random() < 0.1) {
            return {
              ...e,
              status:
                Math.random() > 0.1
                  ? ("COMPLETED" as const)
                  : ("FAILED" as const),
              completedAt: new Date(),
              duration: Math.random() * 60000,
            };
          }
          return e;
        }),
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const stats = [
    {
      label: "Total Workflows",
      value: realTimeEnabled
        ? realTimeStats.totalWorkflows
        : aggregateStats.total,
      icon: "ri-flow-chart-line",
      tooltip: "Total workflow definitions",
      trend: "up" as const,
    },
    {
      label: "Active",
      value: realTimeEnabled
        ? realTimeStats.activeWorkflows
        : aggregateStats.active,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active workflows",
      trend: "up" as const,
    },
    {
      label: "Running",
      value: realTimeEnabled
        ? realTimeStats.runningExecutions
        : aggregateStats.running,
      icon: "ri-loader-line",
      tooltip: "Currently running executions",
      trend: "neutral" as const,
    },
    {
      label: "Success Rate",
      value: `${(realTimeEnabled ? realTimeStats.successRate : aggregateStats.successRate).toFixed(1)}%`,
      icon: "ri-line-chart-line",
      tooltip: "Workflow execution success rate",
      trend: "up" as const,
    },
  ];

  const COLORS = [
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  const handleView = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setShowViewModal(true);
  };

  const handleBuilder = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setShowBuilderModal(true);
  };

  const handleActivate = (workflow: Workflow) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === workflow.id
          ? { ...w, status: "ACTIVE" as const, updatedAt: new Date() }
          : w,
      ),
    );
  };

  const handleDeactivate = (workflow: Workflow) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === workflow.id
          ? { ...w, status: "INACTIVE" as const, updatedAt: new Date() }
          : w,
      ),
    );
  };

  return (
    <PageTemplate
      title="Workflow Engine"
      description="Visual workflow builder, automation engine, and process orchestration with triggers, conditions, approvals, and integrations"
      icon="ri-flow-chart-line"
      systemInfo={{
        sap: "Workflow Engine, Business Process Management",
        oracle: "Workflow Management, Process Automation",
        manhattan: "Workflow Engine, Process Orchestration",
      }}
      examples={[
        "Visual workflow builder",
        "Event-driven automation",
        "Approval workflows",
        "Scheduled workflows",
        "Conditional logic",
        "Integration workflows",
      ]}
      stats={stats}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 sm:p-2">
            <button
              onClick={() => setViewMode("workflows")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "workflows"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Workflows"
            >
              <i className="ri-flow-chart-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("executions")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "executions"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Executions"
            >
              <i className="ri-play-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "analytics"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Analytics"
            >
              <i className="ri-bar-chart-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("builder")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "builder"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Builder"
            >
              <i className="ri-tools-line text-sm sm:text-base"></i>
            </button>
          </div>
          <button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              realTimeEnabled
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/5 text-[#9ca3af] border border-white/10"
            }`}
          >
            <i
              className={`ri-${realTimeEnabled ? "radio-button-line" : "checkbox-blank-circle-line"} mr-1`}
            ></i>
            Real-time
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 whitespace-nowrap"
          >
            <i className="ri-add-line"></i>
            <span className="hidden sm:inline">Create Workflow</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="DRAFT">Draft</option>
          <option value="ERROR">Error</option>
        </select>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Categories</option>
          <option value="APPROVAL">Approval</option>
          <option value="NOTIFICATION">Notification</option>
          <option value="AUTOMATION">Automation</option>
          <option value="INTEGRATION">Integration</option>
          <option value="COMPLIANCE">Compliance</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </div>

      {/* Workflows View */}
      {viewMode === "workflows" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkflows.map((workflow, index) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {workflow.name}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {workflow.description}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      workflow.status === "ACTIVE"
                        ? "bg-green-500/20 text-green-400"
                        : workflow.status === "DRAFT"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : workflow.status === "ERROR"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {workflow.status}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      workflow.priority === "CRITICAL"
                        ? "bg-red-500/20 text-red-400"
                        : workflow.priority === "HIGH"
                          ? "bg-orange-500/20 text-orange-400"
                          : workflow.priority === "MEDIUM"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {workflow.priority}
                  </span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Category:</span>
                  <span className="text-white text-xs">
                    {workflow.category.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Trigger:</span>
                  <span className="text-white text-xs">
                    {workflow.trigger.type}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Steps:</span>
                  <span className="text-white font-medium">
                    {workflow.steps.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Executions:</span>
                  <span className="text-white font-medium">
                    {workflow.executionCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Success Rate:</span>
                  <span className="text-green-400 font-medium">
                    {workflow.executionCount > 0
                      ? (
                          (workflow.successCount / workflow.executionCount) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                {workflow.lastExecuted && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Last Executed:</span>
                    <span className="text-white text-xs">
                      {format(new Date(workflow.lastExecuted), "MMM dd, HH:mm")}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <Tooltip content="View Details" position="top">
                  <button
                    onClick={() => handleView(workflow)}
                    className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                  >
                    <i className="ri-eye-line mr-1"></i>
                    View
                  </button>
                </Tooltip>
                <Tooltip content="Open Builder" position="top">
                  <button
                    onClick={() => handleBuilder(workflow)}
                    className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-colors"
                  >
                    <i className="ri-tools-line"></i>
                  </button>
                </Tooltip>
                {workflow.status === "ACTIVE" ? (
                  <Tooltip content="Deactivate" position="top">
                    <button
                      onClick={() => handleDeactivate(workflow)}
                      className="px-3 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 rounded text-sm font-medium hover:bg-yellow-600/30 transition-colors"
                    >
                      <i className="ri-pause-line"></i>
                    </button>
                  </Tooltip>
                ) : (
                  <Tooltip content="Activate" position="top">
                    <button
                      onClick={() => handleActivate(workflow)}
                      className="px-3 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded text-sm font-medium hover:bg-green-600/30 transition-colors"
                    >
                      <i className="ri-play-line"></i>
                    </button>
                  </Tooltip>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Executions View */}
      {viewMode === "executions" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Execution ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Workflow
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Triggered By
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {executions.map((execution, index) => (
                  <motion.tr
                    key={execution.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">
                        {execution.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {execution.workflowName}
                      </div>
                      <div className="text-xs text-[#9ca3af] font-mono">
                        {execution.workflowId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          execution.status === "COMPLETED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : execution.status === "RUNNING"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : execution.status === "FAILED"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {execution.status}
                      </span>
                      {execution.currentStep && (
                        <div className="text-xs text-[#9ca3af] mt-1">
                          Step: {execution.currentStep}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {format(new Date(execution.startedAt), "MMM dd, HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {execution.duration
                          ? `${(execution.duration / 1000).toFixed(1)}s`
                          : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {execution.triggeredBy}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Tooltip content="View Details" position="top">
                        <button className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors">
                          <i className="ri-eye-line"></i>
                        </button>
                      </Tooltip>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Category Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="category"
                    stroke="#9ca3af"
                    fontSize={10}
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
                  <Bar dataKey="count" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Execution Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={executionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="completed"
                  fill="#10b981"
                  name="Completed"
                />
                <Bar
                  yAxisId="left"
                  dataKey="failed"
                  fill="#ef4444"
                  name="Failed"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="successRate"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Success Rate %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Builder View */}
      {viewMode === "builder" && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Visual Workflow Builder
              </h3>
              <button
                onClick={() => setShowBuilderModal(true)}
                className="px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
              >
                <i className="ri-add-line mr-1"></i>
                New Workflow
              </button>
            </div>
            <div className="text-sm text-[#9ca3af] mb-6">
              Drag and drop workflow steps, configure triggers, conditions, and
              actions. Build complex workflows visually.
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-lg border border-dashed border-white/10">
                <div className="text-sm font-medium text-white mb-2">
                  Available Steps
                </div>
                <div className="space-y-2">
                  {[
                    "Action",
                    "Condition",
                    "Approval",
                    "Notification",
                    "Integration",
                    "Delay",
                  ].map((step) => (
                    <div
                      key={step}
                      className="p-3 bg-white/5 rounded-lg cursor-move hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <i className="ri-drag-move-2-line text-cyan-400"></i>
                        <span className="text-sm text-white">{step}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-dashed border-white/10 min-h-[400px]">
                <div className="text-sm font-medium text-white mb-2">
                  Workflow Canvas
                </div>
                <div className="text-xs text-[#9ca3af] mt-4 text-center">
                  Drag steps here to build your workflow
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedWorkflow(null);
        }}
        title={`Workflow Details - ${selectedWorkflow?.name || ""}`}
        size="lg"
      >
        {selectedWorkflow && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Workflow ID</div>
                <div className="text-white font-medium font-mono">
                  {selectedWorkflow.id}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedWorkflow.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : selectedWorkflow.status === "DRAFT"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedWorkflow.status}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Category</div>
                <div className="text-white">
                  {selectedWorkflow.category.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Priority</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedWorkflow.priority === "CRITICAL"
                      ? "bg-red-500/20 text-red-400"
                      : selectedWorkflow.priority === "HIGH"
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {selectedWorkflow.priority}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Trigger Type</div>
                <div className="text-white">
                  {selectedWorkflow.trigger.type}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Steps</div>
                <div className="text-white font-medium">
                  {selectedWorkflow.steps.length}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Executions</div>
                <div className="text-white font-medium">
                  {selectedWorkflow.executionCount.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Success Rate</div>
                <div className="text-green-400 font-medium">
                  {selectedWorkflow.executionCount > 0
                    ? (
                        (selectedWorkflow.successCount /
                          selectedWorkflow.executionCount) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Workflow Steps</div>
              <div className="space-y-2">
                {selectedWorkflow.steps.map((step, index) => (
                  <div key={step.id} className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-cyan-400 font-mono">
                        Step {index + 1}
                      </span>
                      <span className="text-sm text-white font-medium">
                        {step.name}
                      </span>
                      <span className="text-xs text-[#9ca3af]">
                        ({step.type})
                      </span>
                    </div>
                    {step.nextStepId && (
                      <div className="text-xs text-[#9ca3af]">
                        Next: {step.nextStepId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Workflow"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Workflow Name
            </label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="Enter workflow name"
            />
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Description
            </label>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="Enter workflow description"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Category
            </label>
            <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
              <option value="APPROVAL">Approval</option>
              <option value="NOTIFICATION">Notification</option>
              <option value="AUTOMATION">Automation</option>
              <option value="INTEGRATION">Integration</option>
              <option value="COMPLIANCE">Compliance</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Trigger Type
            </label>
            <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
              <option value="EVENT">Event</option>
              <option value="SCHEDULE">Schedule</option>
              <option value="MANUAL">Manual</option>
              <option value="API">API</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setShowBuilderModal(true);
              }}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Continue to Builder
            </button>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Builder Modal */}
      <Modal
        isOpen={showBuilderModal}
        onClose={() => {
          setShowBuilderModal(false);
          setSelectedWorkflow(null);
        }}
        title={`Workflow Builder - ${selectedWorkflow?.name || "New Workflow"}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="text-sm text-[#9ca3af] mb-4">
            Visual workflow builder with drag-and-drop interface. Configure
            triggers, conditions, and actions.
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-sm font-medium text-white mb-3">
                Steps Library
              </div>
              <div className="space-y-2">
                {[
                  "Action",
                  "Condition",
                  "Approval",
                  "Notification",
                  "Integration",
                  "Delay",
                ].map((step) => (
                  <div
                    key={step}
                    className="p-3 bg-white/5 rounded-lg cursor-move hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <i className="ri-drag-move-2-line text-cyan-400"></i>
                      <span className="text-sm text-white">{step}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 p-4 bg-white/5 rounded-lg border border-white/10 min-h-[500px]">
              <div className="text-sm font-medium text-white mb-3">
                Workflow Canvas
              </div>
              <div className="text-xs text-[#9ca3af] mt-8 text-center">
                Drag steps from the library to build your workflow
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => {
                setShowBuilderModal(false);
                setSelectedWorkflow(null);
              }}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Save Workflow
            </button>
            <button
              onClick={() => {
                setShowBuilderModal(false);
                setSelectedWorkflow(null);
              }}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </PageTemplate>
  );
}
