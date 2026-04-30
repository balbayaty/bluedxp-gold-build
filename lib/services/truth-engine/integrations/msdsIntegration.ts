/**
 * MSDS/Hazalyze Integration for Truth Engine
 * Maps MSDS events to TruthEvents with evidence
 */

import { truthSDK, createModuleIntegration } from "../sdk";
import { TruthEventType, EvidenceSourceSystem } from "@/types/truth-engine";
import { eventBus } from "@/lib/services/event-store";
import { DomainEvent } from "@/types/cqrs";

/**
 * Initialize MSDS integration
 */
export function initializeMSDSIntegration(tenantId: string) {
  const integration = createModuleIntegration("msds", tenantId);

  // Subscribe to MSDS domain events
  eventBus.subscribe("msds.*", async (event: DomainEvent) => {
    await mapMSDSEventToTruthEvent(event, integration, tenantId);
  });

  // Register MSDS-specific KPIs
  registerMSDSKPIs(integration);

  return integration;
}

/**
 * Map MSDS domain event to TruthEvent
 */
async function mapMSDSEventToTruthEvent(
  event: DomainEvent,
  integration: ReturnType<typeof createModuleIntegration>,
  tenantId: string,
) {
  const eventType = event.type;
  const payload = event.payload as any;

  let truthEventType: TruthEventType | null = null;
  let evidenceSource: EvidenceSourceSystem = "manual_upload";

  if (
    eventType.includes("msds.received") ||
    eventType.includes("msds.uploaded")
  ) {
    truthEventType = "msds_received";
    evidenceSource = payload.source === "email" ? "email" : "manual_upload";
  } else if (eventType.includes("msds.classified")) {
    truthEventType = "msds_classified";
    evidenceSource = "ai_vision";
  } else if (eventType.includes("msds.approved")) {
    truthEventType = "msds_approved";
  } else if (eventType.includes("msds.rejected")) {
    truthEventType = "msds_rejected";
  } else if (eventType.includes("msds.linked")) {
    truthEventType = "msds_linked_to_sku";
  } else if (eventType.includes("hazard.detected")) {
    truthEventType = "hazard_detected";
    evidenceSource = "ai_vision";
  } else if (eventType.includes("compliance.verified")) {
    truthEventType = "compliance_verified";
  }

  if (!truthEventType) {
    return;
  }

  const entityRefs = {
    msdsId: payload.msdsId,
    customerId: payload.customerId,
    skuId: payload.skuId,
  };

  // Create evidence - MSDS documents are evidence themselves
  const evidence = [
    {
      type: "document" as const,
      category: "compliance" as const,
      title: `MSDS Event: ${eventType}`,
      sourceSystem: evidenceSource,
      fileUrl: payload.fileUrl,
      content: payload.content,
      validationState: (truthEventType === "msds_approved"
        ? "validated"
        : "pending") as "validated" | "pending",
      status: "active" as const,
      hashAlgorithm: "sha256" as const,
      chainOfCustody: [],
      metadata: {
        source: evidenceSource,
        capturedAt: new Date().toISOString(),
        capturedMethod: (payload.source === "email" ? "email" : "upload") as
          | "email"
          | "upload",
        processed: true,
        originalEventId: event.id,
        extractedData: payload.extractedData,
        aiAnalysis: payload.aiAnalysis,
      },
      relatedEntities: Object.entries(entityRefs)
        .filter(([_, id]) => id)
        .map(([key, id]) => ({
          entityId: id!,
          entityType: key.replace("Id", ""),
          relationship: "source" as const,
          addedAt: new Date().toISOString(),
        })),
      tags: ["msds", "compliance", "auto-captured"],
    },
  ];

  await integration.recordModuleEvent(
    truthEventType,
    entityRefs,
    {
      type: payload.approvedBy ? "user" : "system",
      id: payload.approvedBy,
      name: payload.approverName || "MSDS System",
      role: payload.approverRole,
    },
    evidence,
    {
      originalEventId: event.id,
      originalEventType: eventType,
      msdsDocumentId: payload.msdsId,
    },
  );
}

/**
 * Register MSDS-specific KPIs
 */
async function registerMSDSKPIs(
  integration: ReturnType<typeof createModuleIntegration>,
) {
  // MSDS Approval Time
  await integration.registerModuleKPI(
    "msds_approval_time",
    "Average time from MSDS receipt to approval",
    "average(msds_approved.happenedAt - msds_received.happenedAt)",
    ["msds_received", "msds_approved"],
    "operational",
  );

  // MSDS Compliance Rate
  await integration.registerModuleKPI(
    "msds_compliance_rate",
    "Percentage of MSDS documents that pass compliance verification",
    "count(compliance_verified) / count(msds_received) * 100",
    ["msds_received", "compliance_verified"],
    "compliance",
  );

  // Hazard Detection Rate
  await integration.registerModuleKPI(
    "hazard_detection_rate",
    "Percentage of MSDS documents with detected hazards",
    "count(hazard_detected) / count(msds_received) * 100",
    ["msds_received", "hazard_detected"],
    "safety",
  );
}

export default initializeMSDSIntegration;
