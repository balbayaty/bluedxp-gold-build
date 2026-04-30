/**
 * TMS Integration for Truth Engine
 * Maps TMS/Transportation events to TruthEvents with evidence
 */

import { truthSDK, createModuleIntegration } from "../sdk";
import { TruthEventType, EvidenceSourceSystem } from "@/types/truth-engine";
import { eventBus } from "@/lib/services/event-store";
import { DomainEvent } from "@/types/cqrs";

/**
 * Initialize TMS integration
 */
export function initializeTMSIntegration(tenantId: string) {
  const integration = createModuleIntegration("tms", tenantId);

  // Subscribe to TMS domain events
  eventBus.subscribe("tms.*", async (event: DomainEvent) => {
    await mapTMSEventToTruthEvent(event, integration, tenantId);
  });

  // Subscribe to WhatsApp/Telematics events
  eventBus.subscribe("telematics.*", async (event: DomainEvent) => {
    await mapTelematicsEventToTruthEvent(event, integration, tenantId);
  });

  // Register TMS-specific KPIs
  registerTMSKPIs(integration);

  return integration;
}

/**
 * Map TMS domain event to TruthEvent
 */
async function mapTMSEventToTruthEvent(
  event: DomainEvent,
  integration: ReturnType<typeof createModuleIntegration>,
  tenantId: string,
) {
  const eventType = event.type;
  const payload = event.payload as any;

  let truthEventType: TruthEventType | null = null;
  let evidenceSource: EvidenceSourceSystem = "tms";

  if (eventType.includes("truck.departed")) {
    truthEventType = "truck_departed";
  } else if (eventType.includes("truck.arrived")) {
    truthEventType = "truck_arrived";
  } else if (eventType.includes("delivered")) {
    truthEventType = "delivered";
  } else if (eventType.includes("delivery.failed")) {
    truthEventType = "delivery_failed";
  } else if (eventType.includes("pod.captured")) {
    truthEventType = "pod_captured";
    evidenceSource = "telematics";
  } else if (eventType.includes("pod.signed")) {
    truthEventType = "pod_signed";
    evidenceSource = "telematics";
  } else if (eventType.includes("detention.started")) {
    truthEventType = "detention_started";
  } else if (eventType.includes("detention.ended")) {
    truthEventType = "detention_ended";
  } else if (eventType.includes("border.arrival")) {
    truthEventType = "border_arrival";
  } else if (eventType.includes("border.clearance")) {
    truthEventType = "border_clearance";
  } else if (eventType.includes("route.optimized")) {
    truthEventType = "route_optimized";
  }

  if (!truthEventType) {
    return;
  }

  const entityRefs = {
    shipmentId: payload.shipmentId,
    routeId: payload.routeId,
    carrierId: payload.carrierId,
    customerId: payload.customerId,
    laneId: payload.laneId,
  };

  const evidence = [
    {
      type: "event" as const,
      category: "operational" as const,
      title: `TMS Event: ${eventType}`,
      sourceSystem: evidenceSource,
      content: JSON.stringify(payload),
      validationState: "pending" as const,
      status: "active" as const,
      hashAlgorithm: "sha256" as const,
      chainOfCustody: [],
      metadata: {
        source: "tms",
        capturedAt: new Date().toISOString(),
        capturedMethod: "api" as const,
        processed: false,
        originalEventId: event.id,
        location: payload.location
          ? {
              latitude: payload.location.lat,
              longitude: payload.location.lng,
              address: payload.location.address,
            }
          : undefined,
      },
      relatedEntities: Object.entries(entityRefs)
        .filter(([_, id]) => id)
        .map(([key, id]) => ({
          entityId: id!,
          entityType: key.replace("Id", ""),
          relationship: "source" as const,
          addedAt: new Date().toISOString(),
        })),
      tags: ["tms", "auto-captured"],
    },
  ];

  await integration.recordModuleEvent(
    truthEventType,
    entityRefs,
    {
      type: payload.driverId ? "driver" : "system",
      id: payload.driverId,
      name: payload.driverName || "TMS System",
    },
    evidence,
    {
      originalEventId: event.id,
      originalEventType: eventType,
    },
  );
}

/**
 * Map telematics event (geofence, GPS) to TruthEvent
 */
async function mapTelematicsEventToTruthEvent(
  event: DomainEvent,
  integration: ReturnType<typeof createModuleIntegration>,
  tenantId: string,
) {
  const eventType = event.type;
  const payload = event.payload as any;

  let truthEventType: TruthEventType | null = null;

  if (eventType.includes("geofence.entered")) {
    truthEventType = "geofence_entered";
  } else if (eventType.includes("geofence.exited")) {
    truthEventType = "geofence_exited";
  } else if (eventType.includes("idle.detected")) {
    truthEventType = "idle_detected";
  }

  if (!truthEventType) {
    return;
  }

  const entityRefs = {
    shipmentId: payload.shipmentId,
    routeId: payload.routeId,
  };

  const evidence = [
    {
      type: "event" as const,
      category: "operational" as const,
      title: `Telematics Event: ${eventType}`,
      sourceSystem: "telematics" as EvidenceSourceSystem,
      content: JSON.stringify(payload),
      validationState: "pending" as const,
      status: "active" as const,
      hashAlgorithm: "sha256" as const,
      chainOfCustody: [],
      metadata: {
        source: "telematics",
        capturedAt: new Date().toISOString(),
        capturedMethod: "api" as const,
        processed: false,
        originalEventId: event.id,
        location: {
          latitude: payload.latitude,
          longitude: payload.longitude,
        },
        device: {
          type: "gps",
          id: payload.deviceId,
        },
      },
      relatedEntities: Object.entries(entityRefs)
        .filter(([_, id]) => id)
        .map(([key, id]) => ({
          entityId: id!,
          entityType: key.replace("Id", ""),
          relationship: "source" as const,
          addedAt: new Date().toISOString(),
        })),
      tags: ["telematics", "iot", "auto-captured"],
    },
  ];

  await integration.recordModuleEvent(
    truthEventType,
    entityRefs,
    {
      type: "iot_device",
      id: payload.deviceId,
      name: "GPS Device",
    },
    evidence,
    {
      originalEventId: event.id,
      originalEventType: eventType,
    },
  );
}

/**
 * Register TMS-specific KPIs
 */
async function registerTMSKPIs(
  integration: ReturnType<typeof createModuleIntegration>,
) {
  // On-Time Delivery Rate
  await integration.registerModuleKPI(
    "on_time_delivery_rate",
    "Percentage of deliveries completed on time",
    "count(delivered where on_time) / count(delivered) * 100",
    ["delivered", "delivery_failed"],
    "operational",
  );

  // Detention Hours by Lane
  await integration.registerModuleKPI(
    "detention_hours_by_lane",
    "Total detention hours by lane",
    "sum(detention_ended.happenedAt - detention_started.happenedAt)",
    ["detention_started", "detention_ended"],
    "financial",
  );

  // Average Transit Time
  await integration.registerModuleKPI(
    "average_transit_time",
    "Average time from departure to delivery",
    "average(delivered.happenedAt - truck_departed.happenedAt)",
    ["truck_departed", "delivered"],
    "operational",
  );
}

export default initializeTMSIntegration;
