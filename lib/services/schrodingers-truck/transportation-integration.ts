/**
 * Transportation Module Integration
 *
 * Seamlessly integrates Schrödinger's Truck with existing Transportation services
 * Extends existing services without duplication
 *
 * @module schrodingers-truck
 */

import { schrodingersTruckService } from "./service";
import { eventBus, createEvent } from "@/lib/services/event-store";
import type { Shipment } from "@/types/tms";
import type { DriverInfo, RouteInfo, CargoInfo } from "./types";

/**
 * Initialize quantum state when shipment is created
 * Called automatically by transportation service
 */
export async function initializeQuantumStateForShipment(
  shipment: Shipment,
): Promise<void> {
  try {
    // Extract driver info from shipment
    const driver: DriverInfo | undefined = shipment.roadFreightDetails
      ?.driverName
      ? {
          id: shipment.roadFreightDetails.driverPhone || "",
          name: shipment.roadFreightDetails.driverName,
          phone: shipment.roadFreightDetails.driverPhone,
          license: shipment.roadFreightDetails.driverLicense,
          vehicleId: shipment.roadFreightDetails.truckNumber,
        }
      : undefined;

    // Extract route info
    const route: RouteInfo | undefined = shipment.route
      ? {
          id: shipment.route.id,
          distanceKm: shipment.route.distanceKm || 0,
          estimatedDurationHours: shipment.route.estimatedDurationHours || 0,
          waypoints: shipment.route.waypoints,
          borderCrossings: shipment.route.borderCrossings,
          checkpoints: shipment.route.checkpoints,
        }
      : undefined;

    // Extract cargo info
    const cargo: CargoInfo = {
      type: shipment.items?.[0]?.description,
      temperatureSensitive: shipment.specialHandling?.perishable || false,
      timeSensitive:
        shipment.priority === "URGENT" || shipment.serviceLevel === "SAME_DAY",
      fragile: shipment.specialHandling?.fragile || false,
      hazardous: !!shipment.hazmat,
      perishable: shipment.specialHandling?.perishable || false,
      value: shipment.totalValue,
      specialHandling: shipment.specialHandling?.requirements || [],
    };

    // Initialize quantum state
    await schrodingersTruckService.initializeQuantumState(
      shipment,
      driver,
      route,
      cargo,
    );

    // Publish integration event
    await eventBus.publish(
      createEvent(
        "ShipmentQuantumStateInitialized",
        shipment.id,
        "Shipment",
        { shipmentId: shipment.id },
        1,
        {
          tenantId: shipment.tenantId,
          correlationId: `transport-integration-${Date.now()}`,
          userId: shipment.createdBy || "system",
        },
      ),
    );
  } catch (error) {
    console.error("Error initializing quantum state for shipment:", error);
    // Don't throw - quantum state is optional enhancement
  }
}

/**
 * Update quantum state when shipment status changes
 */
export async function updateQuantumStateOnStatusChange(
  shipmentId: string,
  newStatus: Shipment["status"],
  previousStatus?: Shipment["status"],
): Promise<void> {
  try {
    const trigger: "JOURNEY_TOUCHPOINT" | "EXCEPTION_DETECTED" =
      newStatus === "EXCEPTION" ? "EXCEPTION_DETECTED" : "JOURNEY_TOUCHPOINT";

    await schrodingersTruckService.updateQuantumState(shipmentId, trigger, {
      newStatus,
      previousStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating quantum state on status change:", error);
  }
}

/**
 * Get quantum state for shipment (helper for transportation services)
 */
export async function getQuantumStateForShipment(shipmentId: string) {
  return schrodingersTruckService.getQuantumState(shipmentId);
}

/**
 * Subscribe to quantum state updates (for real-time dashboards)
 */
export function subscribeToQuantumStateUpdates(
  shipmentId: string,
  callback: (state: any) => void,
) {
  return schrodingersTruckService.subscribeToUpdates(shipmentId, callback);
}
