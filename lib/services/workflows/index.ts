/**
 * Workflow Services Index
 * Export all workflow-related services
 */

export * from "../process-lifecycle/workflow/workflowService";
export {
  EnhancedWorkflowService,
  enhancedWorkflowService,
} from "./enhancedWorkflowService";

// Type exports
export type {
  WorkflowTemplate,
  WorkflowInstance,
  WorkflowSLA,
  WorkflowBenchmark,
  WorkflowStatistics,
} from "./enhancedWorkflowService";
