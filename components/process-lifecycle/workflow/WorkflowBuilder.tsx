/**
 * Advanced Visual Workflow Builder
 * Drag-and-drop workflow creation interface
 * More advanced than ServiceNow and Power Automate
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  NodeTypes,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import type {
  Workflow,
  WorkflowStep,
} from "@/lib/services/process-lifecycle/workflow/workflowService";
import { workflowService } from "@/lib/services/process-lifecycle";
import { templateLibrary } from "@/lib/services/process-lifecycle/workflow/templateLibrary";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useNotifications } from "@/lib/utils/notifications";
import { NotificationPatterns } from "@/lib/utils/notifications";

// Custom node types
import ActionNode from "./nodes/ActionNode";
import ConditionNode from "./nodes/ConditionNode";
import ApprovalNode from "./nodes/ApprovalNode";
import NotificationNode from "./nodes/NotificationNode";
import IntegrationNode from "./nodes/IntegrationNode";

const nodeTypes: NodeTypes = {
  action: ActionNode,
  condition: ConditionNode,
  approval: ApprovalNode,
  notification: NotificationNode,
  integration: IntegrationNode,
};

interface WorkflowBuilderProps {
  workflowId?: string;
  onSave?: (workflow: Workflow) => void;
  onCancel?: () => void;
  initialWorkflow?: Partial<Workflow>;
}

export default function WorkflowBuilder({
  workflowId,
  onSave,
  onCancel,
  initialWorkflow,
}: WorkflowBuilderProps) {
  const [workflowName, setWorkflowName] = useState(initialWorkflow?.name || "");
  const [workflowDescription, setWorkflowDescription] = useState(
    initialWorkflow?.description || "",
  );

  // Update state when initialWorkflow changes (for editing)
  useEffect(() => {
    if (initialWorkflow) {
      setWorkflowName(initialWorkflow.name || "");
      setWorkflowDescription(initialWorkflow.description || "");
    }
  }, [initialWorkflow]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [saving, setSaving] = useState(false);

  // Convert workflow steps to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    if (initialWorkflow?.steps) {
      return initialWorkflow.steps.map((step, index) => ({
        id: step.id,
        type:
          step.type === "action"
            ? "action"
            : step.type === "condition"
              ? "condition"
              : step.type === "approval"
                ? "approval"
                : step.type === "notification"
                  ? "notification"
                  : step.type === "integration"
                    ? "integration"
                    : "action",
        position: step.position || { x: index * 200, y: 100 },
        data: {
          label: step.name,
          config: step.config,
          step,
        },
      }));
    }
    return [];
  }, [initialWorkflow]);

  // Convert workflow step connections to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    if (initialWorkflow?.steps) {
      const edges: Edge[] = [];
      initialWorkflow.steps.forEach((step) => {
        step.connections.forEach((targetId) => {
          edges.push({
            id: `e${step.id}-${targetId}`,
            source: step.id,
            target: targetId,
            type: "smoothstep",
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          });
        });
      });
      return edges;
    }
    return [];
  }, [initialWorkflow]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  /**
   * Handle node connection
   */
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges],
  );

  /**
   * Handle node click
   */
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  /**
   * Add node from palette
   */
  const addNode = useCallback(
    (type: WorkflowStep["type"], position: { x: number; y: number }) => {
      const newNode: Node = {
        id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Step`,
          config: {},
          step: {
            id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Step`,
            type,
            config: {},
            position,
            connections: [],
          },
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes],
  );

  /**
   * Update node
   */
  const updateNode = useCallback(
    (nodeId: string, updates: Partial<WorkflowStep>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                step: {
                  ...node.data.step,
                  ...updates,
                },
              },
            };
          }
          return node;
        }),
      );
    },
    [setNodes],
  );

  /**
   * Delete node
   */
  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      );
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [setNodes, setEdges, selectedNode],
  );

  /**
   * Load template
   */
  const loadTemplate = useCallback(
    async (templateId: string) => {
      try {
        const workflow = await templateLibrary.instantiateTemplate(templateId);

        // Convert to nodes and edges
        const templateNodes: Node[] = workflow.steps.map((step, index) => ({
          id: step.id,
          type:
            step.type === "action"
              ? "action"
              : step.type === "condition"
                ? "condition"
                : step.type === "approval"
                  ? "approval"
                  : step.type === "notification"
                    ? "notification"
                    : step.type === "integration"
                      ? "integration"
                      : "action",
          position: step.position || { x: index * 200, y: 100 },
          data: {
            label: step.name,
            config: step.config,
            step,
          },
        }));

        const templateEdges: Edge[] = [];
        workflow.steps.forEach((step) => {
          step.connections.forEach((targetId) => {
            templateEdges.push({
              id: `e${step.id}-${targetId}`,
              source: step.id,
              target: targetId,
              type: "smoothstep",
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            });
          });
        });

        setNodes(templateNodes);
        setEdges(templateEdges);
        setWorkflowName(workflow.name);
        setWorkflowDescription(workflow.description || "");
        setShowTemplates(false);
      } catch (error) {
        console.error("Error loading template:", error);
      }
    },
    [setNodes, setEdges],
  );

  /**
   * Save workflow
   */
  const notifications = useNotifications();

  const handleSave = useCallback(async () => {
    if (!workflowName.trim()) {
      notifications.warning(
        NotificationPatterns.validationError("Please enter a workflow name")
          .title,
        NotificationPatterns.validationError("Please enter a workflow name")
          .message,
        NotificationPatterns.validationError("Please enter a workflow name"),
      );
      return;
    }

    setSaving(true);

    try {
      // Convert nodes to workflow steps
      const steps: WorkflowStep[] = nodes.map((node) => ({
        id: node.id,
        name: node.data.label || node.data.step.name,
        type: (node.type as WorkflowStep["type"]) || "action",
        config: node.data.config || node.data.step.config || {},
        position: node.position,
        connections: edges
          .filter((edge) => edge.source === node.id)
          .map((edge) => edge.target),
      }));

      const workflowData: Omit<Workflow, "id" | "createdAt" | "updatedAt"> = {
        name: workflowName,
        description: workflowDescription,
        steps,
        triggers: initialWorkflow?.triggers || [],
        status: "draft",
      };

      let workflow: Workflow;
      if (workflowId) {
        const updated = await workflowService.updateWorkflow(
          workflowId,
          workflowData,
        );
        if (!updated) throw new Error("Failed to update workflow");
        workflow = updated;
      } else {
        workflow = await workflowService.createWorkflow(workflowData);
      }

      if (onSave) {
        onSave(workflow);
      }

      // Show success notification
      notifications.success(
        NotificationPatterns.workflowSaved(workflow.name).title,
        NotificationPatterns.workflowSaved(workflow.name).message,
        NotificationPatterns.workflowSaved(workflow.name),
      );
    } catch (error) {
      console.error("Error saving workflow:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      notifications.error(
        NotificationPatterns.workflowError(errorMsg).title,
        NotificationPatterns.workflowError(errorMsg).message,
        NotificationPatterns.workflowError(errorMsg),
      );
    } finally {
      setSaving(false);
    }
  }, [
    workflowName,
    workflowDescription,
    nodes,
    edges,
    workflowId,
    initialWorkflow,
    onSave,
    notifications,
  ]);

  /**
   * Validate workflow
   */
  const validateWorkflow = useCallback((): {
    valid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    if (nodes.length === 0) {
      errors.push("Workflow must have at least one step");
    }

    // Check for orphaned nodes
    const connectedNodes = new Set<string>();
    edges.forEach((edge) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    nodes.forEach((node) => {
      if (!connectedNodes.has(node.id) && nodes.length > 1) {
        errors.push(`Node "${node.data.label}" is not connected`);
      }
    });

    // Check for cycles (simplified)
    // In production, would use proper cycle detection algorithm

    return {
      valid: errors.length === 0,
      errors,
    };
  }, [nodes, edges]);

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-4 flex-1">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Workflow Name"
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              placeholder="Description"
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <i className="ri-file-list-3-line"></i>
              Templates
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <i className="ri-save-line"></i>
              {saving ? "Saving..." : "Save"}
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Node Palette */}
          <div className="w-64 bg-white/5 border-r border-white/10 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-white mb-4">
              Step Types
            </h3>
            <div className="space-y-2">
              {[
                {
                  type: "action",
                  label: "Action",
                  icon: "ri-play-line",
                  color: "cyan",
                },
                {
                  type: "condition",
                  label: "Condition",
                  icon: "ri-question-line",
                  color: "yellow",
                },
                {
                  type: "approval",
                  label: "Approval",
                  icon: "ri-checkbox-line",
                  color: "green",
                },
                {
                  type: "notification",
                  label: "Notification",
                  icon: "ri-notification-line",
                  color: "blue",
                },
                {
                  type: "integration",
                  label: "Integration",
                  icon: "ri-plug-line",
                  color: "purple",
                },
              ].map((item) => (
                <motion.button
                  key={item.type}
                  onClick={() =>
                    addNode(item.type as WorkflowStep["type"], {
                      x: 100,
                      y: 100,
                    })
                  }
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-left hover:bg-white/10 transition-colors flex items-center gap-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <i
                    className={`${item.icon} text-${item.color}-400 text-lg`}
                  ></i>
                  <span className="text-sm text-white">{item.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Templates Panel */}
            {showTemplates && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Templates
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {templateLibrary.getPopularTemplates(5).map((template) => (
                    <button
                      key={template.id}
                      onClick={() => loadTemplate(template.id)}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-left hover:bg-white/10 transition-colors"
                    >
                      <div className="text-sm font-medium text-white">
                        {template.name}
                      </div>
                      <div className="text-xs text-[#9ca3af] mt-1">
                        {template.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              className="bg-[#0a0a0a]"
            >
              <Background color="#1f2937" gap={16} />
              <Controls className="bg-white/5 border border-white/10 rounded-lg" />
              <MiniMap
                className="bg-white/5 border border-white/10 rounded-lg"
                nodeColor="#06b6d4"
              />
            </ReactFlow>
          </div>

          {/* Properties Panel */}
          {selectedNode && (
            <div className="w-80 bg-white/5 border-l border-white/10 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Properties</h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-[#9ca3af] hover:text-white"
                >
                  <i className="ri-close-line"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Step Name
                  </label>
                  <input
                    type="text"
                    value={selectedNode.data.label}
                    onChange={(e) => {
                      updateNode(selectedNode.id, { name: e.target.value });
                      setSelectedNode({
                        ...selectedNode,
                        data: { ...selectedNode.data, label: e.target.value },
                      });
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">
                    Step Type
                  </label>
                  <div className="text-sm text-white">{selectedNode.type}</div>
                </div>

                {/* Type-specific configuration */}
                {selectedNode.type === "action" && (
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Action
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.config?.action || ""}
                      onChange={(e) => {
                        updateNode(selectedNode.id, {
                          config: {
                            ...selectedNode.data.config,
                            action: e.target.value,
                          },
                        });
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                {selectedNode.type === "approval" && (
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Approver
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.config?.approver || ""}
                      onChange={(e) => {
                        updateNode(selectedNode.id, {
                          config: {
                            ...selectedNode.data.config,
                            approver: e.target.value,
                          },
                        });
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                <button
                  onClick={() => deleteNode(selectedNode.id)}
                  className="w-full px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <i className="ri-delete-bin-line mr-2"></i>
                  Delete Step
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Validation Panel */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          {(() => {
            const validation = validateWorkflow();
            return (
              <div className="flex items-center gap-2">
                {validation.valid ? (
                  <>
                    <i className="ri-checkbox-circle-line text-green-400"></i>
                    <span className="text-sm text-green-400">
                      Workflow is valid
                    </span>
                  </>
                ) : (
                  <>
                    <i className="ri-error-warning-line text-yellow-400"></i>
                    <div className="flex-1">
                      <div className="text-sm text-yellow-400">
                        Validation errors:
                      </div>
                      <ul className="text-xs text-[#9ca3af] list-disc list-inside">
                        {validation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </ErrorBoundary>
  );
}
