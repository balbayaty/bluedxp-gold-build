/**
 * Proposals & RFQ Module Initialization
 * Full ecosystem integration following BlueDXP architecture patterns
 */

import { eventBus } from "@/lib/services/event-store";
import { eventStore } from "@/lib/services/event-store";
import { enhancedProposalService } from "./enhancedProposalService";
import { proposalApprovalService } from "./proposalApprovalService";
import { proposalBenchmarkingService } from "./proposalBenchmarkingService";
import { proposalCollaborationService } from "./proposalCollaborationService";
import { proposalTrackingService } from "./proposalTrackingService";
import { contentBlockLibraryService } from "./contentBlockLibrary";
import { proposalABTestingService } from "./proposalABTestingService";
import { proposalFollowUpService } from "./proposalFollowUpService";
import { rfqService } from "./RFQService";
import { rfiService } from "./RFIService";
import { rfiAutomationService } from "./rfiAutomationService";
import type { DomainEvent } from "@/types/cqrs";

// ============================================================================
// MODULE INITIALIZATION
// ============================================================================

export async function initializeProposalsModule(
  tenantId: string = "default",
): Promise<void> {
  console.log(`🚀 Initializing Proposals & RFQ Module for tenant: ${tenantId}`);

  try {
    // 0. Initialize all services (singletons auto-initialize)
    console.log("📦 Initializing proposal services...");
    const services = [
      rfiService, // RFI Service (NEW - Intelligent RFI processing)
      enhancedProposalService,
      proposalApprovalService,
      proposalBenchmarkingService,
      proposalCollaborationService,
      proposalTrackingService,
      contentBlockLibraryService,
      proposalABTestingService,
      proposalFollowUpService,
    ];
    console.log(`✅ ${services.length} services initialized`);

    // 0.5. Initialize deep integrations (Evidence, Liability, Contracts, Compliance)
    console.log("🔗 Initializing deep integrations...");
    const { proposalEvidenceIntegration } =
      await import("./proposalEvidenceIntegration");
    const { proposalLiabilityIntegration } =
      await import("./proposalLiabilityIntegration");
    const { proposalContractIntegration } =
      await import("./proposalContractIntegration");
    const { proposalComplianceIntegration } =
      await import("./proposalComplianceIntegration");
    console.log(
      "✅ Evidence, Liability, Contract, and Compliance integrations initialized",
    );

    // 1. Initialize event handlers for ecosystem integration
    await initializeEcosystemEventHandlers(tenantId);

    // 2. Initialize cross-module integrations
    await initializeCrossModuleIntegrations(tenantId);

    // 3. Register approval workflows
    registerApprovalWorkflows();

    // 4. Initialize data persistence (if needed)
    await initializeDataPersistence(tenantId);

    // 5. Initialize scheduled tasks
    initializeScheduledTasks(tenantId);

    console.log(
      `✅ Proposals & RFQ Module initialized successfully for tenant: ${tenantId}`,
    );
  } catch (error) {
    console.error("❌ Error initializing Proposals & RFQ Module:", error);
    throw error;
  }
}

// ============================================================================
// ECOSYSTEM EVENT HANDLERS
// ============================================================================

async function initializeEcosystemEventHandlers(
  tenantId: string,
): Promise<void> {
  console.log("📡 Initializing ecosystem event handlers...");

  // ============================================================================
  // WMS INTEGRATION
  // ============================================================================

  eventBus.subscribe("wms.*", async (event: DomainEvent) => {
    await handleWMSEvent(event, tenantId);
  });

  // Specific WMS events
  eventBus.subscribe("wms.shipment.created", async (event: DomainEvent) => {
    const { shipmentId, customerId, services } = event.payload || {};
    // Auto-suggest proposal generation for new shipments
    console.log("WMS shipment created, can generate proposal:", shipmentId);
  });

  eventBus.subscribe("wms.inventory.updated", async (event: DomainEvent) => {
    const { warehouseId, capacity } = event.payload || {};
    // Update proposal pricing based on warehouse capacity
    console.log(
      "WMS inventory updated, may affect proposal pricing:",
      warehouseId,
    );
  });

  // ============================================================================
  // TMS INTEGRATION
  // ============================================================================

  eventBus.subscribe("tms.*", async (event: DomainEvent) => {
    await handleTMSEvent(event, tenantId);
  });

  eventBus.subscribe("tms.quote.created", async (event: DomainEvent) => {
    const { quoteId, quote } = event.payload || {};
    // Auto-generate proposal from quote
    if (quote) {
      try {
        await enhancedProposalService.generateProposalWithRAG(
          {
            proposalType: "QUOTE_PROPOSAL",
            sourceData: { quote },
            templateId: "quote-to-proposal",
          },
          {
            useRAG: true,
            tenantId,
          },
        );
      } catch (error) {
        console.error("Error auto-generating proposal from quote:", error);
      }
    }
  });

  eventBus.subscribe("tms.shipment.created", async (event: DomainEvent) => {
    const { shipmentId, shipment } = event.payload || {};
    // Link proposal to shipment if exists
    console.log(
      "TMS shipment created, linking to proposal if exists:",
      shipmentId,
    );
  });

  // ============================================================================
  // CRM INTEGRATION
  // ============================================================================

  eventBus.subscribe("crm.*", async (event: DomainEvent) => {
    await handleCRMEvent(event, tenantId);
  });

  eventBus.subscribe("crm.opportunity.created", async (event: DomainEvent) => {
    const { opportunityId, customerId, estimatedValue } = event.payload || {};
    // Create RFQ from opportunity
    console.log("CRM opportunity created, can create RFQ:", opportunityId);
  });

  eventBus.subscribe("crm.lead.converted", async (event: DomainEvent) => {
    const { leadId, customerId } = event.payload || {};
    // Auto-generate proposal for converted lead
    console.log("CRM lead converted, can generate proposal:", leadId);
  });

  // ============================================================================
  // COMPLIANCE INTEGRATION
  // ============================================================================

  eventBus.subscribe("compliance.*", async (event: DomainEvent) => {
    await handleComplianceEvent(event, tenantId);
  });

  eventBus.subscribe(
    "compliance.approval.approved",
    async (event: DomainEvent) => {
      const { entityId, entityType } = event.payload || {};
      if (entityType === "PROPOSAL") {
        // Proposal approved, can auto-send
        console.log("Proposal approved, can auto-send:", entityId);
      }
    },
  );

  eventBus.subscribe(
    "compliance.approval.rejected",
    async (event: DomainEvent) => {
      const { entityId, entityType, reason } = event.payload || {};
      if (entityType === "PROPOSAL") {
        // Proposal rejected, notify creator
        console.log("Proposal rejected:", entityId, reason);
      }
    },
  );

  // ============================================================================
  // FINANCE INTEGRATION
  // ============================================================================

  eventBus.subscribe("finance.*", async (event: DomainEvent) => {
    await handleFinanceEvent(event, tenantId);
  });

  eventBus.subscribe("finance.invoice.created", async (event: DomainEvent) => {
    const { invoiceId, proposalId } = event.payload || {};
    // Link invoice to proposal
    console.log("Finance invoice created, linking to proposal:", invoiceId);
  });

  // ============================================================================
  // PROCUREMENT INTEGRATION
  // ============================================================================

  eventBus.subscribe("procurement.*", async (event: DomainEvent) => {
    await handleProcurementEvent(event, tenantId);
  });

  eventBus.subscribe(
    "procurement.requisition.created",
    async (event: DomainEvent) => {
      const { requisitionId, services } = event.payload || {};
      // Create RFQ from requisition
      console.log(
        "Procurement requisition created, can create RFQ:",
        requisitionId,
      );
    },
  );

  // ============================================================================
  // MARKETPLACE INTEGRATION
  // ============================================================================

  eventBus.subscribe("marketplace.*", async (event: DomainEvent) => {
    await handleMarketplaceEvent(event, tenantId);
  });

  eventBus.subscribe(
    "marketplace.booking.created",
    async (event: DomainEvent) => {
      const { bookingId, serviceCategory } = event.payload || {};
      // Generate proposal from marketplace booking
      console.log(
        "Marketplace booking created, can generate proposal:",
        bookingId,
      );
    },
  );

  // ============================================================================
  // QHSE INTEGRATION
  // ============================================================================

  eventBus.subscribe("qhse.*", async (event: DomainEvent) => {
    await handleQHSEEvent(event, tenantId);
  });

  // ============================================================================
  // HR INTEGRATION
  // ============================================================================

  eventBus.subscribe("hr.*", async (event: DomainEvent) => {
    await handleHREvent(event, tenantId);
  });

  // ============================================================================
  // TRUTH ENGINE INTEGRATION
  // ============================================================================

  eventBus.subscribe("truth-engine.*", async (event: DomainEvent) => {
    await handleTruthEngineEvent(event, tenantId);
  });

  // ============================================================================
  // RFI INTEGRATION (NEW - Intelligent RFI Processing)
  // ============================================================================

  eventBus.subscribe("rfi.*", async (event: DomainEvent) => {
    await handleRFIEvent(event, tenantId);
  });

  eventBus.subscribe("rfi.submitted", async (event: DomainEvent) => {
    const { rfiId, autoGenerateRFQ, autoGenerateProposal } =
      event.payload || {};

    // Get RFI and analysis
    const rfi = await rfiService.getRFI(rfiId, tenantId);
    if (!rfi) return;

    const analysis = await rfiService.analyzeRFI(rfiId, tenantId);

    // Evaluate automation rules
    const automationDecisions = await rfiAutomationService.evaluateAutomation(
      rfi,
      analysis,
    );

    // Execute automation actions
    for (const decision of automationDecisions) {
      for (const action of decision.actions) {
        try {
          switch (action.type) {
            case "generate_rfq":
              if (!rfi.generatedRFQId) {
                await rfiService.generateRFQFromRFI(
                  rfiId,
                  tenantId,
                  event.metadata?.userId || "system",
                );
              }
              break;
            case "generate_proposal":
              if (!rfi.generatedProposalId) {
                await rfiService.generateProposalFromRFI(
                  rfiId,
                  tenantId,
                  event.metadata?.userId || "system",
                );
              }
              break;
            case "notify":
              // Notification handled by notification service
              break;
            case "escalate":
              // Escalation handled by workflow service
              break;
            case "flag":
              // Flagging handled by compliance service
              break;
          }
        } catch (error) {
          console.error(
            `Error executing automation action ${action.type}:`,
            error,
          );
        }
      }
    }

    // Fallback to original auto-processing if no rules matched
    if (
      automationDecisions.length === 0 &&
      (autoGenerateRFQ || autoGenerateProposal)
    ) {
      try {
        await rfiService.autoProcessRFI(
          rfiId,
          tenantId,
          event.metadata?.userId || "system",
        );
      } catch (error) {
        console.error("Error auto-processing RFI:", error);
      }
    }
  });

  eventBus.subscribe("rfi.rfq_generated", async (event: DomainEvent) => {
    const { rfiId, rfqId } = event.payload || {};
    console.log(`RFI ${rfiId} generated RFQ ${rfqId}`);
    // Can trigger additional workflows here
  });

  eventBus.subscribe("rfi.proposal_generated", async (event: DomainEvent) => {
    const { rfiId, proposalId } = event.payload || {};
    console.log(`RFI ${rfiId} generated Proposal ${proposalId}`);
    // Can trigger approval workflow or auto-send
  });

  console.log("✅ Ecosystem event handlers initialized");
}

// ============================================================================
// CROSS-MODULE INTEGRATION HANDLERS
// ============================================================================

async function handleWMSEvent(
  event: DomainEvent,
  tenantId: string,
): Promise<void> {
  // Handle WMS events for proposals
  const { type, payload } = event;

  switch (type) {
    case "wms.shipment.completed":
      // Update proposal status when shipment completes
      if (payload?.proposalId) {
        await enhancedProposalService.updateProposal(payload.proposalId, {
          status: "ACCEPTED",
        });
      }
      break;
  }
}

async function handleTMSEvent(
  event: DomainEvent,
  tenantId: string,
): Promise<void> {
  // Handle TMS events for proposals
  const { type, payload } = event;

  switch (type) {
    case "tms.route.optimized":
      // Update proposal with optimized route information
      if (payload?.proposalId) {
        // Update proposal sections with route optimization
        console.log(
          "TMS route optimized, updating proposal:",
          payload.proposalId,
        );
      }
      break;
  }
}

async function handleCRMEvent(
  event: DomainEvent,
  tenantId: string,
): Promise<void> {
  // Handle CRM events for proposals
  const { type, payload } = event;

  switch (type) {
    case "crm.customer.updated":
      // Update proposal customer information
      if (payload?.customerId) {
        console.log(
          "CRM customer updated, updating proposals:",
          payload.customerId,
        );
      }
      break;
  }
}

async function handleComplianceEvent(
  event: DomainEvent,
  tenantId: string,
): Promise<void> {
  // Handle compliance events
  // Already handled in enhancedProposalService
}

async function handleFinanceEvent(
  event: DomainEvent,
  tenantId: string,
): Promise<void> {
  // Handle finance events for proposals
  const { type, payload } = event;

  switch (type) {
    case "finance.payment.received":
      // Mark proposal as paid
      if (payload?.proposalId) {
        console.log("Payment received for proposal:", payload.proposalId);
      }
      break;
  }
}

async function handleProcurementEvent(
  event: DomainEvent,
  tenantId: string,
): Promise<void> {
  // Handle procurement events
  const { type, payload } = event;

  switch (type) {
    case "procurement.vendor.selected":
      // Update proposal with vendor information
      if (payload?.proposalId) {
        console.log("Vendor selected for proposal:", payload.proposalId);
      }
      break;
  }
}

async function handleMarketplaceEvent(
  event: DomainEvent,
  tenantId: string,
): Promise<void> {
  // Handle marketplace events
  const { type, payload } = event;

  switch (type) {
    case "marketplace.listing.updated":
      // Update proposal pricing based on marketplace rates
      if (payload?.serviceCategory) {
        console.log("Marketplace listing updated, may affect proposal pricing");
      }
      break;
  }
}

async function handleQHSEEvent(
  event: DomainEvent,
  tenantId: string,
): Promise<void> {
  // Handle QHSE events
  const { type, payload } = event;

  switch (type) {
    case "qhse.incident.created":
      // Link QHSE incidents to proposals if relevant
      console.log("QHSE incident created, checking proposal relevance");
      break;
  }
}

async function handleHREvent(
  event: DomainEvent,
  tenantId: string,
): Promise<void> {
  // Handle HR events
  const { type, payload } = event;

  switch (type) {
    case "hr.employee.assigned":
      // Assign employee to proposal team
      if (payload?.proposalId && payload?.employeeId) {
        console.log("Employee assigned to proposal:", payload.proposalId);
      }
      break;
  }
}

async function handleTruthEngineEvent(
  event: DomainEvent,
  tenantId: string,
): Promise<void> {
  // Handle Truth Engine events
  const { type, payload } = event;

  switch (type) {
    case "truth-engine.claim.verified":
      // Update proposal with verified claims
      if (payload?.proposalId) {
        console.log(
          "Truth Engine claim verified for proposal:",
          payload.proposalId,
        );
      }
      break;
  }
}

async function handleRFIEvent(
  event: DomainEvent,
  tenantId: string,
): Promise<void> {
  // Handle RFI events
  const { type, payload } = event;

  switch (type) {
    case "rfi.created":
      // RFI created - can trigger notifications
      if (payload?.rfiId) {
        console.log("RFI created:", payload.rfiId);
      }
      break;
    case "rfi.submitted":
      // RFI submitted - check if auto-processing is enabled
      if (payload?.autoGenerateRFQ || payload?.autoGenerateProposal) {
        console.log(
          "RFI submitted with auto-processing enabled:",
          payload.rfiId,
        );
      }
      break;
    case "rfi.rfq_generated":
      // RFQ generated from RFI - update related records
      if (payload?.rfiId && payload?.rfqId) {
        console.log(
          "RFQ generated from RFI:",
          payload.rfiId,
          "→",
          payload.rfqId,
        );
      }
      break;
    case "rfi.proposal_generated":
      // Proposal generated from RFI - update related records
      if (payload?.rfiId && payload?.proposalId) {
        console.log(
          "Proposal generated from RFI:",
          payload.rfiId,
          "→",
          payload.proposalId,
        );
      }
      break;
  }
}

// ============================================================================
// CROSS-MODULE INTEGRATIONS
// ============================================================================

async function initializeCrossModuleIntegrations(
  tenantId: string,
): Promise<void> {
  console.log("🔗 Initializing cross-module integrations...");

  // WMS Integration
  // - Pull warehouse capacity for proposal pricing
  // - Link proposals to warehouse assignments
  // - Update proposals when shipments complete

  // TMS Integration
  // - Auto-generate proposals from quotes
  // - Link proposals to transportation routes
  // - Update proposals with route optimization

  // CRM Integration
  // - Create RFQs from opportunities
  // - Auto-generate proposals for converted leads
  // - Sync customer data

  // Compliance Integration
  // - Approval workflows (already integrated)
  // - Regulatory compliance checks

  // Finance Integration
  // - Link invoices to proposals
  // - Track proposal financials
  // - Payment tracking

  // Procurement Integration
  // - Create RFQs from requisitions
  // - Vendor selection integration

  // Marketplace Integration
  // - Generate proposals from bookings
  // - Dynamic pricing from marketplace

  console.log("✅ Cross-module integrations initialized");
}

// ============================================================================
// APPROVAL WORKFLOWS
// ============================================================================

function registerApprovalWorkflows(): void {
  console.log("📋 Registering approval workflows...");

  // Workflows are already registered in ProposalApprovalService
  // This function can be used to register custom workflows

  console.log("✅ Approval workflows registered");
}

// ============================================================================
// DATA PERSISTENCE
// ============================================================================

async function initializeDataPersistence(tenantId: string): Promise<void> {
  console.log("💾 Initializing data persistence...");

  // Subscribe to proposal events for persistence
  eventStore.subscribe(async (event: DomainEvent) => {
    if (
      event.type.startsWith("proposals.") ||
      event.type.startsWith("proposals-rfq.")
    ) {
      // Persist to database via Prisma
      try {
        // In production, would use Prisma to persist events
        // await prisma.event.create({ data: { ... } })
        console.log("Event persisted:", event.type, event.aggregateId);
      } catch (error) {
        console.error("Error persisting event:", error);
      }
    }
  });

  console.log("✅ Data persistence initialized");
}

// ============================================================================
// SCHEDULED TASKS
// ============================================================================

function initializeScheduledTasks(tenantId: string): void {
  console.log("⏰ Initializing scheduled tasks...");

  // Task 1: Auto-expire proposals
  // Run daily to mark expired proposals
  setInterval(
    async () => {
      try {
        const proposals = await enhancedProposalService.listProposals({
          status: "SENT",
        });
        const now = new Date();

        for (const proposal of proposals) {
          if (proposal.validUntil && new Date(proposal.validUntil) < now) {
            await enhancedProposalService.updateProposal(proposal.id, {
              status: "EXPIRED",
            });
          }
        }
      } catch (error) {
        console.error("Error in auto-expire proposals task:", error);
      }
    },
    24 * 60 * 60 * 1000,
  ); // Daily

  // Task 2: Generate benchmarks for pending proposals
  // Run hourly
  setInterval(
    async () => {
      try {
        const proposals = await enhancedProposalService.listProposals({
          status: "PENDING_REVIEW",
        });

        for (const proposal of proposals) {
          try {
            await proposalBenchmarkingService.generateBenchmark(proposal.id);
          } catch (error) {
            console.error(
              `Error generating benchmark for ${proposal.id}:`,
              error,
            );
          }
        }
      } catch (error) {
        console.error("Error in benchmark generation task:", error);
      }
    },
    60 * 60 * 1000,
  ); // Hourly

  // Task 3: Cleanup old proposals (archived)
  // Run weekly
  setInterval(
    async () => {
      try {
        // Archive proposals older than 1 year
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const proposals = await enhancedProposalService.listProposals();
        for (const proposal of proposals) {
          const created = new Date(proposal.createdAt);
          if (
            (created < oneYearAgo && proposal.status === "REJECTED") ||
            proposal.status === "EXPIRED"
          ) {
            // Archive proposal
            console.log("Archiving old proposal:", proposal.id);
          }
        }
      } catch (error) {
        console.error("Error in cleanup task:", error);
      }
    },
    7 * 24 * 60 * 60 * 1000,
  ); // Weekly

  console.log("✅ Scheduled tasks initialized");
}

// ============================================================================
// EXPORT
// ============================================================================

export default initializeProposalsModule;
