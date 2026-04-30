/**
 * WMS Lifecycle Integration Layer
 * Connects WMS entities to Process & Lifecycle Management system
 */

import { lifecycleService } from "../lifecycle/lifecycleService";
import { processOrchestrator } from "../core/processOrchestrator";
import { eventBus } from "@/lib/services/event-store";
import type { EntityType } from "@/types/lifecycle";

// ============================================================================
// TYPES
// ============================================================================

export interface WmsEntityLifecycleEvent {
  entityId: string;
  entityType: EntityType;
  action: "created" | "updated" | "stage_transitioned" | "completed";
  data?: Record<string, any>;
  userId?: string;
  timestamp?: Date | string;
}

// ============================================================================
// INTEGRATION SERVICE
// ============================================================================

export class WmsLifecycleIntegration {
  /**
   * Initialize lifecycle for a WMS entity when it's created
   */
  async initializeEntityLifecycle(
    entityId: string,
    entityType: EntityType,
    initialData?: Record<string, any>,
  ): Promise<void> {
    try {
      // Initialize lifecycle
      await lifecycleService.initializeLifecycle(
        entityId,
        entityType,
        initialData,
      );

      // Publish event
      await eventBus.publish({
        id: `wms-lifecycle-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "wms.lifecycle.initialized",
        aggregateId: entityId,
        aggregateType: entityType,
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          entityId,
          entityType,
          initialData,
        },
      });
    } catch (error) {
      console.error(
        `Error initializing lifecycle for ${entityType} ${entityId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Transition entity to next stage
   */
  async transitionEntityStage(
    entityId: string,
    entityType: EntityType,
    toStageId: string,
    context?: Record<string, any>,
  ): Promise<void> {
    try {
      // Transition stage
      await lifecycleService.transitionStage(
        entityId,
        entityType,
        toStageId,
        context,
      );

      // Orchestrate process (triggers workflows, process mining, analytics)
      await processOrchestrator.orchestrateProcess(
        {
          entityId,
          entityType,
          currentStage: toStageId,
        },
        "stage_transition",
        context,
      );

      // Publish event
      await eventBus.publish({
        id: `wms-lifecycle-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "wms.lifecycle.stage_transitioned",
        aggregateId: entityId,
        aggregateType: entityType,
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          entityId,
          entityType,
          toStageId,
          context,
        },
      });
    } catch (error) {
      console.error(
        `Error transitioning ${entityType} ${entityId} to ${toStageId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get current lifecycle status
   */
  async getEntityLifecycleStatus(entityId: string, entityType: EntityType) {
    try {
      const lifecycle = await lifecycleService.getLifecycle(
        entityId,
        entityType,
      );
      if (!lifecycle) {
        return null;
      }

      return {
        entityId,
        entityType,
        currentStage: lifecycle.currentStage,
        currentStageId: lifecycle.currentStageId,
        status: lifecycle.status,
        progress: lifecycle.progress,
        startedAt: lifecycle.startedAt,
        updatedAt: lifecycle.updatedAt,
        completedAt: lifecycle.completedAt,
      };
    } catch (error) {
      console.error(
        `Error getting lifecycle status for ${entityType} ${entityId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Subscribe to lifecycle updates for a specific entity
   */
  subscribeToEntityLifecycle(
    entityId: string,
    entityType: EntityType,
    callback: (update: any) => void,
  ) {
    return lifecycleService.subscribe(entityId, entityType, callback);
  }

  /**
   * Get lifecycle analytics for WMS entities
   * Integrated with warehouse filtering and reporting
   */
  async getWmsLifecycleAnalytics(
    entityType?: EntityType,
    filters?: Record<string, any>,
  ) {
    try {
      if (entityType) {
        const analytics = await lifecycleService.getStageAnalytics(
          entityType,
          undefined,
          filters,
        );
        return Array.isArray(analytics)
          ? analytics
          : [analytics].filter(Boolean);
      }

      // Get analytics for all WMS entity types
      const wmsEntityTypes: EntityType[] = [
        "ASN",
        "TASK",
        "PICKING",
        "PUTAWAY",
        "CYCLE_COUNT",
        "GOODS_RECEIPT",
        "WAVE",
      ];

      const allAnalytics = await Promise.all(
        wmsEntityTypes.map(async (type) => {
          try {
            const analytics = await lifecycleService.getStageAnalytics(
              type,
              undefined,
              filters,
            );
            return Array.isArray(analytics)
              ? analytics
              : [analytics].filter(Boolean);
          } catch (error) {
            console.debug(`No analytics for ${type}:`, error);
            return [];
          }
        }),
      );

      return allAnalytics.flat().filter(Boolean);
    } catch (error) {
      console.error("Error getting WMS lifecycle analytics:", error);
      return [];
    }
  }
}

export const wmsLifecycleIntegration = new WmsLifecycleIntegration();

// ============================================================================
// EVENT SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to WMS entity events and automatically manage lifecycles
 */
export function setupWmsEventSubscriptions(): void {
  // Subscribe to ASN events
  eventBus.subscribe("asn.created", async (event) => {
    await wmsLifecycleIntegration.initializeEntityLifecycle(
      event.aggregateId,
      "ASN",
      event.payload,
    );
  });

  eventBus.subscribe("asn.status_changed", async (event) => {
    const { status, previousStatus } = event.payload;

    // Map status to stage
    const statusToStageMap: Record<string, string> = {
      VALIDATED: "ASN_VALIDATED",
      SCHEDULED: "RECEIVING_SCHEDULED",
      IN_TRANSIT: "IN_TRANSIT",
      ARRIVED: "ARRIVED_AT_DOCK",
      RECEIVING: "RECEIVING_IN_PROGRESS",
      RECEIVED: "RECEIVING_COMPLETED",
      PUTAWAY: "PUTAWAY_REQUIRED",
      PUTAWAY_IN_PROGRESS: "PUTAWAY_IN_PROGRESS",
      PUTAWAY_COMPLETED: "PUTAWAY_COMPLETED",
      COMPLETED: "ASN_COMPLETED",
    };

    const stageId = statusToStageMap[status];
    if (stageId) {
      await wmsLifecycleIntegration.transitionEntityStage(
        event.aggregateId,
        "ASN",
        stageId,
        { previousStatus, ...event.payload },
      );
    }
  });

  // Subscribe to Task events
  eventBus.subscribe("task.created", async (event) => {
    await wmsLifecycleIntegration.initializeEntityLifecycle(
      event.aggregateId,
      "TASK",
      event.payload,
    );
  });

  eventBus.subscribe("task.status_changed", async (event) => {
    const { status } = event.payload;
    const statusToStageMap: Record<string, string> = {
      ASSIGNED: "TASK_ASSIGNED",
      STARTED: "TASK_STARTED",
      IN_PROGRESS: "TASK_IN_PROGRESS",
      COMPLETED: "TASK_COMPLETED",
      VERIFIED: "TASK_VERIFIED",
      CLOSED: "TASK_CLOSED",
    };

    const stageId = statusToStageMap[status];
    if (stageId) {
      await wmsLifecycleIntegration.transitionEntityStage(
        event.aggregateId,
        "TASK",
        stageId,
        event.payload,
      );
    }
  });

  // Subscribe to Picking events
  eventBus.subscribe("picking.released", async (event) => {
    await wmsLifecycleIntegration.initializeEntityLifecycle(
      event.aggregateId,
      "PICKING",
      event.payload,
    );
  });

  eventBus.subscribe("picking.status_changed", async (event) => {
    const { status } = event.payload;
    const statusToStageMap: Record<string, string> = {
      ASSIGNED: "PICK_ASSIGNED",
      STARTED: "PICKING_STARTED",
      IN_PROGRESS: "PICKING_IN_PROGRESS",
      COMPLETED: "PICKING_COMPLETED",
      VERIFIED: "PICK_VERIFIED",
      READY_FOR_PACKING: "READY_FOR_PACKING",
    };

    const stageId = statusToStageMap[status];
    if (stageId) {
      await wmsLifecycleIntegration.transitionEntityStage(
        event.aggregateId,
        "PICKING",
        stageId,
        event.payload,
      );
    }
  });

  // Subscribe to Putaway events
  eventBus.subscribe("putaway.created", async (event) => {
    await wmsLifecycleIntegration.initializeEntityLifecycle(
      event.aggregateId,
      "PUTAWAY",
      event.payload,
    );
  });

  eventBus.subscribe("putaway.status_changed", async (event) => {
    const { status } = event.payload;
    const statusToStageMap: Record<string, string> = {
      LOCATION_ASSIGNED: "LOCATION_ASSIGNED",
      ASSIGNED: "PUTAWAY_ASSIGNED",
      IN_PROGRESS: "PUTAWAY_IN_PROGRESS",
      COMPLETED: "PUTAWAY_COMPLETED",
      INVENTORY_UPDATED: "INVENTORY_UPDATED",
    };

    const stageId = statusToStageMap[status];
    if (stageId) {
      await wmsLifecycleIntegration.transitionEntityStage(
        event.aggregateId,
        "PUTAWAY",
        stageId,
        event.payload,
      );
    }
  });

  // Subscribe to Cycle Count events
  eventBus.subscribe("cycle_count.planned", async (event) => {
    await wmsLifecycleIntegration.initializeEntityLifecycle(
      event.aggregateId,
      "CYCLE_COUNT",
      event.payload,
    );
  });

  eventBus.subscribe("cycle_count.status_changed", async (event) => {
    const { status } = event.payload;
    const statusToStageMap: Record<string, string> = {
      ASSIGNED: "CYCLE_COUNT_ASSIGNED",
      COUNTING: "COUNTING_IN_PROGRESS",
      COMPLETED: "COUNTING_COMPLETED",
      RECONCILIATION_REQUIRED: "RECONCILIATION_REQUIRED",
      RECONCILIATION_COMPLETED: "RECONCILIATION_COMPLETED",
      INVENTORY_ADJUSTED: "INVENTORY_ADJUSTED",
      CLOSED: "CYCLE_COUNT_CLOSED",
    };

    const stageId = statusToStageMap[status];
    if (stageId) {
      await wmsLifecycleIntegration.transitionEntityStage(
        event.aggregateId,
        "CYCLE_COUNT",
        stageId,
        event.payload,
      );
    }
  });

  // Subscribe to Goods Receipt events
  eventBus.subscribe("goods_receipt.created", async (event) => {
    await wmsLifecycleIntegration.initializeEntityLifecycle(
      event.aggregateId,
      "GOODS_RECEIPT",
      event.payload,
    );
  });

  eventBus.subscribe("goods_receipt.status_changed", async (event) => {
    const { status } = event.payload;
    const statusToStageMap: Record<string, string> = {
      DOCK_ASSIGNED: "DOCK_ASSIGNED",
      RECEIVING_STARTED: "RECEIVING_STARTED",
      RECEIVING: "RECEIVING_IN_PROGRESS",
      RECEIVED: "RECEIVING_COMPLETED",
      POSTED: "GR_POSTED",
    };

    const stageId = statusToStageMap[status];
    if (stageId) {
      await wmsLifecycleIntegration.transitionEntityStage(
        event.aggregateId,
        "GOODS_RECEIPT",
        stageId,
        event.payload,
      );
    }
  });

  // Subscribe to Wave Planning events
  eventBus.subscribe("wave.created", async (event) => {
    await wmsLifecycleIntegration.initializeEntityLifecycle(
      event.aggregateId,
      "WAVE",
      event.payload,
    );
  });

  eventBus.subscribe("wave.status_changed", async (event) => {
    const { status } = event.payload;
    const statusToStageMap: Record<string, string> = {
      PLANNED: "WAVE_PLANNED",
      APPROVED: "WAVE_APPROVED",
      PICK_TASKS_CREATED: "PICK_TASKS_CREATED",
      RELEASED: "WAVE_RELEASED",
      COMPLETED: "WAVE_COMPLETED",
    };

    const stageId = statusToStageMap[status];
    if (stageId) {
      await wmsLifecycleIntegration.transitionEntityStage(
        event.aggregateId,
        "WAVE",
        stageId,
        event.payload,
      );
    }
  });
}

// Auto-setup subscriptions when module loads (both client and server)
// Server-side subscriptions are needed for API routes and background processing
setupWmsEventSubscriptions();
