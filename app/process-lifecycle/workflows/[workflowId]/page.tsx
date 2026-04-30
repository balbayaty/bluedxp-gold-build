/**
 * Workflow Details/View Page
 * View workflow details, executions, and analytics
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import type {
  Workflow,
  WorkflowExecution,
} from "@/lib/services/process-lifecycle";
import { workflowService } from "@/lib/services/process-lifecycle";
import ErrorBoundary from "@/components/ErrorBoundary";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";

export default function WorkflowDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.workflowId as string;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "details" | "executions" | "analytics"
  >("details");

  useEffect(() => {
    if (workflowId) {
      loadWorkflowData();
    }
  }, [workflowId]);

  const loadWorkflowData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [workflowData, executionsData] = await Promise.all([
        workflowService.getWorkflow(workflowId).catch(() => null),
        workflowService.getExecutionsForWorkflow(workflowId).catch(() => []),
      ]);

      if (!workflowData) {
        setError("Workflow not found");
        return;
      }

      setWorkflow(workflowData);
      setExecutions(executionsData);
    } catch (err) {
      console.error("Error loading workflow:", err);
      setError("Failed to load workflow");
    } finally {
      setLoading(false);
    }
  };

  const convertWorkflowToReactFlow = (workflow: Workflow) => {
    const nodes: Node[] = workflow.steps.map((step, index) => ({
      id: step.id,
      type: step.type,
      position: step.position || { x: index * 200, y: 100 },
      data: {
        label: step.name,
        config: step.config,
      },
    }));

    const edges: Edge[] = [];
    workflow.steps.forEach((step) => {
      if (step.connections && step.connections.length > 0) {
        step.connections.forEach((targetId) => {
          edges.push({
            id: `${step.id}-${targetId}`,
            source: step.id,
            target: targetId,
          });
        });
      }
    });

    return { nodes, edges };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#111827]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-[#9ca3af]">Loading Workflow...</div>
        </div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="min-h-screen bg-[#111827] p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center"
          >
            <i className="ri-error-warning-line text-4xl text-red-400 mb-4"></i>
            <h2 className="text-xl font-semibold text-white mb-2">
              Workflow Not Found
            </h2>
            <p className="text-[#9ca3af] mb-4">
              {error || "The workflow you are looking for does not exist."}
            </p>
            <Link
              href="/process-lifecycle/workflows"
              className="inline-block px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              Back to Workflows
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const { nodes, edges } = convertWorkflowToReactFlow(workflow);
  const activeExecutions = executions.filter((e) => e.status === "running");
  const completedExecutions = executions.filter(
    (e) => e.status === "completed",
  );
  const failedExecutions = executions.filter((e) => e.status === "failed");

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#111827] p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <Link
                  href="/process-lifecycle/workflows"
                  className="text-[#9ca3af] hover:text-white mb-2 inline-flex items-center gap-2"
                >
                  <i className="ri-arrow-left-line"></i>
                  Back to Workflows
                </Link>
                <h1 className="text-3xl font-bold text-white">
                  {workflow.name}
                </h1>
                {workflow.description && (
                  <p className="text-[#9ca3af] mt-2">{workflow.description}</p>
                )}
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/process-lifecycle/workflows/builder?id=${workflow.id}`}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <i className="ri-edit-line"></i>
                  Edit
                </Link>
                <button
                  onClick={() => router.push("/process-lifecycle/workflows")}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-4 mt-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  workflow.status === "active"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : workflow.status === "draft"
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                }`}
              >
                {workflow.status.toUpperCase()}
              </span>
              <span className="text-[#9ca3af] text-sm">
                Created: {new Date(workflow.createdAt).toLocaleDateString()}
              </span>
              <span className="text-[#9ca3af] text-sm">
                Updated: {new Date(workflow.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-white/10">
            {(["details", "executions", "analytics"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === tab
                    ? "border-purple-500 text-purple-400"
                    : "border-transparent text-[#9ca3af] hover:text-white"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "details" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Workflow Visualization */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Workflow Diagram
                </h2>
                <div className="h-[600px] bg-[#0a0a0a] rounded-lg">
                  <ReactFlow nodes={nodes} edges={edges} fitView>
                    <Background />
                    <Controls />
                    <MiniMap />
                  </ReactFlow>
                </div>
              </div>

              {/* Workflow Steps */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Steps ({workflow.steps.length})
                </h2>
                <div className="space-y-3">
                  {workflow.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-white font-medium">
                              {step.name}
                            </h3>
                            <p className="text-[#9ca3af] text-sm capitalize">
                              {step.type}
                            </p>
                          </div>
                        </div>
                        {step.connections && step.connections.length > 0 && (
                          <div className="text-[#9ca3af] text-sm">
                            → {step.connections.length} connection
                            {step.connections.length > 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "executions" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Execution Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <div className="text-[#9ca3af] text-sm mb-2">
                    Active Executions
                  </div>
                  <div className="text-3xl font-bold text-cyan-400">
                    {activeExecutions.length}
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <div className="text-[#9ca3af] text-sm mb-2">Completed</div>
                  <div className="text-3xl font-bold text-green-400">
                    {completedExecutions.length}
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <div className="text-[#9ca3af] text-sm mb-2">Failed</div>
                  <div className="text-3xl font-bold text-red-400">
                    {failedExecutions.length}
                  </div>
                </div>
              </div>

              {/* Executions List */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Recent Executions
                </h2>
                {executions.length === 0 ? (
                  <div className="text-center py-12 text-[#9ca3af]">
                    <i className="ri-inbox-line text-4xl mb-4"></i>
                    <p>No executions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {executions.slice(0, 10).map((execution) => (
                      <div
                        key={execution.id}
                        className="bg-white/5 border border-white/10 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">
                              Execution {execution.id.slice(0, 8)}
                            </div>
                            <div className="text-[#9ca3af] text-sm">
                              Record: {execution.recordId} • Started:{" "}
                              {new Date(execution.startedAt).toLocaleString()}
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              execution.status === "completed"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : execution.status === "running"
                                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {execution.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4">
                Workflow Analytics
              </h2>
              <div className="text-center py-12 text-[#9ca3af]">
                <i className="ri-bar-chart-line text-4xl mb-4"></i>
                <p>Analytics coming soon</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
