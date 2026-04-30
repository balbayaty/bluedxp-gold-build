/**
 * Unified Process & Lifecycle Management Module
 * Main entry point - exports all services and components
 *
 * This module consolidates:
 * - Lifecycle Management
 * - Workflow Automation
 * - Process Mining
 * - Process Analytics
 * - Process Orchestration
 */

// ============================================================================
// CORE SERVICES
// ============================================================================

export { processOrchestrator } from "./core/processOrchestrator";
export { processRegistry } from "./core/processRegistry";

// ============================================================================
// LIFECYCLE SERVICE
// ============================================================================

export { lifecycleService } from "./lifecycle/lifecycleService";
export * from "./lifecycle/configurations";

// ============================================================================
// WORKFLOW SERVICE
// ============================================================================

export { workflowService } from "./workflow/workflowService";
export type {
  Workflow,
  WorkflowStep,
  WorkflowExecution,
} from "./workflow/workflowService";
export { templateLibrary } from "./workflow/templateLibrary";

// ============================================================================
// PROCESS MINING SERVICE
// ============================================================================

export { processMiningService } from "./process-mining/processMiningService";

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

export { processAnalyticsService } from "./analytics/processAnalyticsService";

// ============================================================================
// TYPES
// ============================================================================

export type * from "@/types/process-lifecycle";

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Initialize the unified process lifecycle module
 */
export function initializeProcessLifecycleModule(): void {
  // Register default processes
  // This will be called on module initialization
  console.log("Process & Lifecycle Management Module initialized");
}

/**
 * Get unified process view data for an entity
 */
export async function getUnifiedProcessData(
  entityId: string,
  entityType: string,
): Promise<{
  lifecycle: any;
  workflow?: any;
  processMining?: any;
  analytics?: any;
  insights?: any[];
}> {
  try {
    const [lifecycle, processMining] = await Promise.all([
      lifecycleService
        .getLifecycle(entityId, entityType as any)
        .catch(() => null),
      processOrchestrator
        .getProcessMiningFromLifecycle(entityId, entityType)
        .catch(() => null),
    ]);

    // Get insights only if we have a valid entity
    let insights: any[] = [];
    if (entityId && entityType && entityType !== "ALL") {
      try {
        insights = await processOrchestrator.getPredictiveInsights(
          entityId,
          entityType,
        );
      } catch (error) {
        console.error("Error getting insights:", error);
      }
    }

    // Get workflow execution if exists
    let activeWorkflow = undefined;
    try {
      const workflowExecutions =
        await workflowService.getExecutionsForRecord(entityId);
      activeWorkflow = workflowExecutions.find((w) => w.status === "running");
    } catch (error) {
      console.error("Error getting workflow executions:", error);
    }

    return {
      lifecycle,
      workflow: activeWorkflow,
      processMining,
      insights,
    };
  } catch (error) {
    console.error("Error in getUnifiedProcessData:", error);
    return {
      lifecycle: null,
      insights: [],
    };
  }
}
