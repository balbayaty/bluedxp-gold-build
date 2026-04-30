/**
 * Process Orchestrator
 * The brain that coordinates lifecycle, workflow, process mining, and analytics
 * Deep integration layer that makes everything work together seamlessly
 */

import { lifecycleService } from "../lifecycle/lifecycleService";
import { workflowService } from "../workflow/workflowService";
import { processMiningService } from "../process-mining/processMiningService";
import { processAnalyticsService } from "../analytics/processAnalyticsService";
import { processRegistry } from "./processRegistry";
import { eventBus } from "@/lib/services/event-store";
import type { EntityType } from "@/types/lifecycle";
import type {
  ProcessOrchestratorService,
  ProcessOrchestrationContext,
  ProcessOrchestrationResult,
  ProcessCoordination,
  ProcessMiningCase,
  ProcessAnalytics,
  CrossModuleAnalytics,
  PredictiveInsight,
  EntityType,
} from "@/types/process-lifecycle";

// ============================================================================
// PROCESS ORCHESTRATOR IMPLEMENTATION
// ============================================================================

class ProcessOrchestratorServiceImpl implements ProcessOrchestratorService {
  private coordinationQueue: ProcessCoordination[] = [];
  private isProcessing: boolean = false;

  /**
   * Main orchestration method - coordinates all services
   */
  async orchestrateProcess(
    context: ProcessOrchestrationContext,
    action: string,
    data?: Record<string, any>,
  ): Promise<ProcessOrchestrationResult> {
    const result: ProcessOrchestrationResult = {
      lifecycleUpdated: false,
      processMiningCaptured: false,
      analyticsUpdated: false,
      crossModuleActions: [],
    };

    try {
      // 1. Update Lifecycle
      if (action === "stage_transition" || action === "lifecycle_update") {
        if (data?.toStageId) {
          try {
            await lifecycleService.transitionStage(
              context.entityId,
              context.entityType as EntityType,
              data.toStageId,
              { ...data, userId: context.userId },
            );
            result.lifecycleUpdated = true;
          } catch (error) {
            console.error("Error transitioning lifecycle stage:", error);
          }
        }
      }

      // 2. Trigger Workflows (if configured)
      const processDef = processRegistry.getProcessDefinition(
        context.entityType,
      );
      if (processDef?.workflowTemplates && action === "stage_transition") {
        for (const workflowId of processDef.workflowTemplates) {
          try {
            await workflowService.executeWorkflow(
              workflowId,
              context.entityId,
              {
                ...context,
                ...data,
              },
            );
            result.workflowTriggered = workflowId;
            result.crossModuleActions?.push(`Workflow ${workflowId} triggered`);
          } catch (error) {
            console.error(`Error triggering workflow ${workflowId}:`, error);
          }
        }
      }

      // 3. Capture for Process Mining
      if (processDef?.processMiningEnabled) {
        await this.captureLifecycleEventForMining(
          context.entityId,
          context.entityType,
          {
            action,
            ...data,
            timestamp: new Date().toISOString(),
            context,
          },
        );
        result.processMiningCaptured = true;
      }

      // 4. Update Analytics
      if (processDef?.analyticsEnabled) {
        // Analytics are updated asynchronously
        this.updateAnalyticsAsync(context.entityType).catch(console.error);
        result.analyticsUpdated = true;
      }

      // 5. Handle Cross-Module Coordination
      if (processDef?.crossModuleLinks) {
        for (const link of processDef.crossModuleLinks) {
          if (link.linkType === "triggers" && action === "stage_transition") {
            await this.coordinateCrossModule({
              sourceEntityId: context.entityId,
              sourceEntityType: context.entityType,
              targetEntityId: data?.targetEntityId || context.entityId,
              targetEntityType: link.targetEntityType,
              coordinationType: "TRIGGER",
              metadata: { ...data, triggeredBy: context.entityType },
            });
            result.crossModuleActions?.push(
              `Triggered ${link.targetEntityType} in ${link.targetModule}`,
            );
          }
        }
      }

      // 6. Publish Event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "process.orchestrated",
        aggregateId: context.entityId,
        aggregateType: context.entityType,
        version: 1,
        timestamp: new Date().toISOString(),
        metadata: {
          action,
          context,
          result,
        },
        payload: {
          action,
          context,
          result,
          data,
        },
      });

      return result;
    } catch (error) {
      console.error("Process orchestration error:", error);
      throw error;
    }
  }

  /**
   * Coordinate cross-module processes
   */
  async coordinateCrossModule(
    coordination: ProcessCoordination,
  ): Promise<void> {
    this.coordinationQueue.push(coordination);

    if (!this.isProcessing) {
      this.processCoordinationQueue();
    }
  }

  private async processCoordinationQueue(): Promise<void> {
    if (this.isProcessing || this.coordinationQueue.length === 0) return;

    this.isProcessing = true;

    while (this.coordinationQueue.length > 0) {
      const coordination = this.coordinationQueue.shift();
      if (!coordination) break;

      try {
        switch (coordination.coordinationType) {
          case "TRIGGER":
            // Initialize lifecycle for target entity if needed
            const targetLifecycle = await lifecycleService.getLifecycle(
              coordination.targetEntityId,
              coordination.targetEntityType as EntityType,
            );
            if (!targetLifecycle) {
              await lifecycleService.initializeLifecycle(
                coordination.targetEntityId,
                coordination.targetEntityType as EntityType,
                coordination.metadata,
              );
            }
            break;

          case "UPDATE":
            // Update target entity lifecycle
            if (coordination.metadata?.stageId) {
              await lifecycleService.transitionStage(
                coordination.targetEntityId,
                coordination.targetEntityType as EntityType,
                coordination.metadata.stageId,
                coordination.metadata,
              );
            }
            break;

          case "SYNC":
            // Sync status between entities
            const sourceLifecycle = await lifecycleService.getLifecycle(
              coordination.sourceEntityId,
              coordination.sourceEntityType as EntityType,
            );
            if (sourceLifecycle && coordination.metadata?.syncStage) {
              await lifecycleService.transitionStage(
                coordination.targetEntityId,
                coordination.targetEntityType as EntityType,
                sourceLifecycle.currentStageId,
                {
                  syncedFrom: coordination.sourceEntityId,
                  ...coordination.metadata,
                },
              );
            }
            break;

          case "LINK":
            // Create link between entities (for analytics)
            // This would be handled by analytics service
            break;
        }

        // Publish coordination event
        await eventBus.publish({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "process.cross_module_coordinated",
          aggregateId: coordination.targetEntityId,
          aggregateType: coordination.targetEntityType,
          version: 1,
          timestamp: new Date().toISOString(),
          metadata: {
            coordination,
          },
          payload: coordination,
        });
      } catch (error) {
        console.error("Cross-module coordination error:", error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Trigger workflow on lifecycle stage transition
   */
  async triggerWorkflowOnStageTransition(
    entityId: string,
    entityType: string,
    stageId: string,
    workflowId: string,
  ): Promise<void> {
    const processDef = processRegistry.getProcessDefinition(entityType);
    if (!processDef) {
      throw new Error(`Process definition not found for ${entityType}`);
    }

    await workflowService.executeWorkflow(workflowId, entityId, {
      entityId,
      entityType,
      stageId,
      triggerType: "lifecycle_transition",
    });
  }

  /**
   * Update lifecycle from workflow execution
   */
  async updateLifecycleFromWorkflow(
    workflowExecutionId: string,
    stageId: string,
  ): Promise<void> {
    const execution = await workflowService.getExecution(workflowExecutionId);
    if (!execution) {
      throw new Error(`Workflow execution ${workflowExecutionId} not found`);
    }

    // Determine entity type from workflow context
    const entityType = execution.context?.entityType || "UNKNOWN";
    const entityId = execution.recordId;

    if (execution.status === "completed") {
      await lifecycleService.transitionStage(
        entityId,
        entityType as EntityType,
        stageId,
        {
          workflowExecutionId,
          triggeredBy: "workflow",
        },
      );
    }
  }

  /**
   * Capture lifecycle event for process mining
   */
  async captureLifecycleEventForMining(
    entityId: string,
    entityType: string,
    event: any,
  ): Promise<void> {
    await processMiningService.captureEvent({
      caseId: entityId,
      caseType: entityType,
      event: {
        id: `evt-${Date.now()}`,
        activity: event.action || "lifecycle_event",
        timestamp: event.timestamp || new Date().toISOString(),
        resource: event.userId || "system",
        data: event,
      },
    });
  }

  /**
   * Get process mining data from lifecycle
   */
  async getProcessMiningFromLifecycle(
    entityId: string,
    entityType: string,
  ): Promise<ProcessMiningCase | null> {
    return await processMiningService.getCase(entityId, entityType);
  }

  /**
   * Get unified analytics
   */
  async getUnifiedAnalytics(
    entityType?: string,
    filters?: Record<string, any>,
  ): Promise<ProcessAnalytics | CrossModuleAnalytics> {
    if (entityType) {
      return await processAnalyticsService.getProcessAnalytics(
        entityType,
        filters,
      );
    } else {
      // Get cross-module analytics
      const allProcesses = processRegistry.getAllProcessDefinitions();
      const modules = Array.from(new Set(allProcesses.map((p) => p.module)));
      return await processAnalyticsService.getCrossModuleAnalytics(modules);
    }
  }

  /**
   * Get predictive insights
   */
  async getPredictiveInsights(
    entityId: string,
    entityType: string,
  ): Promise<PredictiveInsight[]> {
    return await processAnalyticsService.generateInsights(entityType, entityId);
  }

  /**
   * Register process definition
   */
  registerProcess(definition: any): void {
    processRegistry.registerProcess(definition);
  }

  /**
   * Get process definition
   */
  getProcessDefinition(entityType: string): any {
    return processRegistry.getProcessDefinition(entityType);
  }

  /**
   * Get all process definitions
   */
  getAllProcessDefinitions(): any[] {
    return processRegistry.getAllProcessDefinitions();
  }

  /**
   * Update analytics asynchronously
   */
  private async updateAnalyticsAsync(entityType: string): Promise<void> {
    // Analytics update happens in background
    setTimeout(async () => {
      try {
        await processAnalyticsService.getProcessAnalytics(entityType);
      } catch (error) {
        console.error("Error updating analytics:", error);
      }
    }, 1000);
  }
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const processOrchestrator: ProcessOrchestratorService =
  new ProcessOrchestratorServiceImpl();

export default processOrchestrator;
