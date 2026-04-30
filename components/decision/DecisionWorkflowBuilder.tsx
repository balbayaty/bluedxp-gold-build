/**
 * Decision Workflow Builder
 * Integrates with existing Process Lifecycle Workflow Service
 * No duplication - reuses existing workflow infrastructure
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type {
  DecisionWorkflow,
  DecisionWorkflowStep,
} from "@/lib/services/decision-core/types";
import { workflowService } from "@/lib/services/process-lifecycle";
import type { Workflow, WorkflowStep } from "@/lib/services/process-lifecycle";
import { useNotifications } from "@/lib/utils/notifications";
import { NotificationPatterns } from "@/lib/utils/notifications";

interface DecisionWorkflowBuilderProps {
  module: string;
  entityType: string;
  onSave?: (workflow: DecisionWorkflow) => void;
}

export default function DecisionWorkflowBuilder({
  module,
  entityType,
  onSave,
}: DecisionWorkflowBuilderProps) {
  const notifications = useNotifications();
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [steps, setSteps] = useState<DecisionWorkflowStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<DecisionWorkflowStep | null>(
    null,
  );

  // Integrate with existing workflow service
  const createWorkflow = async () => {
    if (!workflowName) {
      notifications.warning(
        NotificationPatterns.validationError("Please enter a workflow name")
          .title,
        NotificationPatterns.validationError("Please enter a workflow name")
          .message,
        NotificationPatterns.validationError("Please enter a workflow name"),
      );
      return;
    }

    // Convert decision workflow to process-lifecycle workflow format
    const processWorkflow: Workflow = {
      id: `wf-${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      steps: steps.map((step, index) => ({
        id: step.id,
        name: step.name,
        type: "approval" as const,
        config: {
          approver: step.approverRole || step.approverUserId,
          timeout: step.timeout,
          escalationRole: step.escalationRole,
          conditions: step.conditions,
        },
        position: { x: 100, y: index * 100 },
        connections: index < steps.length - 1 ? [steps[index + 1].id] : [],
      })),
      triggers: [
        {
          event: `decision.${module}.${entityType}.pending`,
          conditions: {},
        },
      ],
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save using existing workflow service
    const saved = await workflowService.createWorkflow(processWorkflow);

    // Convert back to decision workflow format
    const decisionWorkflow: DecisionWorkflow = {
      id: saved.id,
      name: saved.name,
      description: saved.description,
      module,
      entityType,
      steps: steps,
      status: "draft",
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };

    if (onSave) {
      onSave(decisionWorkflow);
    }

    return decisionWorkflow;
  };

  const addStep = () => {
    const newStep: DecisionWorkflowStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      stepNumber: steps.length + 1,
      name: `Step ${steps.length + 1}`,
      description: "",
      required: true,
      status: "pending",
    };
    setSteps([...steps, newStep]);
    setSelectedStep(newStep);
  };

  const updateStep = (
    stepId: string,
    updates: Partial<DecisionWorkflowStep>,
  ) => {
    setSteps(
      steps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step,
      ),
    );
    if (selectedStep?.id === stepId) {
      setSelectedStep({ ...selectedStep, ...updates });
    }
  };

  const deleteStep = (stepId: string) => {
    setSteps(steps.filter((step) => step.id !== stepId));
    if (selectedStep?.id === stepId) {
      setSelectedStep(null);
    }
    // Renumber steps
    setSteps((prev) =>
      prev.map((step, index) => ({
        ...step,
        stepNumber: index + 1,
      })),
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">
          Decision Workflow Builder
        </h2>
        <p className="text-gray-400 mb-6">
          Build multi-step decision workflows that integrate with the Process
          Lifecycle system. This workflow will be triggered when decisions are
          created for {module}/{entityType}.
        </p>

        {/* Workflow Info */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Workflow Name
            </label>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="e.g., MSDS Approval Workflow"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Description
            </label>
            <textarea
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              placeholder="Describe the workflow..."
              rows={3}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Workflow Steps</h3>
            <button
              onClick={addStep}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <i className="ri-add-line mr-2"></i>Add Step
            </button>
          </div>

          <div className="space-y-3">
            {steps.map((step) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`bg-gray-700 rounded-lg p-4 border-2 cursor-pointer transition-colors ${
                  selectedStep?.id === step.id
                    ? "border-blue-500"
                    : "border-gray-600"
                }`}
                onClick={() => setSelectedStep(step)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {step.stepNumber}
                    </div>
                    <div>
                      <div className="text-white font-medium">{step.name}</div>
                      {step.description && (
                        <div className="text-gray-400 text-sm">
                          {step.description}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        {step.approverRole && (
                          <span>
                            <i className="ri-user-line mr-1"></i>
                            {step.approverRole}
                          </span>
                        )}
                        {step.timeout && (
                          <span>
                            <i className="ri-time-line mr-1"></i>
                            {step.timeout}h timeout
                          </span>
                        )}
                        {step.required ? (
                          <span className="text-red-400">Required</span>
                        ) : (
                          <span className="text-yellow-400">Optional</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        step.status === "completed"
                          ? "bg-green-500"
                          : step.status === "in_progress"
                            ? "bg-blue-500"
                            : "bg-gray-600"
                      } text-white`}
                    >
                      {step.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteStep(step.id);
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            {steps.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <i className="ri-file-list-3-line text-4xl mb-2"></i>
                <p>No steps yet. Click "Add Step" to create your workflow.</p>
              </div>
            )}
          </div>
        </div>

        {/* Step Editor */}
        {selectedStep && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-700 rounded-lg p-6 border border-gray-600"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Edit Step {selectedStep.stepNumber}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Step Name
                </label>
                <input
                  type="text"
                  value={selectedStep.name}
                  onChange={(e) =>
                    updateStep(selectedStep.id, { name: e.target.value })
                  }
                  className="w-full bg-gray-600 text-white rounded-lg px-4 py-2 border border-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Description
                </label>
                <textarea
                  value={selectedStep.description || ""}
                  onChange={(e) =>
                    updateStep(selectedStep.id, { description: e.target.value })
                  }
                  rows={2}
                  className="w-full bg-gray-600 text-white rounded-lg px-4 py-2 border border-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Approver Role
                  </label>
                  <input
                    type="text"
                    value={selectedStep.approverRole || ""}
                    onChange={(e) =>
                      updateStep(selectedStep.id, {
                        approverRole: e.target.value,
                      })
                    }
                    placeholder="e.g., manager, director"
                    className="w-full bg-gray-600 text-white rounded-lg px-4 py-2 border border-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Timeout (hours)
                  </label>
                  <input
                    type="number"
                    value={selectedStep.timeout || ""}
                    onChange={(e) =>
                      updateStep(selectedStep.id, {
                        timeout: parseInt(e.target.value) || undefined,
                      })
                    }
                    className="w-full bg-gray-600 text-white rounded-lg px-4 py-2 border border-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Escalation Role
                </label>
                <input
                  type="text"
                  value={selectedStep.escalationRole || ""}
                  onChange={(e) =>
                    updateStep(selectedStep.id, {
                      escalationRole: e.target.value,
                    })
                  }
                  placeholder="Role to escalate to if timeout"
                  className="w-full bg-gray-600 text-white rounded-lg px-4 py-2 border border-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-gray-400">
                  <input
                    type="checkbox"
                    checked={selectedStep.required}
                    onChange={(e) =>
                      updateStep(selectedStep.id, {
                        required: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span>Required Step</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={createWorkflow}
            disabled={!workflowName || steps.length === 0}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            <i className="ri-save-line mr-2"></i>Save Workflow
          </button>
        </div>
      </div>
    </div>
  );
}
