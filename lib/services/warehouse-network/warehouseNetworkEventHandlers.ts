/**
 * Warehouse Network Event Handlers
 * Subscribes to events and reacts accordingly
 * Integrates with WMS, TMS, and other modules
 */

import { eventBus } from "@/lib/services/event-store";
import { warehouseNetworkService } from "./warehouseNetworkService";
import { warehouseNetworkNotificationService } from "./warehouseNetworkNotificationService";
import type { DomainEvent } from "@/types/cqrs";

/**
 * Initialize warehouse network event handlers
 */
export function initializeWarehouseNetworkEventHandlers() {
  // ============================================================================
  // SUBSCRIBE TO EXTERNAL EVENTS
  // ============================================================================

  // WMS Events - Update network when warehouse inventory changes
  eventBus.subscribe("wms.inventory.updated", async (event: DomainEvent) => {
    try {
      const { warehouseId, skuId, quantity, action } = event.payload || {};

      // Find networks containing this warehouse
      const networks = await warehouseNetworkService.getAllNetworks();
      const relevantNetworks = networks.filter((network) =>
        network.warehouses.some((w) => w.warehouseId === warehouseId),
      );

      // Update network metrics
      for (const network of relevantNetworks) {
        const analytics = await warehouseNetworkService.getNetworkAnalytics(
          network.id,
        );

        // Publish network update event
        await eventBus.publish({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "warehouse-network.inventory.updated",
          aggregateId: network.id,
          aggregateType: "WAREHOUSE_NETWORK",
          version: 1,
          timestamp: new Date().toISOString(),
          payload: {
            networkId: network.id,
            warehouseId,
            skuId,
            quantity,
            action,
            analytics,
          },
        });
      }
    } catch (error) {
      console.error("Error handling WMS inventory update:", error);
    }
  });

  // TMS Events - Update routes when transportation availability changes
  eventBus.subscribe(
    "tms.route.availability.updated",
    async (event: DomainEvent) => {
      try {
        const { routeId, origin, destination, available } = event.payload || {};

        // Find network routes matching this TMS route
        const networks = await warehouseNetworkService.getAllNetworks();

        for (const network of networks) {
          const routes = await warehouseNetworkService.getNetworkRoutes(
            network.id,
          );
          const matchingRoutes = routes.filter(
            (route) =>
              route.originWarehouseId === origin?.warehouseId &&
              route.destinationWarehouseId === destination?.warehouseId,
          );

          // Update route status
          for (const route of matchingRoutes) {
            // Route status would be updated in the service
            await eventBus.publish({
              id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              type: "warehouse-network.route.availability.updated",
              aggregateId: route.id,
              aggregateType: "NETWORK_ROUTE",
              version: 1,
              timestamp: new Date().toISOString(),
              payload: {
                routeId: route.id,
                networkId: network.id,
                available,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error handling TMS route availability update:", error);
      }
    },
  );

  // ============================================================================
  // WAREHOUSE NETWORK EVENT REACTIONS
  // ============================================================================

  // When transfer is created, trigger WMS inventory movement
  eventBus.subscribe(
    "warehouse-network.transfer.created",
    async (event: DomainEvent) => {
      try {
        const {
          transferId,
          originWarehouseId,
          destinationWarehouseId,
          materialId,
          quantity,
        } = event.payload || {};

        // Trigger WMS inventory transfer
        await eventBus.publish({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "wms.inventory.transfer.requested",
          aggregateId: transferId,
          aggregateType: "INVENTORY_TRANSFER",
          version: 1,
          timestamp: new Date().toISOString(),
          payload: {
            transferId,
            originWarehouseId,
            destinationWarehouseId,
            materialId,
            quantity,
            source: "warehouse-network",
          },
        });

        // Trigger TMS shipment if needed
        const transfer = await warehouseNetworkService.getTransfer(transferId);
        if (transfer && transfer.carrierId) {
          await eventBus.publish({
            id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type: "tms.shipment.creation.requested",
            aggregateId: transferId,
            aggregateType: "INVENTORY_TRANSFER",
            version: 1,
            timestamp: new Date().toISOString(),
            payload: {
              transferId,
              carrierId: transfer.carrierId,
              origin: { warehouseId: originWarehouseId },
              destination: { warehouseId: destinationWarehouseId },
              quantity,
            },
          });
        }
      } catch (error) {
        console.error("Error handling transfer creation:", error);
      }
    },
  );

  // When transfer status changes, notify relevant parties
  eventBus.subscribe(
    "warehouse-network.transfer.status.updated",
    async (event: DomainEvent) => {
      try {
        const { transferId, oldStatus, newStatus } = event.payload || {};
        const transfer = await warehouseNetworkService.getTransfer(transferId);

        if (transfer) {
          await warehouseNetworkNotificationService.notifyTransferStatusChange(
            transfer,
            oldStatus,
            newStatus,
          );
        }
      } catch (error) {
        console.error("Error handling transfer status update:", error);
      }
    },
  );

  // When network capacity is low, send alerts
  eventBus.subscribe(
    "warehouse-network.capacity.low",
    async (event: DomainEvent) => {
      try {
        const { networkId, warehouseId, utilization } = event.payload || {};
        const network = await warehouseNetworkService.getNetwork(networkId);

        if (network && utilization && utilization > 0.9) {
          await warehouseNetworkNotificationService.notifyLowCapacity(
            networkId,
            warehouseId,
            utilization,
          );
        }
      } catch (error) {
        console.error("Error handling low capacity alert:", error);
      }
    },
  );

  console.log("✅ Warehouse Network event handlers initialized");
}

/**
 * Publish warehouse network events
 */
export async function publishWarehouseNetworkEvent(
  type: string,
  aggregateId: string,
  aggregateType: string,
  payload: any,
) {
  await eventBus.publish({
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type: `warehouse-network.${type}`,
    aggregateId,
    aggregateType,
    version: 1,
    timestamp: new Date().toISOString(),
    payload,
  });
}
