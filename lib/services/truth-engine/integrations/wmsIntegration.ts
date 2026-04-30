/**
 * WMS Integration for Truth Engine
 * Maps WMS events to TruthEvents with evidence
 */

import { truthSDK, createModuleIntegration } from "../sdk";
import { TruthEventType, EvidenceSourceSystem } from "@/types/truth-engine";
import { eventBus } from "@/lib/services/event-store";
import { DomainEvent } from "@/types/cqrs";
import { employeeUserIntegrationService } from "@/lib/services/hr/integration/employeeUserIntegrationService";

/**
 * Initialize WMS integration
 */
export function initializeWMSIntegration(tenantId: string) {
  const integration = createModuleIntegration("wms", tenantId);

  // Subscribe to WMS domain events
  eventBus.subscribe("wms.*", async (event: DomainEvent) => {
    await mapWMSEventToTruthEvent(event, integration, tenantId);
  });

  // Register WMS-specific KPIs
  registerWMSKPIs(integration);

  return integration;
}

/**
 * Map WMS domain event to TruthEvent
 */
async function mapWMSEventToTruthEvent(
  event: DomainEvent,
  integration: ReturnType<typeof createModuleIntegration>,
  tenantId: string,
) {
  const eventType = event.type;

  // Special-case: lifecycle stage transitions are the canonical WMS operational stream
  // and should produce TruthEvents for completion/start signals.
  if (eventType === "wms.lifecycle.stage_transitioned") {
    const payload = (event.payload || {}) as any;
    const entityType = payload.entityType as string | undefined;
    const toStageId = payload.toStageId as string | undefined;
    const context = (payload.context || {}) as Record<string, any>;

    // Map lifecycle stages -> TruthEventType
    let lifecycleTruthType: TruthEventType | null = null;
    if (entityType === "PICKING") {
      if (toStageId === "PICKING_STARTED")
        lifecycleTruthType = "picking_started";
      if (toStageId === "PICKING_COMPLETED")
        lifecycleTruthType = "picking_completed";
      if (toStageId === "PICK_VERIFIED")
        lifecycleTruthType = "picking_completed";
    } else if (entityType === "PUTAWAY") {
      if (toStageId === "PUTAWAY_IN_PROGRESS")
        lifecycleTruthType = "putaway_started";
      if (toStageId === "PUTAWAY_COMPLETED")
        lifecycleTruthType = "putaway_completed";
    } else if (entityType === "ASN") {
      if (toStageId === "RECEIVING_COMPLETED")
        lifecycleTruthType = "inbound_received";
      if (toStageId === "ASN_COMPLETED") lifecycleTruthType = "asn_received";
    }

    if (!lifecycleTruthType) return;

    // Best-effort actor resolution (userId is preferred; can be enriched later)
    const userId =
      (context.userId as string | undefined) ||
      (context.user?.id as string | undefined) ||
      ((event.metadata as any)?.userId as string | undefined);

    let employeeId =
      (context.employeeId as string | undefined) ||
      (context.assignedEmployeeId as string | undefined) ||
      (context.assignedToEmployeeId as string | undefined);

    if (!employeeId && userId) {
      try {
        employeeId =
          (await employeeUserIntegrationService.getEmployeeIdForUser(userId)) ||
          undefined;
      } catch {
        // Non-fatal; continue without employeeId
      }
    }

    const entityRefs: Record<string, string | undefined> = {
      warehouseId:
        (context.warehouseId as string | undefined) ||
        (payload.initialData?.warehouseId as string | undefined),
      orderId:
        (context.orderId as string | undefined) ||
        (payload.initialData?.orderId as string | undefined),
      asnId:
        (context.asnId as string | undefined) ||
        (payload.initialData?.asnId as string | undefined),
      shipmentId:
        (context.shipmentId as string | undefined) ||
        (payload.initialData?.shipmentId as string | undefined),
      customerId:
        (context.customerId as string | undefined) ||
        (payload.initialData?.customerId as string | undefined),
      employeeId,
    };

    const evidenceSource: EvidenceSourceSystem = "wms";
    const evidence = [
      {
        type: "event" as const,
        category: "operational" as const,
        title: `WMS Lifecycle Transition: ${entityType ?? "UNKNOWN"} -> ${toStageId ?? "UNKNOWN"}`,
        sourceSystem: evidenceSource,
        content: JSON.stringify({ eventType, payload }),
        validationState: "pending" as const,
        status: "active" as const,
        hashAlgorithm: "sha256" as const,
        chainOfCustody: [],
        metadata: {
          source: "wms",
          capturedAt: new Date().toISOString(),
          capturedMethod: "api" as const,
          processed: false,
          originalEventId: event.id,
        },
        relatedEntities: Object.entries(entityRefs)
          .filter(([_, id]) => id)
          .map(([key, id]) => ({
            entityId: id!,
            entityType: key.replace("Id", ""),
            relationship: "source" as const,
            addedAt: new Date().toISOString(),
          })),
        tags: ["wms", "lifecycle", "auto-captured"],
      },
    ];

    await integration.recordModuleEvent(
      lifecycleTruthType,
      entityRefs as any,
      userId
        ? { type: "user", id: userId }
        : { type: "system", name: "WMS Lifecycle System" },
      evidence,
      {
        originalEventId: event.id,
        originalEventType: eventType,
        lifecycleEntityType: entityType,
        lifecycleStageId: toStageId,
      },
    );

    return;
  }

  // Map event types
  let truthEventType: TruthEventType | null = null;
  let evidenceSource: EvidenceSourceSystem = "wms";

  if (eventType.includes("asn.received")) {
    truthEventType = "asn_received";
  } else if (eventType.includes("asn.acknowledged")) {
    truthEventType = "asn_acknowledged";
  } else if (eventType.includes("inbound.received")) {
    truthEventType = "inbound_received";
  } else if (eventType.includes("quality.gate.passed")) {
    truthEventType = "inbound_quality_gate_passed";
  } else if (eventType.includes("quality.gate.failed")) {
    truthEventType = "inbound_quality_gate_failed";
  } else if (eventType.includes("putaway.started")) {
    truthEventType = "putaway_started";
  } else if (eventType.includes("putaway.completed")) {
    truthEventType = "putaway_completed";
  } else if (eventType.includes("picking.started")) {
    truthEventType = "picking_started";
  } else if (eventType.includes("picking.completed")) {
    truthEventType = "picking_completed";
  } else if (eventType.includes("cycle.count.performed")) {
    truthEventType = "cycle_count_performed";
  } else if (eventType.includes("discrepancy.found")) {
    truthEventType = "discrepancy_found";
  } else if (eventType.includes("discrepancy.resolved")) {
    truthEventType = "discrepancy_resolved";
  } else if (eventType.includes("expiry.detected")) {
    truthEventType = "expiry_detected";
  }

  if (!truthEventType) {
    return; // Unknown event type
  }

  // Extract entity refs from event payload
  const payload = event.payload as any;
  const entityRefs = {
    warehouseId: payload.warehouseId,
    orderId: payload.orderId,
    asnId: payload.asnId,
    shipmentId: payload.shipmentId,
    customerId: payload.customerId,
  };

  // Create evidence from event
  const evidence = [
    {
      type: "event" as const,
      category: "operational" as const,
      title: `WMS Event: ${eventType}`,
      sourceSystem: evidenceSource,
      content: JSON.stringify(payload),
      validationState: "pending" as const,
      status: "active" as const,
      hashAlgorithm: "sha256" as const,
      chainOfCustody: [],
      metadata: {
        source: "wms",
        capturedAt: new Date().toISOString(),
        capturedMethod: "api" as const, // Changed from 'event_bus' to valid type
        processed: false,
        originalEventId: event.id,
      },
      relatedEntities: Object.entries(entityRefs)
        .filter(([_, id]) => id)
        .map(([key, id]) => ({
          entityId: id!,
          entityType: key.replace("Id", ""),
          relationship: "source" as const,
          addedAt: new Date().toISOString(),
        })),
      tags: ["wms", "auto-captured"],
    },
  ];

  // Record event
  await integration.recordModuleEvent(
    truthEventType,
    entityRefs,
    {
      type: "system",
      name: "WMS System",
    },
    evidence,
    {
      originalEventId: event.id,
      originalEventType: eventType,
    },
  );
}

/**
 * Register WMS-specific KPIs
 */
async function registerWMSKPIs(
  integration: ReturnType<typeof createModuleIntegration>,
) {
  // Cycle Count Accuracy
  await integration.registerModuleKPI(
    "cycle_count_accuracy",
    "Percentage of cycle counts with zero discrepancies",
    "count(discrepancy_resolved) / count(cycle_count_performed) * 100",
    ["cycle_count_performed", "discrepancy_resolved"],
    "operational",
  );

  // Putaway Efficiency
  await integration.registerModuleKPI(
    "putaway_efficiency",
    "Average time from inbound receipt to putaway completion",
    "average(putaway_completed.happenedAt - inbound_received.happenedAt)",
    ["inbound_received", "putaway_completed"],
    "operational",
  );

  // Quality Gate Pass Rate
  await integration.registerModuleKPI(
    "quality_gate_pass_rate",
    "Percentage of inbound receipts passing quality gates",
    "count(inbound_quality_gate_passed) / count(inbound_received) * 100",
    [
      "inbound_received",
      "inbound_quality_gate_passed",
      "inbound_quality_gate_failed",
    ],
    "quality",
  );
}

export default initializeWMSIntegration;
