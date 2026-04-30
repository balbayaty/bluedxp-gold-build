/**
 * Transportation Module Integration
 *
 * Auto-analyzes psychology when shipment is created
 * Integrates with existing transportation services
 *
 * @module cargo-psychology
 */

import { cargoPsychologyService } from "./service";
import { initializePsychologyForQuantumState } from "./schrodingers-integration";
import { eventBus, createEvent } from "@/lib/services/event-store";
import type { Shipment } from "@/types/tms";

/**
 * Initialize psychology analysis when shipment is created
 * Called automatically by transportation service
 */
export async function initializePsychologyForShipment(
  shipment: Shipment,
): Promise<void> {
  try {
    // Analyze shipment psychology
    await cargoPsychologyService.analyzeShipment(shipment.id);

    // Link with quantum state if it exists
    await initializePsychologyForQuantumState(shipment.id);

    // Publish integration event
    await eventBus.publish(
      createEvent(
        "ShipmentPsychologyStateAnalyzed",
        shipment.id,
        "Shipment",
        { shipmentId: shipment.id },
        1,
        {
          tenantId: shipment.tenantId,
          correlationId: `psychology-init-${Date.now()}`,
          userId: shipment.createdBy || "system",
        },
      ),
    );
  } catch (error) {
    console.error("Error initializing psychology for shipment:", error);
    // Don't throw - psychology is optional enhancement
  }
}

/**
 * Update psychology when shipment status changes
 */
export async function updatePsychologyOnStatusChange(
  shipmentId: string,
  newStatus: Shipment["status"],
  previousStatus?: Shipment["status"],
): Promise<void> {
  try {
    // Re-analyze if status indicates completion or no-show
    if (newStatus === "DELIVERED" || newStatus === "EXCEPTION") {
      const psychologyState =
        await cargoPsychologyService.getPsychologyState(shipmentId);
      if (psychologyState) {
        // Learn from outcome
        const actualOutcome =
          newStatus === "DELIVERED" ? "COMPLETED" : "NO_SHOW";
        // Would call psychologyEngine.learnFromOutcome here
      }
    }
  } catch (error) {
    console.warn("Error updating psychology on status change:", error);
  }
}

/**
 * Get psychology state for shipment (helper for transportation services)
 */
export async function getPsychologyStateForShipment(shipmentId: string) {
  return cargoPsychologyService.getPsychologyState(shipmentId);
}
