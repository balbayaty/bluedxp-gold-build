/**
 * ISO IMS Integration Service
 *
 * Ensures ISO-IMS integrates with all modules without duplication
 * Uses existing services where possible
 */

import { isoStandardsService } from "@/lib/services/qhse/standards/isoStandardsService";
import { eventBus, createEvent } from "@/lib/services/event-bus";
import { capaService } from "./capaService";
import { ncrService } from "./ncrService";

// ============================================================================
// INTEGRATION SERVICE
// ============================================================================

class ISOIMSIntegrationService {
  /**
   * Get ISO standards (uses QHSE service to avoid duplication)
   */
  async getISOStandards() {
    return isoStandardsService.getAllStandards();
  }

  /**
   * Get ISO standard by code (uses QHSE service)
   */
  async getISOStandard(code: string) {
    return isoStandardsService.getStandard(code);
  }

  /**
   * Check ISO compliance (uses QHSE service)
   */
  async checkISOCompliance(
    standardCode: string,
    tenantId: string,
    customerId?: string,
    warehouseId?: string,
  ) {
    return isoStandardsService.checkCompliance(
      standardCode,
      tenantId,
      customerId,
      warehouseId,
    );
  }

  /**
   * Integrate with QHSE module
   */
  async integrateWithQHSE(incidentId: string, tenantId: string) {
    // Create NCR from QHSE incident
    // This uses the NCR service, not duplicating QHSE functionality
    const ncr = await ncrService.createNCR({
      tenantId,
      subject: `NCR from QHSE Incident ${incidentId}`,
      description: "Auto-created from QHSE incident",
      priority: "HIGH",
      severity: "MAJOR",
      ncType: "INCIDENT",
      reportedBy: "system",
      reportedDate: new Date(),
      capaSource: "INCIDENT",
    });

    // Publish integration event
    const integrationEvent = createEvent(
      "iso-ims.qhse.integrated",
      ncr.id, // aggregateId
      "NCR", // aggregateType
      {
        incidentId,
        ncrId: ncr.id,
        tenantId,
      },
      1, // version
      { tenantId },
    );
    await eventBus.publish(integrationEvent);

    return ncr;
  }

  /**
   * Subscribe to cross-module events
   */
  subscribeToEvents() {
    // Subscribe to WMS events
    eventBus.subscribe("wms.material.nonconformance", async (event: any) => {
      // Auto-create NCR from WMS non-conformance
      await ncrService.createNCR({
        tenantId: event.payload.tenantId,
        subject: `NCR from Material Non-Conformance: ${event.payload.materialNumber}`,
        description:
          event.payload.description || "Material non-conformance detected",
        priority: "MEDIUM",
        severity: "MAJOR",
        ncType: "PRODUCT",
        reportedBy: "system",
        reportedDate: new Date(),
        linkedMaterial: event.payload.materialId,
      });
    });

    // Subscribe to TMS events
    eventBus.subscribe("tms.shipment.incident", async (event: any) => {
      // Auto-create NCR from TMS incident
      await ncrService.createNCR({
        tenantId: event.payload.tenantId,
        subject: `NCR from Shipment Incident: ${event.payload.shipmentId}`,
        description: event.payload.description || "Shipment incident detected",
        priority: "HIGH",
        severity: "MAJOR",
        ncType: "PROCESS",
        reportedBy: "system",
        reportedDate: new Date(),
        linkedSO: event.payload.shipmentId,
      });
    });

    // Subscribe to Quality events
    eventBus.subscribe("quality.inspection.failure", async (event: any) => {
      // Auto-create NCR from quality inspection failure
      await ncrService.createNCR({
        tenantId: event.payload.tenantId,
        subject: `NCR from Inspection Failure: ${event.payload.inspectionId}`,
        description:
          event.payload.failureReason || "Inspection failure detected",
        priority: "HIGH",
        severity: "MAJOR",
        ncType: "PRODUCT",
        reportedBy: "system",
        reportedDate: new Date(),
        linkedMaterial: event.payload.materialId,
        linkedBatch: event.payload.batchId,
      });
    });
  }
}

// Initialize event subscriptions
const integrationService = new ISOIMSIntegrationService();
integrationService.subscribeToEvents();

// Export singleton instance
export { integrationService as isoImsIntegrationService };
