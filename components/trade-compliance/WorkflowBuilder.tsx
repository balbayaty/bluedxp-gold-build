/**
 * Visual Workflow Builder Component
 * Drag-and-drop workflow designer for trade compliance automation
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { workflowService } from "@/lib/services/trade-compliance/workflowService";
import type {
  Workflow,
  WorkflowStep,
} from "@/lib/services/trade-compliance/workflowService";

export default function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const data = await workflowService.getWorkflows("default");
      setWorkflows(data);
    } catch (error) {
      console.error("Error loading workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNewWorkflow = async () => {
    const workflow = await workflowService.createWorkflow({
      name: "New Workflow",
      description: "",
      steps: [],
      triggers: [],
      status: "draft",
    });
    setWorkflows([...workflows, workflow]);
    setSelectedWorkflow(workflow);
    setIsEditing(true);
  };

  const addStep = (type: WorkflowStep["type"]) => {
    if (!selectedWorkflow) return;

    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      name: `${type} Step`,
      type,
      config: {},
      position: { x: 100, y: 100 },
      connections: [],
    };

    const updated = {
      ...selectedWorkflow,
      steps: [...selectedWorkflow.steps, newStep],
    };

    setSelectedWorkflow(updated);
    updateWorkflow(updated);
  };

  const updateWorkflow = async (workflow: Workflow) => {
    if (!workflow.id) return;
    await workflowService.updateWorkflow(workflow.id, workflow);
    setWorkflows(workflows.map((w) => (w.id === workflow.id ? workflow : w)));
  };

  const stepTypes = [
    {
      type: "action" as const,
      label: "Action",
      icon: "ri-play-line",
      color: "bg-blue-500",
    },
    {
      type: "condition" as const,
      label: "Condition",
      icon: "ri-question-line",
      color: "bg-yellow-500",
    },
    {
      type: "approval" as const,
      label: "Approval",
      icon: "ri-checkbox-circle-line",
      color: "bg-green-500",
    },
    {
      type: "notification" as const,
      label: "Notification",
      icon: "ri-notification-line",
      color: "bg-purple-500",
    },
    {
      type: "integration" as const,
      label: "Integration",
      icon: "ri-plug-line",
      color: "bg-orange-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#9ca3af] text-sm">Loading workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <i className="ri-flow-chart text-cyan-400"></i>
            Workflow Builder
          </h2>
          <p className="text-[#9ca3af]">
            Design and automate trade compliance processes
          </p>
        </div>
        <button
          onClick={createNewWorkflow}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2"
        >
          <i className="ri-add-line"></i>
          New Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Workflow List */}
        <div className="lg:col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-cyan-500/50 transition-all">
          <h3 className="font-semibold text-white mb-4">Workflows</h3>
          <div className="space-y-2">
            {workflows.map((workflow) => (
              <button
                key={workflow.id}
                onClick={() => {
                  setSelectedWorkflow(workflow);
                  setIsEditing(false);
                }}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedWorkflow?.id === workflow.id
                    ? "border-cyan-500 bg-cyan-500/20"
                    : "border-white/10 hover:border-white/20 bg-white/5"
                }`}
              >
                <div className="font-medium text-white">{workflow.name}</div>
                <div className="text-xs text-[#9ca3af] mt-1">
                  {workflow.steps.length} steps • {workflow.status}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="lg:col-span-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 hover:border-cyan-500/50 transition-all">
          {selectedWorkflow ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedWorkflow.name}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {selectedWorkflow.description || "No description"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3 py-1 border border-white/10 rounded-lg text-sm hover:bg-white/10 text-white transition-colors"
                  >
                    {isEditing ? "View" : "Edit"}
                  </button>
                  <select
                    value={selectedWorkflow.status}
                    onChange={(e) => {
                      const updated = {
                        ...selectedWorkflow,
                        status: e.target.value as any,
                      };
                      setSelectedWorkflow(updated);
                      updateWorkflow(updated);
                    }}
                    className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {isEditing ? (
                <>
                  {/* Step Palette */}
                  <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-sm font-medium text-white mb-2">
                      Add Step
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {stepTypes.map((stepType) => (
                        <button
                          key={stepType.type}
                          onClick={() => addStep(stepType.type)}
                          className={`${stepType.color} text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity`}
                        >
                          <i className={stepType.icon}></i>
                          {stepType.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Canvas */}
                  <div
                    ref={canvasRef}
                    className="border-2 border-dashed border-white/20 rounded-lg p-8 min-h-[400px] bg-white/5 relative"
                  >
                    {selectedWorkflow.steps.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-[#9ca3af]">
                          <i className="ri-flow-chart-line text-4xl mb-2"></i>
                          <p>
                            Click "Add Step" to start building your workflow
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        {selectedWorkflow.steps.map((step, idx) => (
                          <motion.div
                            key={step.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-lg p-3 shadow-md cursor-move"
                            style={{
                              left: step.position.x,
                              top: step.position.y,
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <i
                                className={`${stepTypes.find((s) => s.type === step.type)?.icon} text-lg text-white`}
                              ></i>
                              <span className="font-medium text-sm text-white">
                                {step.name}
                              </span>
                            </div>
                            <div className="text-xs text-[#9ca3af]">
                              {step.type}
                            </div>
                            {idx < selectedWorkflow.steps.length - 1 && (
                              <div className="absolute bottom-[-20px] left-1/2 transform -translate-x-1/2">
                                <i className="ri-arrow-down-line text-[#9ca3af]"></i>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-sm text-[#9ca3af] mb-1">Steps</div>
                      <div className="text-2xl font-bold text-white">
                        {selectedWorkflow.steps.length}
                      </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-sm text-[#9ca3af] mb-1">
                        Triggers
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {selectedWorkflow.triggers.length}
                      </div>
                    </div>
                  </div>

                  {selectedWorkflow.steps.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-white">
                        Workflow Steps
                      </div>
                      {selectedWorkflow.steps.map((step, idx) => (
                        <div
                          key={step.id}
                          className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-sm font-medium text-cyan-400 border border-cyan-500/30">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-white">
                              {step.name}
                            </div>
                            <div className="text-xs text-[#9ca3af] capitalize">
                              {step.type}
                            </div>
                          </div>
                          <i
                            className={`${stepTypes.find((s) => s.type === step.type)?.icon} text-[#9ca3af]`}
                          ></i>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-96 text-[#9ca3af]">
              <div className="text-center">
                <i className="ri-flow-chart-line text-4xl mb-2"></i>
                <p>Select a workflow to view or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
