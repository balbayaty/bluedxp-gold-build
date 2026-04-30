/**
 * Truth Engine Ecosystem Integration Service
 * Comprehensive integration with ALL modules using event bus
 * No duplication - reuses existing services
 */

import { eventBus } from "@/lib/services/event-store";
import { truthEngineService } from "../truthEngineService";
import { truthSDK } from "../sdk";
import { DomainEvent, Subscription } from "@/types/cqrs";
import { TruthEvent, TruthEventType } from "@/types/truth-engine";

/**
 * Initialize comprehensive ecosystem integration
 */
export function initializeEcosystemIntegration(tenantId: string) {
  console.log("🔗 Initializing Truth Engine Ecosystem Integration...");

  // Subscribe to ALL module events
  const subscriptions: Subscription[] = [];

  // WMS Events
  subscriptions.push(
    eventBus.subscribe("wms.*", async (event: DomainEvent) => {
      await handleWMSEvent(event, tenantId);
    }),
  );

  // TMS Events
  subscriptions.push(
    eventBus.subscribe("tms.*", async (event: DomainEvent) => {
      await handleTMSEvent(event, tenantId);
    }),
  );

  // QHSE Events
  subscriptions.push(
    eventBus.subscribe("qhse.*", async (event: DomainEvent) => {
      await handleQHSEEvent(event, tenantId);
    }),
  );

  // ISO-IMS Events
  subscriptions.push(
    eventBus.subscribe("iso-ims.*", async (event: DomainEvent) => {
      await handleISOIMSEvent(event, tenantId);
    }),
  );

  // MSDS Events
  subscriptions.push(
    eventBus.subscribe("msds.*", async (event: DomainEvent) => {
      await handleMSDSEvent(event, tenantId);
    }),
  );

  // Finance Events
  subscriptions.push(
    eventBus.subscribe("finance.*", async (event: DomainEvent) => {
      await handleFinanceEvent(event, tenantId);
    }),
  );

  // HR Events
  subscriptions.push(
    eventBus.subscribe("hr.*", async (event: DomainEvent) => {
      await handleHREvent(event, tenantId);
    }),
  );

  // Facility Events
  subscriptions.push(
    eventBus.subscribe("facility.*", async (event: DomainEvent) => {
      await handleFacilityEvent(event, tenantId);
    }),
  );

  // Marketplace Events
  subscriptions.push(
    eventBus.subscribe("marketplace.*", async (event: DomainEvent) => {
      await handleMarketplaceEvent(event, tenantId);
    }),
  );

  // Warehouse Network Events
  subscriptions.push(
    eventBus.subscribe("warehouse-network.*", async (event: DomainEvent) => {
      await handleWarehouseNetworkEvent(event, tenantId);
    }),
  );

  // Process Lifecycle Events
  subscriptions.push(
    eventBus.subscribe("process.*", async (event: DomainEvent) => {
      await handleProcessEvent(event, tenantId);
    }),
  );

  // AI/Vision Events
  subscriptions.push(
    eventBus.subscribe("ai.*", async (event: DomainEvent) => {
      await handleAIEvent(event, tenantId);
    }),
  );

  // Compliance Events
  subscriptions.push(
    eventBus.subscribe("compliance.*", async (event: DomainEvent) => {
      await handleComplianceEvent(event, tenantId);
    }),
  );

  // QR Events
  subscriptions.push(
    eventBus.subscribe("qr.*", async (event: DomainEvent) => {
      await handleQREvent(event, tenantId);
    }),
  );

  // Chemical Events
  subscriptions.push(
    eventBus.subscribe("chemical.*", async (event: DomainEvent) => {
      await handleChemicalEvent(event, tenantId);
    }),
  );

  console.log(
    `✅ Truth Engine Ecosystem Integration initialized with ${subscriptions.length} subscriptions`,
  );

  return {
    unsubscribe: () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
    },
  };
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

async function handleWMSEvent(event: DomainEvent, tenantId: string) {
  const eventType = mapEventType(event.type, "wms");
  if (!eventType) return;

  await truthSDK.recordTruthEvent({
    tenantId,
    eventType,
    happenedAt: new Date(event.timestamp),
    recordedAt: new Date(),
    actor: {
      type: "system",
      id: event.metadata?.userId,
      name: (event.metadata as any)?.userName,
    },
    entityRefs: {
      warehouseId: event.aggregateId,
      shipmentId: event.payload?.shipmentId,
      orderId: event.payload?.orderId,
      containerId: event.payload?.containerId,
    },
    evidenceLinks: extractEvidenceIds(event.payload),
    confidenceScore: 0.95,
    derivedFrom: {
      sourceEventId: event.id,
    },
    status: "active",
    metadata: {
      module: "wms",
      originalEvent: event.type,
      payload: event.payload,
    },
  });
}

async function handleTMSEvent(event: DomainEvent, tenantId: string) {
  const eventType = mapEventType(event.type, "tms");
  if (!eventType) return;

  await truthSDK.recordTruthEvent({
    tenantId,
    eventType,
    happenedAt: new Date(event.timestamp),
    recordedAt: new Date(),
    actor: {
      type: "system",
      id: event.metadata?.userId,
    },
    entityRefs: {
      shipmentId: event.aggregateId,
      customerId: event.payload?.customerId,
      laneId: event.payload?.laneId,
    },
    evidenceLinks: extractEvidenceIds(event.payload),
    confidenceScore: 0.95,
    derivedFrom: {
      sourceEventId: event.id,
    },
    status: "active",
    metadata: {
      module: "tms",
      originalEvent: event.type,
    },
  });
}

async function handleQHSEEvent(event: DomainEvent, tenantId: string) {
  const eventType = mapEventType(event.type, "qhse");
  if (!eventType) return;

  await truthSDK.recordTruthEvent({
    tenantId,
    eventType,
    happenedAt: new Date(event.timestamp),
    recordedAt: new Date(),
    actor: {
      type: "user",
      id: event.metadata?.userId,
    },
    entityRefs: {
      incidentId: event.aggregateId,
      facilityId: event.payload?.facilityId,
    },
    evidenceLinks: extractEvidenceIds(event.payload),
    confidenceScore: 0.9,
    derivedFrom: {
      sourceEventId: event.id,
    },
    status: "active",
    metadata: {
      module: "qhse",
      originalEvent: event.type,
    },
  });
}

async function handleISOIMSEvent(event: DomainEvent, tenantId: string) {
  const eventType = mapEventType(event.type, "iso-ims");
  if (!eventType) return;

  await truthSDK.recordTruthEvent({
    tenantId,
    eventType,
    happenedAt: new Date(event.timestamp),
    recordedAt: new Date(),
    actor: {
      type: "user",
      id: event.metadata?.userId,
    },
    entityRefs: {
      documentId: event.aggregateId,
      ncrId: event.payload?.ncrId,
      capaId: event.payload?.capaId,
    },
    evidenceLinks: extractEvidenceIds(event.payload),
    confidenceScore: 0.95,
    derivedFrom: {
      sourceEventId: event.id,
    },
    status: "active",
    metadata: {
      module: "iso-ims",
      originalEvent: event.type,
    },
  });
}

async function handleMSDSEvent(event: DomainEvent, tenantId: string) {
  const eventType = mapEventType(event.type, "msds");
  if (!eventType) return;

  await truthSDK.recordTruthEvent({
    tenantId,
    eventType,
    happenedAt: new Date(event.timestamp),
    recordedAt: new Date(),
    actor: {
      type: "user",
      id: event.metadata?.userId,
    },
    entityRefs: {
      msdsId: event.aggregateId,
      chemicalId: event.payload?.chemicalId,
    },
    evidenceLinks: extractEvidenceIds(event.payload),
    confidenceScore: 0.95,
    derivedFrom: {
      sourceEventId: event.id,
    },
    status: "active",
    metadata: {
      module: "msds",
      originalEvent: event.type,
    },
  });
}

async function handleFinanceEvent(event: DomainEvent, tenantId: string) {
  const eventType = mapEventType(event.type, "finance");
  if (!eventType) return;

  await truthSDK.recordTruthEvent({
    tenantId,
    eventType,
    happenedAt: new Date(event.timestamp),
    recordedAt: new Date(),
    actor: {
      type: "user",
      id: event.metadata?.userId,
    },
    entityRefs: {
      invoiceId: event.aggregateId,
      paymentId: event.payload?.paymentId,
    },
    evidenceLinks: extractEvidenceIds(event.payload),
    confidenceScore: 0.95,
    derivedFrom: {
      sourceEventId: event.id,
    },
    status: "active",
    metadata: {
      module: "finance",
      originalEvent: event.type,
    },
  });
}

async function handleHREvent(event: DomainEvent, tenantId: string) {
  const eventType = mapEventType(event.type, "hr");
  if (!eventType) return;

  await truthSDK.recordTruthEvent({
    tenantId,
    eventType,
    happenedAt: new Date(event.timestamp),
    recordedAt: new Date(),
    actor: {
      type: "user",
      id: event.metadata?.userId,
    },
    entityRefs: {
      employeeId: event.aggregateId,
    },
    evidenceLinks: extractEvidenceIds(event.payload),
    confidenceScore: 0.9,
    derivedFrom: {
      sourceEventId: event.id,
    },
    status: "active",
    metadata: {
      module: "hr",
      originalEvent: event.type,
    },
  });
}

async function handleFacilityEvent(event: DomainEvent, tenantId: string) {
  const eventType = mapEventType(event.type, "facility");
  if (!eventType) return;

  await truthSDK.recordTruthEvent({
    tenantId,
    eventType,
    happenedAt: new Date(event.timestamp),
    recordedAt: new Date(),
    actor: {
      type: "system",
      id: event.metadata?.userId,
    },
    entityRefs: {
      facilityId: event.aggregateId,
      assetId: event.payload?.assetId,
    },
    evidenceLinks: extractEvidenceIds(event.payload),
    confidenceScore: 0.9,
    derivedFrom: {
      sourceEventId: event.id,
    },
    status: "active",
    metadata: {
      module: "facility",
      originalEvent: event.type,
    },
  });
}

async function handleMarketplaceEvent(event: DomainEvent, tenantId: string) {
  const eventType = mapEventType(event.type, "marketplace");
  if (!eventType) return;

  await truthSDK.recordTruthEvent({
    tenantId,
    eventType,
    happenedAt: new Date(event.timestamp),
    recordedAt: new Date(),
    actor: {
      type: "user",
      id: event.metadata?.userId,
    },
    entityRefs: {
      bookingId: event.aggregateId,
      serviceId: event.payload?.serviceId,
    },
    evidenceLinks: extractEvidenceIds(event.payload),
    confidenceScore: 0.9,
    derivedFrom: {
      sourceEventId: event.id,
    },
    status: "active",
    metadata: {
      module: "marketplace",
      originalEvent: event.type,
    },
  });
}

async function handleWarehouseNetworkEvent(
  event: DomainEvent,
  tenantId: string,
) {
  const eventType = mapEventType(event.type, "warehouse-network");
  if (!eventType) return;

  await truthSDK.recordTruthEvent({
    tenantId,
    eventType,
    happenedAt: new Date(event.timestamp),
    recordedAt: new Date(),
    actor: {
      type: "system",
      id: event.metadata?.userId,
    },
    entityRefs: {
      transferId: event.aggregateId,
      warehouseId: event.payload?.warehouseId,
    },
    evidenceLinks: extractEvidenceIds(event.payload),
    confidenceScore: 0.9,
    derivedFrom: {
      sourceEventId: event.id,
    },
    status: "active",
    metadata: {
      module: "warehouse-network",
      originalEvent: event.type,
    },
  });
}

async function handleProcessEvent(event: DomainEvent, tenantId: string) {
  const eventType = mapEventType(event.type, "process");
  if (!eventType) return;

  await truthSDK.recordTruthEvent({
    tenantId,
    eventType,
    happenedAt: new Date(event.timestamp),
    recordedAt: new Date(),
    actor: {
      type: "system",
      id: event.metadata?.userId,
    },
    entityRefs: {
      lifecycleId: event.aggregateId,
      workflowId: event.payload?.workflowId,
    },
    evidenceLinks: extractEvidenceIds(event.payload),
    confidenceScore: 0.9,
    derivedFrom: {
      sourceEventId: event.id,
    },
    status: "active",
    metadata: {
      module: "process-lifecycle",
      originalEvent: event.type,
    },
  });
}

async function handleAIEvent(event: DomainEvent, tenantId: string) {
  const eventType = mapEventType(event.type, "ai");
  if (!eventType) return;

  await truthSDK.recordTruthEvent({
    tenantId,
    eventType,
    happenedAt: new Date(event.timestamp),
    recordedAt: new Date(),
    actor: {
      type: "system",
      id: "ai-system",
    },
    entityRefs: {
      analysisId: event.aggregateId,
    },
    evidenceLinks: extractEvidenceIds(event.payload),
    confidenceScore: event.payload?.confidence || 0.85,
    derivedFrom: {
      sourceEventId: event.id,
      modelId: event.payload?.modelId,
    },
    status: "active",
    metadata: {
      module: "ai",
      originalEvent: event.type,
    },
  });
}

async function handleComplianceEvent(event: DomainEvent, tenantId: string) {
  const eventType = mapEventType(event.type, "compliance");
  if (!eventType) return;

  await truthSDK.recordTruthEvent({
    tenantId,
    eventType,
    happenedAt: new Date(event.timestamp),
    recordedAt: new Date(),
    actor: {
      type: "system",
      id: event.metadata?.userId,
    },
    entityRefs: {
      complianceId: event.aggregateId,
    },
    evidenceLinks: extractEvidenceIds(event.payload),
    confidenceScore: 0.95,
    derivedFrom: {
      sourceEventId: event.id,
    },
    status: "active",
    metadata: {
      module: "compliance",
      originalEvent: event.type,
    },
  });
}

async function handleQREvent(event: DomainEvent, tenantId: string) {
  const eventType = mapEventType(event.type, "qr");
  if (!eventType) return;

  await truthSDK.recordTruthEvent({
    tenantId,
    eventType,
    happenedAt: new Date(event.timestamp),
    recordedAt: new Date(),
    actor: {
      type: "user",
      id: event.metadata?.userId,
    },
    entityRefs: {
      qrId: event.aggregateId,
    },
    evidenceLinks: extractEvidenceIds(event.payload),
    confidenceScore: 0.95,
    derivedFrom: {
      sourceEventId: event.id,
    },
    status: "active",
    metadata: {
      module: "qr",
      originalEvent: event.type,
    },
  });
}

async function handleChemicalEvent(event: DomainEvent, tenantId: string) {
  const eventType = mapEventType(event.type, "chemical");
  if (!eventType) return;

  await truthSDK.recordTruthEvent({
    tenantId,
    eventType,
    happenedAt: new Date(event.timestamp),
    recordedAt: new Date(),
    actor: {
      type: "user",
      id: event.metadata?.userId,
    },
    entityRefs: {
      chemicalId: event.aggregateId,
      msdsId: event.payload?.msdsId,
    },
    evidenceLinks: extractEvidenceIds(event.payload),
    confidenceScore: 0.95,
    derivedFrom: {
      sourceEventId: event.id,
    },
    status: "active",
    metadata: {
      module: "chemical",
      originalEvent: event.type,
    },
  });
}

// ============================================================================
// HELPERS
// ============================================================================

function mapEventType(
  eventType: string,
  module: string,
): TruthEventType | null {
  // Map common event patterns to TruthEventType
  // Map to valid TruthEventType values
  // For now, return null for unmapped events to avoid type errors
  // In production, these should be mapped to actual TruthEventType values

  // Try to match known patterns
  if (eventType.includes("asn.received") || eventType.includes("asn.created")) {
    return "asn_received";
  }
  if (
    eventType.includes("invoice.generated") ||
    eventType.includes("invoice.created")
  ) {
    return "invoice_generated";
  }
  if (
    eventType.includes("msds.approved") ||
    eventType.includes("msds.approval")
  ) {
    return "msds_approved";
  }
  if (eventType.includes("incident.reported")) {
    return "incident_reported";
  }
  if (
    eventType.includes("delivered") ||
    eventType.includes("delivery.completed")
  ) {
    return "delivered";
  }

  // Return null for unmapped events
  return null;
}

function extractEvidenceIds(payload: any): string[] {
  const evidenceIds: string[] = [];

  if (payload?.evidenceId) {
    evidenceIds.push(payload.evidenceId);
  }
  if (payload?.evidenceIds && Array.isArray(payload.evidenceIds)) {
    evidenceIds.push(...payload.evidenceIds);
  }
  if (payload?.documentId) {
    evidenceIds.push(payload.documentId);
  }
  if (payload?.fileId) {
    evidenceIds.push(payload.fileId);
  }

  return evidenceIds;
}
