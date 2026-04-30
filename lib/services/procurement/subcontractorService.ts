/**
 * Subcontractor Service
 * Construction subcontractor management - work packages, progress billing, retention
 * Integrates with Vendor service and Finance module
 */

import { eventBus } from "@/lib/services/event-store";
import { vendorService } from "./vendorService";
import { purchaseOrderService } from "./purchaseOrderService";
import { financeIntegrationService } from "./integration/financeIntegration";
import type { DomainEvent } from "@/types/cqrs";

export interface Subcontractor extends Omit<
  import("@/types/vendor").Vendor,
  "subcontractorCategory" | "licenses" | "insurance" | "safetyRecord"
> {
  subcontractorCategory:
    | "CIVIL_WORKS"
    | "MEP"
    | "FINISHES"
    | "SPECIALIZED"
    | "SITE_SERVICES";
  licenses: import("@/types/vendor").License[];
  insurance: import("@/types/vendor").Insurance[];
  safetyRecord?: import("@/types/vendor").SafetyRecord;
}

export interface WorkPackage {
  id: string;
  tenantId: string;
  workPackageNumber: string;
  workPackageName: string;
  description?: string;
  projectId: string;
  phaseId?: string;
  subcontractorId: string;
  subcontractorName: string;
  scopeOfWork: string;
  specifications?: string;
  drawings?: string[];
  startDate: Date | string;
  endDate?: Date | string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "TERMINATED";
  contractValue: number;
  currency: string;
  retentionRate?: number; // Percentage
  retentionAmount?: number;
  progressBilling?: ProgressBilling[];
  purchaseOrderId?: string;
  createdAt: Date | string;
  createdBy: string;
}

export interface ProgressBilling {
  id: string;
  workPackageId: string;
  billingNumber: string;
  billingType: "MILESTONE" | "PERCENTAGE_COMPLETE" | "COST_PLUS";
  milestone?: string;
  percentageComplete?: number;
  billedAmount: number;
  retentionAmount?: number;
  netAmount: number;
  currency: string;
  invoiceNumber?: string;
  invoiceDate?: Date | string;
  status: "PENDING" | "APPROVED" | "PAID" | "DISPUTED";
  approvedBy?: string;
  approvedAt?: Date | string;
  paidAt?: Date | string;
  createdAt: Date | string;
}

export interface SubcontractorPerformance {
  id: string;
  subcontractorId: string;
  workPackageId: string;
  period: string;
  qualityScore: number;
  onTimeScore: number;
  safetyScore: number;
  overallScore: number;
  rating: 1 | 2 | 3 | 4 | 5;
  comments?: string;
  reviewedBy?: string;
  reviewedAt?: Date | string;
}

// In-memory storage
const workPackages = new Map<string, WorkPackage>();
const progressBillings = new Map<string, ProgressBilling>();
const subcontractorPerformances = new Map<string, SubcontractorPerformance[]>();

// Work package number generator
let wpCounter = 1;

function generateWorkPackageNumber(): string {
  const year = new Date().getFullYear();
  const number = String(wpCounter++).padStart(4, "0");
  return `WP-${year}-${number}`;
}

// Billing number generator
let billingCounter = 1;

function generateBillingNumber(): string {
  const year = new Date().getFullYear();
  const number = String(billingCounter++).padStart(4, "0");
  return `PB-${year}-${number}`;
}

export class SubcontractorService {
  /**
   * Create work package for subcontractor
   */
  async createWorkPackage(
    tenantId: string,
    projectId: string,
    subcontractorId: string,
    workPackageName: string,
    scopeOfWork: string,
    contractValue: number,
    currency: string,
    startDate: Date | string,
    endDate?: Date | string,
    specifications?: string,
    drawings?: string[],
    retentionRate?: number,
    phaseId?: string,
    userId: string = "system",
  ): Promise<WorkPackage> {
    // Get subcontractor
    const subcontractor = await vendorService.getVendor(
      subcontractorId,
      tenantId,
    );
    if (!subcontractor) {
      throw new Error("Subcontractor not found");
    }

    const workPackageNumber = generateWorkPackageNumber();
    const wpId = `wp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const retentionAmount = retentionRate
      ? (contractValue * retentionRate) / 100
      : undefined;

    const workPackage: WorkPackage = {
      id: wpId,
      tenantId,
      workPackageNumber,
      workPackageName,
      scopeOfWork,
      projectId,
      phaseId,
      subcontractorId,
      subcontractorName: subcontractor.vendorName,
      specifications,
      drawings,
      startDate,
      endDate,
      status: "PLANNED",
      contractValue,
      currency,
      retentionRate,
      retentionAmount,
      progressBilling: [],
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    workPackages.set(wpId, workPackage);

    // Publish event
    await eventBus.publish({
      type: "procurement.subcontractor.work-package.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        workPackageId: wpId,
        workPackageNumber,
        tenantId,
        projectId,
        subcontractorId,
        contractValue,
        currency,
      },
    } as DomainEvent);

    return workPackage;
  }

  /**
   * Create Purchase Order from work package
   */
  async createPurchaseOrderFromWorkPackage(
    workPackageId: string,
    tenantId: string,
    paymentTerms: string,
    userId: string,
  ): Promise<{ workPackage: WorkPackage; purchaseOrderId: string }> {
    const wp = workPackages.get(workPackageId);
    if (!wp || wp.tenantId !== tenantId) {
      throw new Error("Work package not found");
    }

    // Create PO for work package
    const po = await purchaseOrderService.createPurchaseOrder(
      {
        tenantId,
        type: "PROJECT",
        vendorId: wp.subcontractorId,
        items: [
          {
            itemName: wp.workPackageName,
            description: wp.scopeOfWork,
            quantity: 1,
            unit: "PACKAGE",
            unitPrice: wp.contractValue,
            currency: wp.currency,
            projectId: wp.projectId,
            phaseId: wp.phaseId,
          },
        ],
        paymentTerms,
        currency: wp.currency,
        projectId: wp.projectId,
        phaseId: wp.phaseId,
        workPackageId: wp.id,
      },
      userId,
    );

    wp.purchaseOrderId = po.id;
    wp.status = "IN_PROGRESS";
    workPackages.set(workPackageId, wp);

    return {
      workPackage: wp,
      purchaseOrderId: po.id,
    };
  }

  /**
   * Create progress billing
   */
  async createProgressBilling(
    workPackageId: string,
    tenantId: string,
    billingType: ProgressBilling["billingType"],
    billedAmount: number,
    milestone?: string,
    percentageComplete?: number,
    invoiceNumber?: string,
    invoiceDate?: Date | string,
    userId: string = "system",
  ): Promise<ProgressBilling> {
    const wp = workPackages.get(workPackageId);
    if (!wp || wp.tenantId !== tenantId) {
      throw new Error("Work package not found");
    }

    const billingNumber = generateBillingNumber();
    const billingId = `billing-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const retentionAmount = wp.retentionRate
      ? (billedAmount * wp.retentionRate) / 100
      : 0;
    const netAmount = billedAmount - retentionAmount;

    const billing: ProgressBilling = {
      id: billingId,
      workPackageId,
      billingNumber,
      billingType,
      milestone,
      percentageComplete,
      billedAmount,
      retentionAmount,
      netAmount,
      currency: wp.currency,
      invoiceNumber,
      invoiceDate,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    progressBillings.set(billingId, billing);

    // Add to work package
    wp.progressBilling = wp.progressBilling || [];
    wp.progressBilling.push(billing);
    workPackages.set(workPackageId, wp);

    // Publish event
    await eventBus.publish({
      type: "procurement.subcontractor.progress-billing.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        billingId,
        billingNumber,
        tenantId,
        workPackageId,
        subcontractorId: wp.subcontractorId,
        billedAmount,
        netAmount,
        currency: wp.currency,
      },
    } as DomainEvent);

    return billing;
  }

  /**
   * Approve progress billing
   */
  async approveProgressBilling(
    billingId: string,
    tenantId: string,
    approverId: string,
    comments?: string,
  ): Promise<ProgressBilling> {
    const billing = progressBillings.get(billingId);
    if (!billing) {
      throw new Error("Progress billing not found");
    }

    const wp = workPackages.get(billing.workPackageId);
    if (!wp || wp.tenantId !== tenantId) {
      throw new Error("Work package not found");
    }

    billing.status = "APPROVED";
    billing.approvedBy = approverId;
    billing.approvedAt = new Date().toISOString();

    progressBillings.set(billingId, billing);

    // Update work package billing
    const wpBilling = wp.progressBilling?.find((b) => b.id === billingId);
    if (wpBilling) {
      wpBilling.status = "APPROVED";
      wpBilling.approvedBy = approverId;
      wpBilling.approvedAt = new Date().toISOString();
      workPackages.set(billing.workPackageId, wp);
    }

    // Create AP entry if invoice is provided
    if (billing.invoiceNumber && billing.invoiceDate) {
      await financeIntegrationService.createAccountsPayable(
        tenantId,
        wp.purchaseOrderId || "",
        wp.subcontractorId,
        billing.invoiceNumber,
        billing.invoiceDate,
        billing.netAmount, // Net amount after retention
        billing.currency,
        [
          {
            itemId: billing.id,
            description: `Progress Billing ${billing.billingNumber}`,
            quantity: 1,
            unitPrice: billing.netAmount,
            totalPrice: billing.netAmount,
          },
        ],
      );
    }

    // Publish event
    await eventBus.publish({
      type: "procurement.subcontractor.progress-billing.approved",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        billingId,
        billingNumber: billing.billingNumber,
        tenantId,
        workPackageId: billing.workPackageId,
        netAmount: billing.netAmount,
        currency: billing.currency,
        approverId,
      },
    } as DomainEvent);

    return billing;
  }

  /**
   * Release retention
   */
  async releaseRetention(
    workPackageId: string,
    tenantId: string,
    releaseAmount: number,
    releaseReason: string,
    releasedBy: string,
  ): Promise<{ workPackage: WorkPackage; releaseAmount: number }> {
    const wp = workPackages.get(workPackageId);
    if (!wp || wp.tenantId !== tenantId) {
      throw new Error("Work package not found");
    }

    if (!wp.retentionAmount || wp.retentionAmount <= 0) {
      throw new Error("No retention to release");
    }

    const actualReleaseAmount = Math.min(releaseAmount, wp.retentionAmount);
    wp.retentionAmount = wp.retentionAmount - actualReleaseAmount;

    workPackages.set(workPackageId, wp);

    // Publish event
    await eventBus.publish({
      type: "procurement.subcontractor.retention.released",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        workPackageId,
        tenantId,
        releaseAmount: actualReleaseAmount,
        remainingRetention: wp.retentionAmount,
        releaseReason,
        releasedBy,
      },
    } as DomainEvent);

    return {
      workPackage: wp,
      releaseAmount: actualReleaseAmount,
    };
  }

  /**
   * Record subcontractor performance
   */
  async recordPerformance(
    subcontractorId: string,
    workPackageId: string,
    tenantId: string,
    qualityScore: number,
    onTimeScore: number,
    safetyScore: number,
    comments?: string,
    reviewedBy: string = "system",
  ): Promise<SubcontractorPerformance> {
    const wp = workPackages.get(workPackageId);
    if (!wp || wp.tenantId !== tenantId) {
      throw new Error("Work package not found");
    }

    if (wp.subcontractorId !== subcontractorId) {
      throw new Error("Subcontractor mismatch");
    }

    const overallScore = (qualityScore + onTimeScore + safetyScore) / 3;
    const rating = Math.min(5, Math.max(1, Math.ceil(overallScore / 20))) as
      | 1
      | 2
      | 3
      | 4
      | 5;

    const period = `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
    const perfId = `perf-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const performance: SubcontractorPerformance = {
      id: perfId,
      subcontractorId,
      workPackageId,
      period,
      qualityScore,
      onTimeScore,
      safetyScore,
      overallScore,
      rating,
      comments,
      reviewedBy,
      reviewedAt: new Date().toISOString(),
    };

    // Store performance
    if (!subcontractorPerformances.has(subcontractorId)) {
      subcontractorPerformances.set(subcontractorId, []);
    }
    subcontractorPerformances.get(subcontractorId)!.push(performance);

    // Update vendor performance
    await vendorService.updatePerformance(
      subcontractorId,
      tenantId,
      period,
      {
        totalOrders: 1, // Mock - would aggregate from actual orders
        totalSpend: wp.contractValue,
        onTimeDeliveryRate: onTimeScore / 100,
        qualityAcceptanceRate: qualityScore / 100,
        averageLeadTime: 0, // Mock
      },
      reviewedBy,
    );

    // Publish event
    await eventBus.publish({
      type: "procurement.subcontractor.performance.recorded",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        performanceId: perfId,
        tenantId,
        subcontractorId,
        workPackageId,
        overallScore,
        rating,
      },
    } as DomainEvent);

    return performance;
  }

  /**
   * Get work package by ID
   */
  async getWorkPackage(
    workPackageId: string,
    tenantId: string,
  ): Promise<WorkPackage | null> {
    const wp = workPackages.get(workPackageId);
    if (!wp || wp.tenantId !== tenantId) {
      return null;
    }
    return wp;
  }

  /**
   * List work packages
   */
  async listWorkPackages(
    tenantId: string,
    filters?: {
      projectId?: string;
      phaseId?: string;
      subcontractorId?: string;
      status?: WorkPackage["status"][];
    },
  ): Promise<WorkPackage[]> {
    let results = Array.from(workPackages.values()).filter(
      (wp) => wp.tenantId === tenantId,
    );

    if (filters) {
      if (filters.projectId) {
        results = results.filter((wp) => wp.projectId === filters.projectId);
      }
      if (filters.phaseId) {
        results = results.filter((wp) => wp.phaseId === filters.phaseId);
      }
      if (filters.subcontractorId) {
        results = results.filter(
          (wp) => wp.subcontractorId === filters.subcontractorId,
        );
      }
      if (filters.status && filters.status.length > 0) {
        results = results.filter((wp) => filters.status!.includes(wp.status));
      }
    }

    return results;
  }

  /**
   * Get subcontractor performance history
   */
  async getSubcontractorPerformance(
    subcontractorId: string,
    tenantId: string,
  ): Promise<SubcontractorPerformance[]> {
    return subcontractorPerformances.get(subcontractorId) || [];
  }
}

// Singleton instance
export const subcontractorService = new SubcontractorService();
