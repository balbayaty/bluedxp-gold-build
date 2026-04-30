/**
 * Compliance Integration for Truth Engine
 * Maps Compliance/Audit events to TruthEvents with evidence
 */

import { truthSDK, createModuleIntegration } from "../sdk";
import { TruthEventType, EvidenceSourceSystem } from "@/types/truth-engine";
import { eventBus } from "@/lib/services/event-store";
import { DomainEvent } from "@/types/cqrs";

/**
 * Initialize Compliance integration
 */
export function initializeComplianceIntegration(tenantId: string) {
  const integration = createModuleIntegration("compliance", tenantId);

  // Subscribe to Compliance domain events
  eventBus.subscribe("compliance.*", async (event: DomainEvent) => {
    await mapComplianceEventToTruthEvent(event, integration, tenantId);
  });

  eventBus.subscribe("audit.*", async (event: DomainEvent) => {
    await mapComplianceEventToTruthEvent(event, integration, tenantId);
  });

  eventBus.subscribe("violation.*", async (event: DomainEvent) => {
    await mapComplianceEventToTruthEvent(event, integration, tenantId);
  });

  // Register Compliance-specific KPIs
  registerComplianceKPIs(integration);

  return integration;
}

/**
 * Map Compliance domain event to TruthEvent
 */
async function mapComplianceEventToTruthEvent(
  event: DomainEvent,
  integration: ReturnType<typeof createModuleIntegration>,
  tenantId: string,
) {
  const eventType = event.type;
  const payload = event.payload as any;

  let truthEventType: TruthEventType | null = null;
  let evidenceSource: EvidenceSourceSystem = "api";

  if (eventType.includes("license.expired")) {
    truthEventType = "license_expired";
  } else if (eventType.includes("license.renewed")) {
    truthEventType = "license_renewed";
  } else if (eventType.includes("license.revoked")) {
    truthEventType = "license_revoked";
  } else if (eventType.includes("audit.scheduled")) {
    truthEventType = "audit_scheduled";
  } else if (eventType.includes("audit.started")) {
    truthEventType = "audit_started";
  } else if (eventType.includes("audit.completed")) {
    truthEventType = "audit_completed";
  } else if (eventType.includes("audit.failed")) {
    truthEventType = "audit_failed";
  } else if (eventType.includes("violation.detected")) {
    truthEventType = "violation_detected";
  } else if (eventType.includes("violation.resolved")) {
    truthEventType = "violation_resolved";
  } else if (eventType.includes("violation.escalated")) {
    truthEventType = "violation_escalated";
  } else if (eventType.includes("compliance.score.updated")) {
    truthEventType = "compliance_score_updated";
  } else if (eventType.includes("compliance.debt.incurred")) {
    truthEventType = "compliance_debt_incurred";
  } else if (eventType.includes("compliance.debt.resolved")) {
    truthEventType = "compliance_debt_resolved";
  } else if (eventType.includes("regulatory.change")) {
    truthEventType = "regulatory_change_detected";
  } else if (eventType.includes("regulatory.update")) {
    truthEventType = "regulatory_update_applied";
  }

  if (!truthEventType) {
    return;
  }

  const entityRefs = {
    complianceRecordId: payload.complianceRecordId,
    auditId: payload.auditId,
    customerId: payload.customerId,
    warehouseId: payload.warehouseId,
  };

  const evidence = [
    {
      type: "document" as const,
      category: "compliance" as const,
      title: `Compliance Event: ${eventType}`,
      sourceSystem: evidenceSource,
      content: JSON.stringify(payload),
      fileUrl: payload.documentUrl,
      validationState: "pending" as const,
      status: "active" as const,
      hashAlgorithm: "sha256" as const,
      chainOfCustody: [],
      metadata: {
        source: evidenceSource,
        capturedAt: new Date().toISOString(),
        capturedMethod: "api" as const,
        processed: false,
        originalEventId: event.id,
        complianceType: payload.complianceType,
        regulatoryAuthority: payload.regulatoryAuthority,
      },
      relatedEntities: Object.entries(entityRefs)
        .filter(([_, id]) => id)
        .map(([key, id]) => ({
          entityId: id!,
          entityType: key.replace("Id", ""),
          relationship: "source" as const,
          addedAt: new Date().toISOString(),
        })),
      tags: ["compliance", "regulatory", "auto-captured"],
    },
  ];

  await integration.recordModuleEvent(
    truthEventType,
    entityRefs,
    {
      type: payload.auditorId ? "user" : "system",
      id: payload.auditorId,
      name: payload.auditorName || "Compliance System",
      role: payload.auditorRole,
    },
    evidence,
    {
      originalEventId: event.id,
      originalEventType: eventType,
      complianceType: payload.complianceType,
      severity: payload.severity,
    },
  );
}

/**
 * Register Compliance-specific KPIs
 */
async function registerComplianceKPIs(
  integration: ReturnType<typeof createModuleIntegration>,
) {
  // Compliance Score
  await integration.registerModuleKPI(
    "compliance_score",
    "Overall compliance score (0-100)",
    "average(compliance_score_updated.value)",
    ["compliance_score_updated"],
    "compliance",
  );

  // Compliance Debt (Open Items)
  await integration.registerModuleKPI(
    "compliance_debt_open_items",
    "Number of unresolved compliance debt items",
    "count(compliance_debt_incurred) - count(compliance_debt_resolved)",
    ["compliance_debt_incurred", "compliance_debt_resolved"],
    "compliance",
  );

  // Violation Resolution Time
  await integration.registerModuleKPI(
    "violation_resolution_time",
    "Average time to resolve violations",
    "average(violation_resolved.happenedAt - violation_detected.happenedAt)",
    ["violation_detected", "violation_resolved"],
    "compliance",
  );

  // Audit Completion Rate
  await integration.registerModuleKPI(
    "audit_completion_rate",
    "Percentage of audits completed successfully",
    "count(audit_completed) / count(audit_scheduled) * 100",
    ["audit_scheduled", "audit_completed", "audit_failed"],
    "compliance",
  );
}

export default initializeComplianceIntegration;
