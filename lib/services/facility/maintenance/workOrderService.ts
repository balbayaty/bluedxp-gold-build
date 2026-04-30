/**
 * Work Order Management Service
 *
 * Single canonical implementation (deduplicated).
 * Used by Facility APIs and Facility Analytics service.
 */

import type {
  WorkOrder,
  WorkOrderApproval,
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderType,
} from "@/types/facility";
import { eventBus } from "@/lib/services/event-store";

export interface WorkOrderServiceConfig {
  enableApprovalWorkflow?: boolean;
  defaultPriority?: WorkOrderPriority;
  autoAssignTechnicians?: boolean;
  enableMobileAccess?: boolean;
}

export class WorkOrderService {
  private config: Required<WorkOrderServiceConfig>;
  private workOrders: Map<string, WorkOrder> = new Map();

  constructor(config: WorkOrderServiceConfig = {}) {
    this.config = {
      enableApprovalWorkflow: config.enableApprovalWorkflow ?? true,
      defaultPriority:
        config.defaultPriority ?? ("medium" as WorkOrderPriority),
      autoAssignTechnicians: config.autoAssignTechnicians ?? false,
      enableMobileAccess: config.enableMobileAccess ?? true,
    };
  }

  async getWorkOrders(
    facilityId: string,
    filters?: {
      type?: WorkOrderType;
      status?: WorkOrderStatus;
      priority?: WorkOrderPriority;
      assignedTo?: string;
    },
  ): Promise<WorkOrder[]> {
    let orders = Array.from(this.workOrders.values()).filter(
      (wo) => wo.facilityId === facilityId,
    );
    if (filters?.type) orders = orders.filter((wo) => wo.type === filters.type);
    if (filters?.status)
      orders = orders.filter((wo) => wo.status === filters.status);
    if (filters?.priority)
      orders = orders.filter((wo) => wo.priority === filters.priority);
    if (filters?.assignedTo)
      orders = orders.filter((wo) => wo.assignedTo === filters.assignedTo);

    const priorityOrder: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return orders.sort((a, b) => {
      const p =
        (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (p !== 0) return p;
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return da - db;
    });
  }

  async getWorkOrder(workOrderId: string): Promise<WorkOrder | null> {
    return this.workOrders.get(workOrderId) || null;
  }

  async createWorkOrder(
    workOrder: Omit<WorkOrder, "id" | "createdAt" | "updatedAt">,
  ): Promise<WorkOrder> {
    const newWorkOrder: WorkOrder = {
      ...workOrder,
      id: `wo-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      status: "requested" as WorkOrderStatus,
      priority: workOrder.priority || this.config.defaultPriority,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (this.config.enableApprovalWorkflow && !newWorkOrder.approvalWorkflow) {
      newWorkOrder.approvalWorkflow = [] as WorkOrderApproval[];
    }

    this.workOrders.set(newWorkOrder.id, newWorkOrder);

    await eventBus.publish({
      id: `event-${Date.now()}`,
      type: "facility.work-order.created",
      aggregateId: newWorkOrder.id,
      aggregateType: "WorkOrder",
      version: 1,
      timestamp: new Date(),
      data: {
        workOrderId: newWorkOrder.id,
        facilityId: newWorkOrder.facilityId,
        type: newWorkOrder.type,
        priority: newWorkOrder.priority,
      },
      metadata: {},
    });

    return newWorkOrder;
  }

  async updateWorkOrder(
    workOrderId: string,
    updates: Partial<WorkOrder>,
  ): Promise<WorkOrder> {
    const existing = this.workOrders.get(workOrderId);
    if (!existing) throw new Error(`Work order ${workOrderId} not found`);

    const updated: WorkOrder = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.workOrders.set(workOrderId, updated);

    await eventBus.publish({
      id: `event-${Date.now()}`,
      type: "facility.work-order.updated",
      aggregateId: workOrderId,
      aggregateType: "WorkOrder",
      version: 1,
      timestamp: new Date(),
      data: {
        workOrderId,
        facilityId: updated.facilityId,
        status: updated.status,
        priority: updated.priority,
      },
      metadata: {},
    });

    return updated;
  }

  /**
   * Get work order analytics
   */
  async getWorkOrderAnalytics(facilityId: string): Promise<{
    totalWorkOrders: number;
    byStatus: Record<WorkOrderStatus, number>;
    byType: Record<WorkOrderType, number>;
    byPriority: Record<WorkOrderPriority, number>;
    completed: number;
    overdue: number;
    averageResponseTime: number; // minutes
    totalCost: number;
    averageCost: number;
  }> {
    const orders = await this.getWorkOrders(facilityId);

    const analytics = {
      totalWorkOrders: orders.length,
      byStatus: {} as Record<WorkOrderStatus, number>,
      byType: {} as Record<WorkOrderType, number>,
      byPriority: {} as Record<WorkOrderPriority, number>,
      completed: 0,
      overdue: 0,
      averageResponseTime: 0,
      totalCost: 0,
      averageCost: 0,
    };

    const now = new Date();
    let totalResponseTime = 0;
    let ordersWithResponseTime = 0;
    let totalCost = 0;
    let ordersWithCost = 0;

    for (const order of orders) {
      // Count by status
      analytics.byStatus[order.status] =
        (analytics.byStatus[order.status] || 0) + 1;

      // Count by type
      analytics.byType[order.type] = (analytics.byType[order.type] || 0) + 1;

      // Count by priority
      analytics.byPriority[order.priority] =
        (analytics.byPriority[order.priority] || 0) + 1;

      // Count completed
      if (order.status === "completed") {
        analytics.completed++;
      }

      // Count overdue
      if (
        order.dueDate &&
        new Date(order.dueDate) < now &&
        order.status !== "completed" &&
        order.status !== "cancelled"
      ) {
        analytics.overdue++;
      }

      // Calculate response time (from requested to assigned/started)
      if (order.requestedDate && order.assignedDate) {
        const responseTime =
          (new Date(order.assignedDate).getTime() -
            new Date(order.requestedDate).getTime()) /
          (1000 * 60); // minutes
        totalResponseTime += responseTime;
        ordersWithResponseTime++;
      }

      // Sum costs
      if (order.cost) {
        totalCost += order.cost;
        ordersWithCost++;
      }
    }

    analytics.averageResponseTime =
      ordersWithResponseTime > 0
        ? totalResponseTime / ordersWithResponseTime
        : 0;
    analytics.totalCost = totalCost;
    analytics.averageCost = ordersWithCost > 0 ? totalCost / ordersWithCost : 0;

    return analytics;
  }
}

let workOrderServiceInstance: WorkOrderService | null = null;

export function getWorkOrderService(
  config?: WorkOrderServiceConfig,
): WorkOrderService {
  if (!workOrderServiceInstance) {
    workOrderServiceInstance = new WorkOrderService(config);
  }
  return workOrderServiceInstance;
}
