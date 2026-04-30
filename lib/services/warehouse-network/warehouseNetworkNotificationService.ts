/**
 * Warehouse Network Notification Service
 * Handles all notifications for warehouse network activities
 */

import { notificationService } from "@/lib/services/notifications/notificationService";
import type { NotificationPriority } from "@/lib/services/notifications/notificationService";
import type {
  NetworkInventoryTransfer,
  WarehouseNetwork,
} from "./warehouseNetworkService";

/**
 * Send notification when transfer status changes
 */
export async function notifyTransferStatusChange(
  transfer: NetworkInventoryTransfer,
  oldStatus: string,
  newStatus: string,
): Promise<void> {
  const statusMessages: Record<
    string,
    { title: string; message: string; priority: NotificationPriority }
  > = {
    IN_TRANSIT: {
      title: "Transfer In Transit",
      message: `Transfer ${transfer.transferNumber} is now in transit.`,
      priority: "medium",
    },
    DELIVERED: {
      title: "Transfer Delivered",
      message: `Transfer ${transfer.transferNumber} has been delivered successfully.`,
      priority: "high",
    },
    CANCELLED: {
      title: "Transfer Cancelled",
      message: `Transfer ${transfer.transferNumber} has been cancelled.`,
      priority: "medium",
    },
  };

  const statusInfo = statusMessages[newStatus];
  if (statusInfo) {
    await notificationService.send({
      type: newStatus === "CANCELLED" ? "warning" : "success",
      priority: statusInfo.priority,
      channel: ["in-app", "email"],
      title: statusInfo.title,
      message: statusInfo.message,
      data: {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        oldStatus,
        newStatus,
        actionUrl: `/warehouse-network/transfers/${transfer.id}`,
      },
    });
  }
}

/**
 * Send notification for low capacity
 */
export async function notifyLowCapacity(
  networkId: string,
  warehouseId: string,
  utilization: number,
): Promise<void> {
  await notificationService.send({
    type: "warning",
    priority: "high",
    channel: ["in-app", "email"],
    title: "High Capacity Utilization Alert",
    message: `Warehouse ${warehouseId} in network is at ${(utilization * 100).toFixed(1)}% capacity. Consider redistributing inventory.`,
    data: {
      networkId,
      warehouseId,
      utilization,
      actionUrl: `/warehouse-network/networks/${networkId}`,
    },
  });
}

/**
 * Send notification for route optimization suggestions
 */
export async function notifyRouteOptimization(
  networkId: string,
  suggestions: Array<{ routeId: string; savings: number; description: string }>,
): Promise<void> {
  await notificationService.send({
    type: "info",
    priority: "medium",
    channel: ["in-app"],
    title: "Route Optimization Suggestions",
    message: `We found ${suggestions.length} route optimization opportunities that could save up to ${Math.max(...suggestions.map((s) => s.savings))} SAR.`,
    data: {
      networkId,
      suggestions,
      actionUrl: `/warehouse-network/routes?networkId=${networkId}&tab=optimization`,
    },
  });
}

/**
 * Warehouse Network Notification Service Export
 */
export const warehouseNetworkNotificationService = {
  notifyTransferStatusChange,
  notifyLowCapacity,
  notifyRouteOptimization,
};
