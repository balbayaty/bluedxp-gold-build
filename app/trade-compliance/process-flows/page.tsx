/**
 * Process Flows Page
 * View and manage trade compliance process flows
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface ProcessStep {
  id: string;
  name: string;
  type:
    | "DOCUMENT"
    | "LICENSE"
    | "INSPECTION"
    | "APPROVAL"
    | "PAYMENT"
    | "CUSTOMS";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
  estimatedDuration: number; // in days
  actualDuration?: number;
  dependencies: string[];
  startDate?: string;
  endDate?: string;
}

interface ProcessFlow {
  id: string;
  recordId: string;
  recordNumber: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "BLOCKED";
  steps: ProcessStep[];
  createdAt: string;
  updatedAt: string;
}

export default function ProcessFlowsPage() {
  const router = useRouter();
  const [flows, setFlows] = useState<ProcessFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFlow, setSelectedFlow] = useState<ProcessFlow | null>(null);

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/trade-compliance/process-flows");
      const data = await response.json();

      if (data.success && data.flows) {
        setFlows(data.flows);
      } else {
        setFlows([]);
      }
    } catch (error) {
      console.error("Error loading process flows:", error);
      setFlows([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFlows = flows.filter(
    (flow) =>
      flow.recordNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flow.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500/20 text-green-400";
      case "BLOCKED":
        return "bg-red-500/20 text-red-400";
      case "ACTIVE":
        return "bg-blue-500/20 text-blue-400";
      case "DRAFT":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "BLOCKED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "IN_PROGRESS":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "PENDING":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case "DOCUMENT":
        return "📄";
      case "LICENSE":
        return "📋";
      case "INSPECTION":
        return "🔍";
      case "APPROVAL":
        return "✅";
      case "PAYMENT":
        return "💳";
      case "CUSTOMS":
        return "🚢";
      default:
        return "📌";
    }
  };

  const calculateProgress = (flow: ProcessFlow) => {
    if (flow.steps.length === 0) return 0;
    const completed = flow.steps.filter((s) => s.status === "COMPLETED").length;
    return Math.round((completed / flow.steps.length) * 100);
  };

  return (
    <div className="min-h-screen bg-[#111827] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - Following UI/UX Standards */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0 mt-0.5">
              <i className="ri-flow-chart-line text-white text-lg sm:text-xl"></i>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1.5 sm:mb-2 leading-tight">
                Process Flows
              </h1>
              <p className="text-[#9ca3af] text-sm sm:text-base leading-relaxed">
                View and manage automated trade compliance process flows with
                step-by-step tracking
              </p>
            </div>
          </div>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 mb-4 sm:mb-6 flex items-start gap-3"
        >
          <i className="ri-information-line text-indigo-400 text-xl flex-shrink-0 mt-0.5"></i>
          <div className="text-sm text-indigo-400">
            <p className="font-medium mb-1">Automated Workflow Orchestration</p>
            <p>
              Process flows are automatically created based on trade direction,
              countries, and product categories. Each step tracks dependencies,
              timelines, and status.
            </p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6"
        >
          <div className="relative">
            <i className="ri-file-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af]"></i>
            <input
              type="text"
              placeholder="Search process flows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </motion.div>

        {/* Process Flows List */}
        {loading ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-12 text-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#9ca3af] text-sm">Loading process flows...</p>
          </div>
        ) : filteredFlows.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-12 text-center">
            <i className="ri-flow-chart-line mx-auto text-6xl text-[#6b7280] mb-4"></i>
            <h3 className="text-xl font-semibold text-white mb-2">
              No process flows found
            </h3>
            <p className="text-[#9ca3af]">
              {flows.length === 0
                ? "Process flows will be automatically created when you create trade compliance records"
                : "Try adjusting your search"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFlows.map((flow, index) => {
              const progress = calculateProgress(flow);
              return (
                <motion.div
                  key={flow.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 hover:border-cyan-500/50 transition-all cursor-pointer"
                  onClick={() =>
                    setSelectedFlow(selectedFlow?.id === flow.id ? null : flow)
                  }
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <i className="ri-flow-chart-line text-2xl text-cyan-400"></i>
                        <h3 className="text-lg font-semibold text-white">
                          {flow.name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(flow.status)}`}
                        >
                          {flow.status}
                        </span>
                      </div>
                      <p className="text-sm text-[#9ca3af]">
                        Record: {flow.recordNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {progress}%
                      </div>
                      <div className="text-xs text-[#9ca3af]">Complete</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          progress === 100
                            ? "bg-green-500"
                            : flow.status === "BLOCKED"
                              ? "bg-red-500"
                              : "bg-cyan-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Steps Preview */}
                  {selectedFlow?.id === flow.id && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <h4 className="text-sm font-semibold text-white mb-4">
                        Process Steps
                      </h4>
                      <div className="space-y-3">
                        {flow.steps.map((step, index) => (
                          <div
                            key={step.id}
                            className={`p-4 rounded-lg border-2 ${getStepStatusColor(step.status)}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <span className="text-2xl">
                                  {getStepIcon(step.type)}
                                </span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-white">
                                      {step.name}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 bg-white/10 text-white rounded">
                                      {step.type}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
                                    {step.dependencies.length > 0 && (
                                      <span>
                                        Depends on: {step.dependencies.length}{" "}
                                        step(s)
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <i className="ri-time-line"></i>
                                      {step.estimatedDuration} days
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {step.status === "COMPLETED" && (
                                  <i className="ri-checkbox-circle-line text-green-400 text-xl"></i>
                                )}
                                {step.status === "BLOCKED" && (
                                  <i className="ri-alert-line text-red-400 text-xl"></i>
                                )}
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded ${getStepStatusColor(step.status)}`}
                                >
                                  {step.status.replace("_", " ")}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Steps Summary */}
                  {selectedFlow?.id !== flow.id && (
                    <div className="flex items-center gap-4 text-sm text-[#9ca3af]">
                      <span>{flow.steps.length} steps</span>
                      <span>•</span>
                      <span>
                        {
                          flow.steps.filter((s) => s.status === "COMPLETED")
                            .length
                        }{" "}
                        completed
                      </span>
                      <span>•</span>
                      <span>
                        {
                          flow.steps.filter((s) => s.status === "IN_PROGRESS")
                            .length
                        }{" "}
                        in progress
                      </span>
                      {flow.steps.filter((s) => s.status === "BLOCKED").length >
                        0 && (
                        <>
                          <span>•</span>
                          <span className="text-red-400 font-medium">
                            {
                              flow.steps.filter((s) => s.status === "BLOCKED")
                                .length
                            }{" "}
                            blocked
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
