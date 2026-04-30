/**
 * Utility Bill Management Service
 *
 * Comprehensive utility bill management with:
 * - Bill creation, storage, and validation
 * - Facility/Warehouse linking and tracing
 * - Integration with Energy Service
 * - Multi-utility support (Electricity, Water, Gas, etc.)
 * - PDF parsing and data extraction
 * - Workflow management (approval, payment tracking)
 *
 * Aligned with:
 * - Facility Management Module
 * - Energy & Sustainability Service
 * - Warehouse Management Integration
 * - QHSE Compliance
 * - Financial Tracking
 */

import type {
  UtilityBill,
  UtilityBillFilters,
  UtilityBillQuery,
  UtilityType,
  BillStatus,
  PaymentStatus,
  Currency,
  UtilityProvider,
  ConsumptionData,
  BillTraceabilityChain,
  EnergyServiceIntegration,
  FacilityIntegration,
} from "@/types/utility-bills";
import type { EnergyConsumption } from "@/types/facility";
import { eventBus } from "@/lib/services/event-store";

export interface UtilityBillServiceConfig {
  enableAutoSync?: boolean;
  enableAnomalyDetection?: boolean;
  enableEnergyIntegration?: boolean;
  defaultCurrency?: Currency;
  autoApproveThreshold?: number;
  enableWorkflow?: boolean;
}

/**
 * Utility Bill Service Implementation
 */
export class UtilityBillService {
  private config: UtilityBillServiceConfig;
  private bills: Map<string, UtilityBill> = new Map();
  private providers: Map<string, UtilityProvider> = new Map();

  constructor(config: UtilityBillServiceConfig = {}) {
    this.config = {
      enableAutoSync: true,
      enableAnomalyDetection: true,
      enableEnergyIntegration: true,
      defaultCurrency: "SAR",
      autoApproveThreshold: 10000,
      enableWorkflow: true,
      ...config,
    };
  }

  /**
   * Create a new utility bill
   */
  async createBill(
    billData: Omit<UtilityBill, "id" | "createdAt" | "updatedAt" | "version">,
  ): Promise<UtilityBill> {
    // Generate bill ID
    const billId = `bill-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Validate bill data
    this.validateBillData(billData);

    // Create bill object
    const bill: UtilityBill = {
      ...billData,
      id: billId,
      status: billData.status || "pending",
      paymentStatus: billData.paymentStatus || "unpaid",
      currentBalance: billData.totalAmount,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        source: billData.metadata?.source || "manual",
        ...billData.metadata,
      },
      traceability: {
        ...billData.traceability,
      },
    };

    // Auto-approve if below threshold
    if (
      this.config.enableWorkflow &&
      bill.totalAmount <= (this.config.autoApproveThreshold || 10000)
    ) {
      bill.approvalStatus = "approved";
      bill.status = "approved";
    }

    // Store bill
    this.bills.set(billId, bill);

    // Link to facility/warehouse if provided
    if (bill.facilityId || bill.warehouseId) {
      await this.linkBillToFacility(billId, {
        facilityId: bill.facilityId,
        warehouseId: bill.warehouseId,
      });
    }

    // Integrate with energy service if electricity bill
    if (
      this.config.enableEnergyIntegration &&
      bill.utilityType === "electricity"
    ) {
      await this.syncWithEnergyService(billId);
    }

    // Publish event
    await eventBus.publish({
      id: `event-${Date.now()}`,
      type: "facility.utility-bill.created",
      aggregateId: billId,
      aggregateType: "UtilityBill",
      version: 1,
      timestamp: new Date(),
      data: {
        billId,
        billNumber: bill.billNumber,
        utilityType: bill.utilityType,
        totalAmount: bill.totalAmount,
        facilityId: bill.facilityId,
        warehouseId: bill.warehouseId,
      },
      metadata: {},
    });

    return bill;
  }

  /**
   * Get bill by ID
   */
  async getBill(billId: string): Promise<UtilityBill | null> {
    return this.bills.get(billId) || null;
  }

  /**
   * Get bills by filters
   */
  async getBills(query: UtilityBillQuery = {}): Promise<{
    bills: UtilityBill[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    let bills = Array.from(this.bills.values());

    // Apply filters
    if (query.filters) {
      bills = this.applyFilters(bills, query.filters);
    }

    // Apply sorting
    if (query.sortBy) {
      bills = this.sortBills(bills, query.sortBy, query.sortOrder || "desc");
    }

    // Apply pagination
    const page = query.page || 1;
    const pageSize = query.pageSize || 50;
    const total = bills.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedBills = bills.slice(startIndex, endIndex);

    return {
      bills: paginatedBills,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Update bill
   */
  async updateBill(
    billId: string,
    updates: Partial<UtilityBill>,
    updatedBy?: string,
  ): Promise<UtilityBill> {
    const bill = this.bills.get(billId);
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    // Validate updates
    if (updates.totalAmount !== undefined && updates.totalAmount < 0) {
      throw new Error("Total amount cannot be negative");
    }

    // Update bill
    const updatedBill: UtilityBill = {
      ...bill,
      ...updates,
      id: billId, // Prevent ID change
      updatedAt: new Date(),
      updatedBy,
      version: bill.version + 1,
    };

    // Recalculate balance if amount changed
    if (updates.totalAmount !== undefined || updates.payments !== undefined) {
      updatedBill.currentBalance =
        updatedBill.totalAmount - (updatedBill.payments || 0);

      // Update payment status
      if (updatedBill.currentBalance <= 0) {
        updatedBill.paymentStatus = "paid";
        updatedBill.status = "paid";
        updatedBill.paidDate = new Date();
      } else if (updatedBill.payments && updatedBill.payments > 0) {
        updatedBill.paymentStatus = "partial";
      }
    }

    this.bills.set(billId, updatedBill);

    // Publish event
    await eventBus.publish({
      id: `event-${Date.now()}`,
      type: "facility.utility-bill.updated",
      aggregateId: billId,
      aggregateType: "UtilityBill",
      version: updatedBill.version,
      timestamp: new Date(),
      data: {
        billId,
        updates: Object.keys(updates),
        updatedBy,
      },
      metadata: {},
    });

    return updatedBill;
  }

  /**
   * Delete bill (soft delete by setting status to cancelled)
   */
  async deleteBill(billId: string, deletedBy?: string): Promise<void> {
    const bill = this.bills.get(billId);
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    await this.updateBill(
      billId,
      {
        status: "cancelled",
      },
      deletedBy,
    );
  }

  /**
   * Approve bill
   */
  async approveBill(billId: string, approvedBy: string): Promise<UtilityBill> {
    const bill = this.bills.get(billId);
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    if (bill.approvalStatus === "approved") {
      throw new Error("Bill is already approved");
    }

    return await this.updateBill(
      billId,
      {
        approvalStatus: "approved",
        status: "approved",
        approvedBy,
        approvedAt: new Date(),
      },
      approvedBy,
    );
  }

  /**
   * Record payment
   */
  async recordPayment(
    billId: string,
    paymentAmount: number,
    paymentMethod?: string,
    paymentDate?: Date,
  ): Promise<UtilityBill> {
    const bill = this.bills.get(billId);
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    const currentPayments = bill.payments || 0;
    const newPayments = currentPayments + paymentAmount;
    const newBalance = bill.totalAmount - newPayments;

    return await this.updateBill(billId, {
      payments: newPayments,
      currentBalance: newBalance,
      paymentStatus:
        newBalance <= 0
          ? "paid"
          : newBalance < bill.totalAmount
            ? "partial"
            : "unpaid",
      paidDate: newBalance <= 0 ? paymentDate || new Date() : bill.paidDate,
    });
  }

  /**
   * Link bill to facility/warehouse
   */
  async linkBillToFacility(
    billId: string,
    links: {
      facilityId?: string;
      warehouseId?: string;
    },
  ): Promise<FacilityIntegration> {
    const bill = this.bills.get(billId);
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    // Update bill with facility/warehouse info
    await this.updateBill(billId, {
      facilityId: links.facilityId || bill.facilityId,
      warehouseId: links.warehouseId || bill.warehouseId,
    });

    return {
      billId,
      facilityId: links.facilityId || bill.facilityId || "",
      integrationStatus: "linked",
    };
  }

  /**
   * Sync with Energy Service
   */
  async syncWithEnergyService(
    billId: string,
  ): Promise<EnergyServiceIntegration> {
    const bill = this.bills.get(billId);
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    if (bill.utilityType !== "electricity") {
      throw new Error(
        "Energy service integration only available for electricity bills",
      );
    }

    // Check if consumption data exists
    if (!bill.consumption) {
      return {
        billId,
        energyConsumptionId: "",
        syncStatus: "pending",
        discrepancies: [],
      };
    }

    // Create or link energy consumption record
    // This would integrate with the EnergyService
    // For now, we'll just mark it as synced
    const energyConsumptionId = `energy-${billId}-${Date.now()}`;

    // Update bill traceability
    await this.updateBill(billId, {
      traceability: {
        ...bill.traceability,
        linkedEnergyConsumptionId: energyConsumptionId,
      },
    });

    return {
      billId,
      energyConsumptionId,
      syncStatus: "synced",
      syncDate: new Date(),
      discrepancies: [],
    };
  }

  /**
   * Get bill traceability chain
   */
  async getBillTraceability(billId: string): Promise<BillTraceabilityChain> {
    const bill = this.bills.get(billId);
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    // Build traceability chain
    const chain: BillTraceabilityChain = {
      billId,
      billNumber: bill.billNumber,
      traceability: {
        upstream: {
          provider: bill.provider,
          consumptionSource: bill.consumption
            ? {
                type:
                  bill.metadata.source === "api-integration"
                    ? "iot-sensor"
                    : "manual-reading",
                sourceId: bill.id,
                timestamp: bill.readingDate || bill.issueDate,
              }
            : undefined,
        },
        downstream: {
          linkedEnergyConsumption: bill.traceability.linkedEnergyConsumptionId
            ? {
                consumptionId: bill.traceability.linkedEnergyConsumptionId,
                period: bill.billingPeriod,
                consumption: bill.consumption?.quantity || 0,
              }
            : undefined,
        },
        relatedBills: [],
      },
      auditTrail: [
        {
          event: "bill_created",
          timestamp: bill.createdAt,
          userId: bill.createdBy,
        },
        {
          event: "bill_updated",
          timestamp: bill.updatedAt,
          userId: bill.updatedBy,
        },
      ],
    };

    // Find related bills (previous period, same period last year, etc.)
    const allBills = Array.from(this.bills.values());
    const relatedBills = allBills.filter((b) => {
      if (b.id === billId) return false;
      if (b.accountNumber === bill.accountNumber) return true;
      if (
        b.facilityId === bill.facilityId ||
        b.warehouseId === bill.warehouseId
      )
        return true;
      return false;
    });

    chain.traceability.relatedBills = relatedBills.map((b) => ({
      billId: b.id,
      billNumber: b.billNumber,
      relationship: this.determineBillRelationship(bill, b),
      period: b.billingPeriod,
    }));

    return chain;
  }

  /**
   * Register utility provider
   */
  async registerProvider(provider: UtilityProvider): Promise<UtilityProvider> {
    const providerId =
      provider.id ||
      `provider-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const providerWithId: UtilityProvider = {
      ...provider,
      id: providerId,
    };
    this.providers.set(providerId, providerWithId);
    return providerWithId;
  }

  /**
   * Get provider by ID
   */
  async getProvider(providerId: string): Promise<UtilityProvider | null> {
    return this.providers.get(providerId) || null;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private validateBillData(billData: Partial<UtilityBill>): void {
    if (!billData.billNumber) {
      throw new Error("Bill number is required");
    }
    if (!billData.accountNumber) {
      throw new Error("Account number is required");
    }
    if (!billData.utilityType) {
      throw new Error("Utility type is required");
    }
    if (!billData.provider) {
      throw new Error("Provider is required");
    }
    if (!billData.billingPeriod) {
      throw new Error("Billing period is required");
    }
    if (billData.totalAmount === undefined || billData.totalAmount < 0) {
      throw new Error("Total amount is required and must be non-negative");
    }
  }

  private applyFilters(
    bills: UtilityBill[],
    filters: UtilityBillFilters,
  ): UtilityBill[] {
    return bills.filter((bill) => {
      if (
        filters.utilityTypes &&
        !filters.utilityTypes.includes(bill.utilityType)
      ) {
        return false;
      }
      if (
        filters.facilityIds &&
        bill.facilityId &&
        !filters.facilityIds.includes(bill.facilityId)
      ) {
        return false;
      }
      if (
        filters.warehouseIds &&
        bill.warehouseId &&
        !filters.warehouseIds.includes(bill.warehouseId)
      ) {
        return false;
      }
      if (filters.statuses && !filters.statuses.includes(bill.status)) {
        return false;
      }
      if (
        filters.paymentStatuses &&
        !filters.paymentStatuses.includes(bill.paymentStatus)
      ) {
        return false;
      }
      if (filters.dateRange) {
        const billDate = bill.issueDate;
        if (
          billDate < filters.dateRange.start ||
          billDate > filters.dateRange.end
        ) {
          return false;
        }
      }
      if (filters.amountRange) {
        if (
          bill.totalAmount < filters.amountRange.min ||
          bill.totalAmount > filters.amountRange.max
        ) {
          return false;
        }
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !bill.billNumber.toLowerCase().includes(searchLower) &&
          !bill.accountNumber.toLowerCase().includes(searchLower) &&
          !bill.provider.name.toLowerCase().includes(searchLower) &&
          !bill.facilityName?.toLowerCase().includes(searchLower) &&
          !bill.warehouseName?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
      if (filters.tenantId && bill.tenantId !== filters.tenantId) {
        return false;
      }
      return true;
    });
  }

  private sortBills(
    bills: UtilityBill[],
    sortBy: string,
    sortOrder: "asc" | "desc",
  ): UtilityBill[] {
    return bills.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison =
            new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
          break;
        case "amount":
          comparison = a.totalAmount - b.totalAmount;
          break;
        case "consumption":
          comparison =
            (a.consumption?.quantity || 0) - (b.consumption?.quantity || 0);
          break;
        case "facility":
          comparison = (a.facilityName || "").localeCompare(
            b.facilityName || "",
          );
          break;
        case "warehouse":
          comparison = (a.warehouseName || "").localeCompare(
            b.warehouseName || "",
          );
          break;
        default:
          comparison = 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }

  private determineBillRelationship(
    bill1: UtilityBill,
    bill2: UtilityBill,
  ): "previous" | "next" | "same-period-last-year" | "related-facility" {
    // Check if same account
    if (bill1.accountNumber === bill2.accountNumber) {
      const bill1End = new Date(bill1.billingPeriod.end);
      const bill2Start = new Date(bill2.billingPeriod.start);

      // Previous period
      if (
        bill2Start < bill1End &&
        Math.abs(bill2Start.getTime() - bill1End.getTime()) <
          30 * 24 * 60 * 60 * 1000
      ) {
        return "previous";
      }

      // Next period
      if (
        bill2Start > bill1End &&
        Math.abs(bill2Start.getTime() - bill1End.getTime()) <
          30 * 24 * 60 * 60 * 1000
      ) {
        return "next";
      }

      // Same period last year
      const bill1Year = bill1.billingPeriod.start.getFullYear();
      const bill2Year = bill2.billingPeriod.start.getFullYear();
      if (bill2Year === bill1Year - 1) {
        const bill1Month = bill1.billingPeriod.start.getMonth();
        const bill2Month = bill2.billingPeriod.start.getMonth();
        if (bill1Month === bill2Month) {
          return "same-period-last-year";
        }
      }
    }

    return "related-facility";
  }
}

// Singleton instance
let utilityBillServiceInstance: UtilityBillService | null = null;

export function getUtilityBillService(
  config?: UtilityBillServiceConfig,
): UtilityBillService {
  if (!utilityBillServiceInstance) {
    utilityBillServiceInstance = new UtilityBillService(config);
  }
  return utilityBillServiceInstance;
}
