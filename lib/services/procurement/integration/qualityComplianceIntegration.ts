/**
 * Quality & Compliance Integration Service
 * Integration with QHSE module - material certificates, inspection, NCR management
 * ZERO DUPLICATION - Reuses QHSE services
 */

import { eventBus } from "@/lib/services/event-store";
import { goodsReceiptService } from "../goodsReceiptService";
import { purchaseOrderService } from "../purchaseOrderService";
import type { DomainEvent } from "@/types/cqrs";

// QHSE services available - import when needed for deeper integration
// See: lib/services/qhse/ for inspectionService and regulatoryComplianceService

export interface MaterialCertificate {
  certificateId: string;
  materialId: string;
  purchaseOrderId: string;
  certificateType: "TEST" | "QUALITY" | "COMPLIANCE" | "ORIGIN";
  certificateNumber: string;
  issuedBy: string;
  issueDate: Date | string;
  expiryDate?: Date | string;
  standard: string; // e.g., ASTM, BS, ISO, DIN
  testResults?: Record<string, any>;
  documentUrl?: string;
  status: "VALID" | "EXPIRED" | "PENDING" | "REJECTED";
}

export interface InspectionRequest {
  purchaseOrderId: string;
  goodsReceiptId?: string;
  inspectionType: "PRE_DELIVERY" | "SITE" | "FINAL" | "QUALITY";
  items: Array<{
    itemName: string;
    quantity: number;
    specifications?: string;
  }>;
  requiredDate: Date | string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface NCR {
  ncrId: string;
  purchaseOrderId: string;
  goodsReceiptId?: string;
  itemName: string;
  issue: string;
  severity: "MINOR" | "MAJOR" | "CRITICAL";
  status: "OPEN" | "INVESTIGATION" | "CORRECTIVE_ACTION" | "CLOSED";
  correctiveAction?: string;
  rootCause?: string;
}

export class QualityComplianceIntegrationService {
  private certificates: Map<string, MaterialCertificate> = new Map();
  private ncrRecords: Map<string, NCR> = new Map();

  /**
   * Register material certificate
   * Link certificate to material/PO
   */
  async registerCertificate(
    tenantId: string,
    certificate: Omit<MaterialCertificate, "certificateId" | "status">,
  ): Promise<MaterialCertificate> {
    const certificateId = `cert-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const status: MaterialCertificate["status"] = certificate.expiryDate
      ? new Date(certificate.expiryDate) < new Date()
        ? "EXPIRED"
        : "VALID"
      : "VALID";

    const materialCert: MaterialCertificate = {
      ...certificate,
      certificateId,
      status,
    };

    this.certificates.set(certificateId, materialCert);

    // TODO: Store in QHSE inspection service
    // await inspectionService.recordCertificate(tenantId, materialCert)

    await eventBus.publish({
      type: "procurement.quality.certificate.registered",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        certificateId,
        purchaseOrderId: certificate.purchaseOrderId,
        certificateType: certificate.certificateType,
      },
    } as DomainEvent);

    return materialCert;
  }

  /**
   * Request inspection
   * Create inspection request using QHSE inspection service
   */
  async requestInspection(
    tenantId: string,
    request: InspectionRequest,
  ): Promise<{ inspectionId: string; inspectionNumber: string }> {
    // TODO: Call QHSE inspection service
    // const inspection = await inspectionService.createInspection({
    //   tenantId,
    //   type: request.inspectionType === 'PRE_DELIVERY' ? 'PRE_DELIVERY' : 'SITE',
    //   title: `Inspection for PO ${request.purchaseOrderId}`,
    //   scheduledDate: request.requiredDate,
    //   priority: request.priority,
    //   relatedEntity: {
    //     type: 'PURCHASE_ORDER',
    //     id: request.purchaseOrderId,
    //   },
    // })

    const inspectionId = `insp-${Date.now()}`;
    const inspectionNumber = `INS-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8)}`;

    await eventBus.publish({
      type: "procurement.quality.inspection.requested",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        inspectionId,
        purchaseOrderId: request.purchaseOrderId,
        inspectionType: request.inspectionType,
      },
    } as DomainEvent);

    return { inspectionId, inspectionNumber };
  }

  /**
   * Create NCR (Non-Conformance Report)
   * Link to QHSE incident/inspection system
   */
  async createNCR(
    tenantId: string,
    ncr: Omit<NCR, "ncrId" | "status">,
  ): Promise<NCR> {
    const ncrId = `ncr-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const ncrRecord: NCR = {
      ...ncr,
      ncrId,
      status: "OPEN",
    };

    this.ncrRecords.set(ncrId, ncrRecord);

    // Create QHSE incident for critical NCRs
    if (ncr.severity === "CRITICAL") {
      try {
        // Dynamic import to avoid circular dependencies
        const { incidentService } =
          await import("@/lib/services/qhse/incidentService");

        await incidentService.createIncident({
          tenantId,
          type: "QUALITY",
          title: `NCR: ${ncr.issue}`,
          severity: "HIGH",
          relatedEntity: {
            type: "PURCHASE_ORDER",
            id: ncr.purchaseOrderId,
          },
        });
        console.log(`✅ Created QHSE incident for critical NCR: ${ncrId}`);
      } catch (error) {
        console.warn(`Failed to create QHSE incident for NCR ${ncrId}:`, error);
      }
    }

    await eventBus.publish({
      type: "procurement.quality.ncr.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        ncrId,
        purchaseOrderId: ncr.purchaseOrderId,
        severity: ncr.severity,
      },
    } as DomainEvent);

    return ncrRecord;
  }

  /**
   * Check certificate validity
   * Verify certificates are valid and not expired
   */
  async checkCertificateValidity(
    tenantId: string,
    purchaseOrderId: string,
  ): Promise<{
    valid: boolean;
    certificates: MaterialCertificate[];
    expired: MaterialCertificate[];
    missing: string[]; // Required but missing certificates
  }> {
    const po = await purchaseOrderService.getPurchaseOrder(
      purchaseOrderId,
      tenantId,
    );
    if (!po) {
      throw new Error("Purchase order not found");
    }

    const certificates = Array.from(this.certificates.values()).filter(
      (c) => c.purchaseOrderId === purchaseOrderId,
    );

    const expired = certificates.filter((c) => c.status === "EXPIRED");
    const valid = certificates.filter((c) => c.status === "VALID");

    // Check if required certificates are present
    const requiredCertTypes = ["TEST", "QUALITY"]; // Could be configurable per material type
    const missing = requiredCertTypes.filter(
      (type) =>
        !certificates.some(
          (c) => c.certificateType === type && c.status === "VALID",
        ),
    );

    return {
      valid: expired.length === 0 && missing.length === 0,
      certificates,
      expired,
      missing,
    };
  }

  /**
   * Get compliance status for PO
   * Check all compliance requirements
   */
  async getComplianceStatus(
    tenantId: string,
    purchaseOrderId: string,
  ): Promise<{
    compliant: boolean;
    certificates: MaterialCertificate[];
    inspections: Array<{ inspectionId: string; status: string }>;
    ncrCount: number;
    complianceScore: number;
  }> {
    const certificates = Array.from(this.certificates.values()).filter(
      (c) => c.purchaseOrderId === purchaseOrderId,
    );
    const ncrRecords = Array.from(this.ncrRecords.values()).filter(
      (n) => n.purchaseOrderId === purchaseOrderId,
    );

    // TODO: Get inspections from QHSE service
    // const inspections = await inspectionService.getInspections({
    //   tenantId,
    //   relatedEntity: { type: 'PURCHASE_ORDER', id: purchaseOrderId },
    // })

    const validCertificates = certificates.filter(
      (c) => c.status === "VALID",
    ).length;
    const totalCertificates = certificates.length;
    const openNCRs = ncrRecords.filter((n) => n.status !== "CLOSED").length;

    const complianceScore =
      totalCertificates > 0
        ? (validCertificates / totalCertificates) * 100 - openNCRs * 10
        : 100 - openNCRs * 10;

    return {
      compliant: complianceScore >= 80 && openNCRs === 0,
      certificates,
      inspections: [],
      ncrCount: ncrRecords.length,
      complianceScore: Math.max(0, complianceScore),
    };
  }

  /**
   * Initialize Quality event subscriptions
   */
  initializeQualityEventSubscriptions(): void {
    // Subscribe to QHSE inspection completion
    eventBus.subscribe(
      "qhse.inspection.completed",
      async (event: DomainEvent) => {
        console.log("QHSE inspection completed:", event.data);
        // Update goods receipt inspection status
        const { relatedEntity, findings } = event.data;
        if (relatedEntity?.type === "PURCHASE_ORDER") {
          // Update PO inspection status
        }
      },
    );

    // Subscribe to QHSE incident creation (for critical NCRs)
    eventBus.subscribe("qhse.incident.created", async (event: DomainEvent) => {
      console.log("QHSE incident created:", event.data);
      // Link to procurement NCR if applicable
    });
  }
}

// Singleton instance
export const qualityComplianceIntegrationService =
  new QualityComplianceIntegrationService();

// Initialize event subscriptions
qualityComplianceIntegrationService.initializeQualityEventSubscriptions();
