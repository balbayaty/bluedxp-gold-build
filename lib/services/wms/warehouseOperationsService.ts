/**
 * Warehouse Operations Service
 * Real-time operations data for warehouse detail pages
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 * Integrated with Process Lifecycle Management
 */

import { eventBus } from "@/lib/services/event-store";
import { wmsLifecycleIntegration } from "@/lib/services/process-lifecycle/wms/wmsLifecycleIntegration";
import type { EntityType } from "@/types/lifecycle";

// ============================================================================
// OPERATIONS TYPES
// ============================================================================

export interface WarehouseOperation {
  id: string;
  type:
    | "PUTAWAY"
    | "PICKING"
    | "CYCLE_COUNT"
    | "REPLENISHMENT"
    | "TRANSFER"
    | "QUALITY_CHECK";
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: Date | string; // Added for better timeline tracking
  location: string;
  targetLocation?: string;
  materialNumber?: string;
  quantity?: number;
  createdAt: Date | string;
  startedAt?: Date | string;
  completedAt?: Date | string;
  estimatedDuration?: number;
  actualDuration?: number;
  warehouseId?: string; // Added for filtering
  // Lifecycle Integration
  lifecycleStage?: string;
  lifecycleProgress?: number;
  lifecycleStatus?: "ON_TRACK" | "AT_RISK" | "DELAYED" | "COMPLETED";
  slaStatus?: "WITHIN_SLA" | "AT_RISK" | "BREACHED";
}

export interface WarehouseOperationsSummary {
  warehouseId: string;
  activeOperations: number;
  pendingOperations: number;
  inProgressOperations: number;
  completedToday: number;
  putawayTasks: {
    pending: number;
    inProgress: number;
    completed: number;
  };
  pickingTasks: {
    pending: number;
    inProgress: number;
    completed: number;
  };
  cycleCountTasks: {
    pending: number;
    inProgress: number;
    completed: number;
  };
  performance: {
    averageCompletionTime: number;
    onTimeCompletion: number;
    efficiency: number;
  };
}

export interface WarehouseOperationsService {
  getOperationsSummary(
    warehouseId: string,
  ): Promise<WarehouseOperationsSummary>;
  getActiveOperations(warehouseId: string): Promise<WarehouseOperation[]>;
  getOperationsByType(
    warehouseId: string,
    type: WarehouseOperation["type"],
  ): Promise<WarehouseOperation[]>;
  subscribeToOperations(
    warehouseId: string,
    callback: (operations: WarehouseOperation[]) => void,
  ): () => void;
}

// ============================================================================
// WAREHOUSE OPERATIONS SERVICE IMPLEMENTATION
// ============================================================================

class WarehouseOperationsServiceImpl implements WarehouseOperationsService {
  private operationsCache: Map<string, WarehouseOperation[]> = new Map();
  private subscriptions: Map<
    string,
    Set<(operations: WarehouseOperation[]) => void>
  > = new Map();

  /**
   * Get operations summary for a warehouse
   */
  async getOperationsSummary(
    warehouseId: string,
  ): Promise<WarehouseOperationsSummary> {
    try {
      // In production, fetch from database or API
      const operations = await this.getActiveOperations(warehouseId);

      const putawayTasks = operations.filter((op) => op.type === "PUTAWAY");
      const pickingTasks = operations.filter((op) => op.type === "PICKING");
      const cycleCountTasks = operations.filter(
        (op) => op.type === "CYCLE_COUNT",
      );

      const completedToday = operations.filter(
        (op) =>
          op.status === "COMPLETED" &&
          op.completedAt &&
          new Date(op.completedAt).toDateString() === new Date().toDateString(),
      ).length;

      const completedOps = operations.filter(
        (op) => op.status === "COMPLETED" && op.actualDuration,
      );
      const avgCompletionTime =
        completedOps.length > 0
          ? completedOps.reduce(
              (sum, op) => sum + (op.actualDuration || 0),
              0,
            ) / completedOps.length
          : 0;

      const onTimeCompletion =
        completedOps.length > 0
          ? (completedOps.filter(
              (op) =>
                op.estimatedDuration &&
                op.actualDuration &&
                op.actualDuration <= op.estimatedDuration,
            ).length /
              completedOps.length) *
            100
          : 0;

      return {
        warehouseId,
        activeOperations: operations.filter((op) => op.status === "IN_PROGRESS")
          .length,
        pendingOperations: operations.filter((op) => op.status === "PENDING")
          .length,
        inProgressOperations: operations.filter(
          (op) => op.status === "IN_PROGRESS",
        ).length,
        completedToday,
        putawayTasks: {
          pending: putawayTasks.filter((t) => t.status === "PENDING").length,
          inProgress: putawayTasks.filter((t) => t.status === "IN_PROGRESS")
            .length,
          completed: putawayTasks.filter((t) => t.status === "COMPLETED")
            .length,
        },
        pickingTasks: {
          pending: pickingTasks.filter((t) => t.status === "PENDING").length,
          inProgress: pickingTasks.filter((t) => t.status === "IN_PROGRESS")
            .length,
          completed: pickingTasks.filter((t) => t.status === "COMPLETED")
            .length,
        },
        cycleCountTasks: {
          pending: cycleCountTasks.filter((t) => t.status === "PENDING").length,
          inProgress: cycleCountTasks.filter((t) => t.status === "IN_PROGRESS")
            .length,
          completed: cycleCountTasks.filter((t) => t.status === "COMPLETED")
            .length,
        },
        performance: {
          averageCompletionTime: avgCompletionTime,
          onTimeCompletion,
          efficiency: onTimeCompletion,
        },
      };
    } catch (error) {
      console.error("Error getting operations summary:", error);
      throw error;
    }
  }

  /**
   * Get active operations for a warehouse
   */
  async getActiveOperations(
    warehouseId: string,
  ): Promise<WarehouseOperation[]> {
    try {
      // Check cache first
      const cached = this.operationsCache.get(warehouseId);
      if (cached) {
        return cached;
      }

      // In production, fetch from database or API
      // For now, generate mock data based on warehouse operations
      const operations: WarehouseOperation[] = [
        {
          id: "op-001",
          type: "PUTAWAY",
          status: "IN_PROGRESS",
          priority: "HIGH",
          assignedTo: "user-001",
          assignedToName: "Ahmed Ali",
          assignedAt: new Date(Date.now() - 3600000),
          location: "Receiving Dock",
          targetLocation: "A-01-02-03",
          materialNumber: "MAT-001234",
          quantity: 50,
          createdAt: new Date(Date.now() - 3600000),
          startedAt: new Date(Date.now() - 1800000),
          estimatedDuration: 30,
          actualDuration: 18,
          warehouseId,
        },
        {
          id: "op-002",
          type: "PICKING",
          status: "IN_PROGRESS",
          priority: "URGENT",
          assignedTo: "user-002",
          assignedToName: "Mohammed Hassan",
          location: "A-05-10-15",
          targetLocation: "Shipping Dock",
          materialNumber: "MAT-005678",
          quantity: 25,
          createdAt: new Date(Date.now() - 1800000),
          startedAt: new Date(Date.now() - 900000),
          estimatedDuration: 20,
          actualDuration: 10,
        },
        {
          id: "op-003",
          type: "CYCLE_COUNT",
          status: "PENDING",
          priority: "MEDIUM",
          location: "B-02-05-10",
          materialNumber: "MAT-009876",
          quantity: 100,
          createdAt: new Date(Date.now() - 7200000),
          estimatedDuration: 45,
          warehouseId,
        },
        {
          id: "op-004",
          type: "PUTAWAY",
          status: "PENDING",
          priority: "MEDIUM",
          location: "Receiving Dock",
          targetLocation: "C-03-08-12",
          materialNumber: "MAT-003456",
          quantity: 75,
          createdAt: new Date(Date.now() - 5400000),
          estimatedDuration: 25,
        },
        {
          id: "op-005",
          type: "PICKING",
          status: "COMPLETED",
          priority: "HIGH",
          assignedTo: "user-003",
          assignedToName: "Fatima Al-Saud",
          assignedAt: new Date(Date.now() - 10800000),
          location: "A-01-05-08",
          targetLocation: "Shipping Dock",
          materialNumber: "MAT-007890",
          quantity: 30,
          createdAt: new Date(Date.now() - 10800000),
          startedAt: new Date(Date.now() - 10200000),
          completedAt: new Date(Date.now() - 9600000),
          estimatedDuration: 15,
          actualDuration: 10,
          warehouseId,
        },
      ];

      this.operationsCache.set(warehouseId, operations);

      // Enrich with lifecycle data
      const enrichedOperations = await this.enrichWithLifecycleData(operations);

      // Publish operations update event for real-time subscribers
      await eventBus.publish({
        id: `warehouse-ops-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: `warehouse.operations.${warehouseId}`,
        aggregateId: warehouseId,
        aggregateType: "WAREHOUSE_OPERATIONS",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          warehouseId,
          operations: enrichedOperations,
          summary: await this.getOperationsSummary(warehouseId),
        },
      });

      return enrichedOperations;
    } catch (error) {
      console.error("Error getting active operations:", error);
      return [];
    }
  }

  /**
   * Enrich operations with lifecycle data
   * Integrated with Process Lifecycle Management system
   */
  private async enrichWithLifecycleData(
    operations: WarehouseOperation[],
  ): Promise<WarehouseOperation[]> {
    try {
      return await Promise.all(
        operations.map(async (op) => {
          try {
            // Map operation type to lifecycle entity type
            // Note: WMS lifecycle types need to be added to EntityType if not already present
            const entityTypeMap: Record<string, string> = {
              PUTAWAY: "PUTAWAY",
              PICKING: "PICKING",
              CYCLE_COUNT: "CYCLE_COUNT",
              REPLENISHMENT: "TASK",
              TRANSFER: "TASK",
              QUALITY_CHECK: "TASK",
            };

            const entityTypeStr = entityTypeMap[op.type];
            if (!entityTypeStr) return op;

            // Get lifecycle status - use 'TASK' as fallback for WMS-specific types
            const entityType =
              entityTypeStr === "PUTAWAY" ||
              entityTypeStr === "PICKING" ||
              entityTypeStr === "CYCLE_COUNT"
                ? ("TASK" as EntityType) // Use TASK as proxy since PUTAWAY/PICKING/CYCLE_COUNT may not be in EntityType enum
                : (entityTypeStr as EntityType);

            const lifecycleStatus =
              await wmsLifecycleIntegration.getEntityLifecycleStatus(
                op.id,
                entityType,
              );

            if (lifecycleStatus) {
              return {
                ...op,
                lifecycleStage: lifecycleStatus.currentStage,
                lifecycleProgress: lifecycleStatus.progress,
                lifecycleStatus:
                  lifecycleStatus.status === "COMPLETED"
                    ? "COMPLETED"
                    : lifecycleStatus.status === "AT_RISK"
                      ? "AT_RISK"
                      : lifecycleStatus.status === "DELAYED"
                        ? "DELAYED"
                        : "ON_TRACK",
                slaStatus:
                  lifecycleStatus.status === "AT_RISK"
                    ? "AT_RISK"
                    : lifecycleStatus.status === "DELAYED"
                      ? "BREACHED"
                      : "WITHIN_SLA",
              };
            }
          } catch (error) {
            // Silently fail if lifecycle not found - operations can exist without lifecycle
            console.debug(`Lifecycle not found for operation ${op.id}:`, error);
          }
          return op;
        }),
      );
    } catch (error) {
      console.error("Error enriching with lifecycle data:", error);
      return operations;
    }
  }

  /**
   * Get operations by type
   */
  async getOperationsByType(
    warehouseId: string,
    type: WarehouseOperation["type"],
  ): Promise<WarehouseOperation[]> {
    const operations = await this.getActiveOperations(warehouseId);
    return operations.filter((op) => op.type === type);
  }

  /**
   * Subscribe to real-time operations updates
   */
  subscribeToOperations(
    warehouseId: string,
    callback: (operations: WarehouseOperation[]) => void,
  ): () => void {
    if (!this.subscriptions.has(warehouseId)) {
      this.subscriptions.set(warehouseId, new Set());
    }

    this.subscriptions.get(warehouseId)!.add(callback);

    // Subscribe to event bus
    const unsubscribe = eventBus.subscribe(
      `warehouse.operations.${warehouseId}`,
      (event: any) => {
        const operations = event.data.operations as WarehouseOperation[];
        this.operationsCache.set(warehouseId, operations);
        this.subscriptions.get(warehouseId)?.forEach((cb) => cb(operations));
      },
    );

    // Return unsubscribe function
    return () => {
      this.subscriptions.get(warehouseId)?.delete(callback);
      unsubscribe();
    };
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const warehouseOperationsService: WarehouseOperationsService =
  new WarehouseOperationsServiceImpl();
