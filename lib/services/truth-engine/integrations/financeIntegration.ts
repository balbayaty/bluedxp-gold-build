/**
 * Finance Integration for Truth Engine
 * Maps Finance/Invoicing events to TruthEvents with evidence
 */

import { truthSDK, createModuleIntegration } from "../sdk";
import { TruthEventType, EvidenceSourceSystem } from "@/types/truth-engine";
import { eventBus } from "@/lib/services/event-store";
import { DomainEvent } from "@/types/cqrs";

/**
 * Initialize Finance integration
 */
export function initializeFinanceIntegration(tenantId: string) {
  const integration = createModuleIntegration("finance", tenantId);

  // Subscribe to Finance domain events
  eventBus.subscribe("finance.*", async (event: DomainEvent) => {
    await mapFinanceEventToTruthEvent(event, integration, tenantId);
  });

  eventBus.subscribe("invoice.*", async (event: DomainEvent) => {
    await mapFinanceEventToTruthEvent(event, integration, tenantId);
  });

  eventBus.subscribe("payment.*", async (event: DomainEvent) => {
    await mapFinanceEventToTruthEvent(event, integration, tenantId);
  });

  // Register Finance-specific KPIs
  registerFinanceKPIs(integration);

  return integration;
}

/**
 * Map Finance domain event to TruthEvent
 */
async function mapFinanceEventToTruthEvent(
  event: DomainEvent,
  integration: ReturnType<typeof createModuleIntegration>,
  tenantId: string,
) {
  const eventType = event.type;
  const payload = event.payload as any;

  let truthEventType: TruthEventType | null = null;
  let evidenceSource: EvidenceSourceSystem = "api";

  if (
    eventType.includes("invoice.generated") ||
    eventType.includes("invoice.created")
  ) {
    truthEventType = "invoice_generated";
    evidenceSource = "api";
  } else if (eventType.includes("invoice.sent")) {
    truthEventType = "invoice_sent";
    evidenceSource = "email";
  } else if (eventType.includes("invoice.viewed")) {
    truthEventType = "invoice_viewed";
    evidenceSource = "api";
  } else if (eventType.includes("payment.received")) {
    truthEventType = "payment_received";
    evidenceSource = "api";
  } else if (eventType.includes("payment.failed")) {
    truthEventType = "payment_failed";
    evidenceSource = "api";
  } else if (eventType.includes("payment.partial")) {
    truthEventType = "payment_partial";
    evidenceSource = "api";
  } else if (eventType.includes("credit.note.issued")) {
    truthEventType = "credit_note_issued";
    evidenceSource = "api";
  } else if (eventType.includes("pricing.changed")) {
    truthEventType = "pricing_changed";
    evidenceSource = "api";
  } else if (eventType.includes("margin.calculated")) {
    truthEventType = "margin_calculated";
    evidenceSource = "api";
  } else if (eventType.includes("margin.bridge")) {
    truthEventType = "margin_bridge_updated";
    evidenceSource = "api";
  } else if (eventType.includes("finance.gl.entry.created")) {
    truthEventType = null; // Event type not in TruthEventType enum
    evidenceSource = "api";
  } else if (eventType.includes("finance.accounts-payable.created")) {
    truthEventType = null; // Event type not in TruthEventType enum
    evidenceSource = "api";
  } else if (eventType.includes("finance.accounts-receivable.created")) {
    truthEventType = null; // Event type not in TruthEventType enum
    evidenceSource = "api";
  } else if (eventType.includes("finance.budget.created")) {
    truthEventType = null; // Event type not in TruthEventType enum
    evidenceSource = "api";
  } else if (eventType.includes("finance.budget.approved")) {
    truthEventType = null; // Event type not in TruthEventType enum
    evidenceSource = "api";
  } else if (eventType.includes("finance.cost-allocated")) {
    truthEventType = null; // Event type not in TruthEventType enum
    evidenceSource = "api";
  }

  if (!truthEventType) {
    return;
  }

  const entityRefs = {
    invoiceId: payload.invoiceId,
    customerId: payload.customerId,
    contractId: payload.contractId,
    orderId: payload.orderId,
  };

  const evidence = [
    {
      type: "document" as const,
      category: "financial" as const,
      title: `Finance Event: ${eventType}`,
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
        amount: payload.amount,
        currency: payload.currency,
      },
      relatedEntities: Object.entries(entityRefs)
        .filter(([_, id]) => id)
        .map(([key, id]) => ({
          entityId: id!,
          entityType: key.replace("Id", ""),
          relationship: "source" as const,
          addedAt: new Date().toISOString(),
        })),
      tags: ["finance", "financial", "auto-captured"],
    },
  ];

  await integration.recordModuleEvent(
    truthEventType,
    entityRefs,
    {
      type: payload.userId ? "user" : "system",
      id: payload.userId,
      name: payload.userName || "Finance System",
      role: payload.userRole,
    },
    evidence,
    {
      originalEventId: event.id,
      originalEventType: eventType,
      financialAmount: payload.amount,
      currency: payload.currency,
    },
  );
}

/**
 * Register Finance-specific KPIs
 */
async function registerFinanceKPIs(
  integration: ReturnType<typeof createModuleIntegration>,
) {
  // Cash Conversion Cycle
  await integration.registerModuleKPI(
    "cash_conversion_cycle",
    "Average days from invoice to payment",
    "average(payment_received.happenedAt - invoice_generated.happenedAt)",
    ["invoice_generated", "payment_received"],
    "financial",
  );

  // Margin Bridge (Quoted vs Actual)
  await integration.registerModuleKPI(
    "margin_bridge_quoted_vs_actual",
    "Difference between quoted margin and actual margin",
    "sum(margin_bridge_updated.value)",
    ["margin_calculated", "margin_bridge_updated"],
    "financial",
  );

  // Payment Success Rate
  await integration.registerModuleKPI(
    "payment_success_rate",
    "Percentage of successful payments",
    "count(payment_received) / (count(payment_received) + count(payment_failed)) * 100",
    ["payment_received", "payment_failed"],
    "financial",
  );
}

export default initializeFinanceIntegration;
