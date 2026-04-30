/**
 * Transportation Integration Utilities
 *
 * Helper utilities for integrating transportation services with other modules
 */

import { eventBus } from "@/lib/services/event-store";
import type { Shipment } from "@/types/tms";

/**
 * Initialize transportation module integrations
 */
export async function initializeTransportationIntegrations(): Promise<void> {
  // Subscribe to relevant events from other modules
  await subscribeToExternalEvents();

  // Set up cross-module event handlers
  await setupCrossModuleHandlers();

  console.log("✅ Transportation module integrations initialized");
}

/**
 * Subscribe to external module events
 */
async function subscribeToExternalEvents(): Promise<void> {
  // WMS events
  eventBus.subscribe("wms.inventory.updated", async (data: any) => {
    // Handle inventory updates that might affect transportation
    console.log("WMS inventory updated:", data);
  });

  // Purchase Order events
  eventBus.subscribe("purchase-order.created", async (data: any) => {
    // Auto-create shipment from purchase order if needed
    console.log("Purchase order created:", data);
  });

  // RFQ events
  eventBus.subscribe("rfq.created", async (data: any) => {
    // Suggest transportation services for RFQ
    console.log("RFQ created:", data);
  });

  // Journey events
  eventBus.subscribe("journey.stage.changed", async (data: any) => {
    // Update shipment status based on journey stage
    console.log("Journey stage changed:", data);
  });

  // Root cause events
  eventBus.subscribe("root-cause.analysis.completed", async (data: any) => {
    // Update shipment with root cause analysis results
    console.log("Root cause analysis completed:", data);
  });
}

/**
 * Set up cross-module event handlers
 */
async function setupCrossModuleHandlers(): Promise<void> {
  // Handle shipment creation events
  eventBus.subscribe("transportation.shipment.created", async (data: any) => {
    // Notify other modules
    await eventBus.publish("wms.shipment.created", data);
    await eventBus.publish("journey.physical.created", {
      journeyId: data.journeyId,
      shipmentId: data.shipmentId,
    });
  });

  // Handle shipment status changes
  eventBus.subscribe(
    "transportation.shipment.status.changed",
    async (data: any) => {
      // Update journey stage
      if (data.journeyId) {
        await eventBus.publish("journey.stage.update", {
          journeyId: data.journeyId,
          stage: mapShipmentStatusToJourneyStage(data.status),
        });
      }
    },
  );

  // Handle exceptions
  eventBus.subscribe("transportation.shipment.exception", async (data: any) => {
    // Trigger root cause analysis
    if (data.rootCauseAnalysisId) {
      await eventBus.publish("root-cause.analysis.trigger", {
        rootCauseAnalysisId: data.rootCauseAnalysisId,
        exception: data.exception,
      });
    }
  });
}

/**
 * Map shipment status to journey stage
 */
function mapShipmentStatusToJourneyStage(status: Shipment["status"]): string {
  const mapping: Record<Shipment["status"], string> = {
    DRAFT: "PLANNING",
    QUOTED: "PLANNING",
    BOOKED: "PLANNING",
    PICKED_UP: "IN_TRANSIT",
    IN_TRANSIT: "IN_TRANSIT",
    AT_PORT: "IN_TRANSIT",
    CUSTOMS_CLEARANCE: "IN_TRANSIT",
    OUT_FOR_DELIVERY: "IN_TRANSIT",
    DELIVERED: "COMPLETED",
    EXCEPTION: "EXCEPTION",
    RETURNED: "EXCEPTION",
    CANCELLED: "CANCELLED",
  };
  return mapping[status] || "UNKNOWN";
}

/**
 * Sync shipment with journey module
 */
export async function syncShipmentWithJourney(
  shipment: Shipment,
): Promise<void> {
  if (!shipment.journeyId) return;

  // Get tracking events
  const trackingEvents = shipment.trackingEvents || [];

  // Convert to journey touchpoints
  const touchpoints = trackingEvents.map((event) => ({
    id: event.id,
    timestamp: event.timestamp,
    location: event.location,
    status: event.status,
    description: event.description,
    metadata: event.metadata,
  }));

  // Publish to journey module
  await eventBus.publish("journey.touchpoints.update", {
    journeyId: shipment.journeyId,
    touchpoints,
  });
}

/**
 * Sync shipment with root cause analysis
 */
export async function syncShipmentWithRootCause(
  shipment: Shipment,
): Promise<void> {
  if (!shipment.rootCauseAnalysisId) return;

  // Get exceptions
  const exceptions = shipment.exceptions || [];

  if (exceptions.length === 0) return;

  // Publish exceptions for root cause analysis
  await eventBus.publish("root-cause.exceptions.add", {
    rootCauseAnalysisId: shipment.rootCauseAnalysisId,
    exceptions: exceptions.map((ex) => ({
      type: ex.type,
      description: ex.description,
      severity: ex.severity,
      timestamp: ex.timestamp,
      metadata: ex.metadata,
    })),
  });
}

/**
 * Validate shipment data before creation
 */
export function validateShipmentData(shipment: Partial<Shipment>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!shipment.origin) {
    errors.push("Origin location is required");
  }

  if (!shipment.destination) {
    errors.push("Destination location is required");
  }

  if (!shipment.type) {
    errors.push("Shipment type is required");
  }

  if (!shipment.mode) {
    errors.push("Transport mode is required");
  }

  if (!shipment.items || shipment.items.length === 0) {
    errors.push("At least one item is required");
  }

  if (!shipment.totalWeight || shipment.totalWeight <= 0) {
    errors.push("Total weight must be greater than 0");
  }

  if (!shipment.totalVolume || shipment.totalVolume <= 0) {
    errors.push("Total volume must be greater than 0");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate shipment metrics
 */
export function calculateShipmentMetrics(shipment: Shipment): {
  totalDistance?: number;
  averageSpeed?: number;
  onTimePerformance?: number;
  costPerKm?: number;
  costPerKg?: number;
} {
  const metrics: ReturnType<typeof calculateShipmentMetrics> = {};

  // Distance
  if (shipment.route?.distance) {
    metrics.totalDistance = shipment.route.distance;
  }

  // Average speed
  if (shipment.transitTime?.actual && shipment.route?.distance) {
    metrics.averageSpeed =
      shipment.route.distance / shipment.transitTime.actual;
  }

  // On-time performance
  if (shipment.transitTime?.scheduled && shipment.transitTime?.actual) {
    const delay = shipment.transitTime.actual - shipment.transitTime.scheduled;
    metrics.onTimePerformance =
      delay <= 0
        ? 100
        : Math.max(0, 100 - (delay / shipment.transitTime.scheduled) * 100);
  }

  // Cost per km
  if (shipment.freightCharges?.total && shipment.route?.distance) {
    metrics.costPerKm = shipment.freightCharges.total / shipment.route.distance;
  }

  // Cost per kg
  if (shipment.freightCharges?.total && shipment.totalWeight) {
    metrics.costPerKg = shipment.freightCharges.total / shipment.totalWeight;
  }

  return metrics;
}

/**
 * Format shipment for display
 */
export function formatShipmentForDisplay(shipment: Shipment): {
  id: string;
  number: string;
  status: string;
  route: string;
  carrier?: string;
  estimatedDelivery?: string;
  currentLocation?: string;
} {
  return {
    id: shipment.id,
    number: shipment.shipmentNumber,
    status: shipment.status,
    route: `${shipment.origin.address.city} → ${shipment.destination.address.city}`,
    carrier: shipment.carrierName,
    estimatedDelivery: shipment.estimatedDelivery
      ? new Date(shipment.estimatedDelivery).toLocaleDateString()
      : undefined,
    currentLocation: shipment.currentLocation?.address,
  };
}
