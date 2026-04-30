/**
 * Cost Accounting Service
 * Comprehensive cost accounting with cost centers, cost allocation, and product costing
 * Aggregates costs from WMS, TMS, Facility, and HR modules
 */

import { generalLedgerService } from "./generalLedgerService";
import { eventBus } from "@/lib/services/event-store";
import type { CostCenter, CostAllocation } from "@/types/finance";

// ============================================================================
// TYPES
// ============================================================================

export interface ProductCost {
  productId: string;
  productName: string;
  directMaterials: number;
  directLabor: number;
  manufacturingOverhead: number;
  totalCost: number;
  currency: string;
  period: { startDate: Date | string; endDate: Date | string };
}

export interface CostCenterReport {
  costCenterId: string;
  costCenterName: string;
  period: { startDate: Date | string; endDate: Date | string };
  directCosts: number;
  allocatedCosts: number;
  totalCosts: number;
  allocations: CostAllocation[];
  currency: string;
}

// ============================================================================
// SERVICE
// ============================================================================

class CostAccountingService {
  private costCenters: Map<string, CostCenter> = new Map();
  private costAllocations: Map<string, CostAllocation> = new Map();

  /**
   * Initialize event handlers to capture costs from all modules
   */
  initializeEventHandlers(): void {
    // Subscribe to WMS inventory cost events
    eventBus.subscribe("wms.inventory.cost.updated", async (event: any) => {
      await this.allocateCost(event.payload, "WMS");
    });

    // Subscribe to TMS freight cost events
    eventBus.subscribe(
      "transportation.freight.cost.recorded",
      async (event: any) => {
        await this.allocateCost(event.payload, "TMS");
      },
    );

    // Subscribe to Facility cost events
    eventBus.subscribe("facility.cost.recorded", async (event: any) => {
      await this.allocateCost(event.payload, "FACILITY");
    });

    // Subscribe to HR payroll cost events
    eventBus.subscribe("hr.payroll.cost.recorded", async (event: any) => {
      await this.allocateCost(event.payload, "HR");
    });
  }

  /**
   * Create cost center
   */
  async createCostCenter(input: {
    tenantId: string;
    code: string;
    name: string;
    description?: string;
    parentCostCenterId?: string;
    department?: string;
    managerId?: string;
  }): Promise<CostCenter> {
    const costCenter: CostCenter = {
      id: `cc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId: input.tenantId,
      code: input.code,
      name: input.name,
      description: input.description,
      parentCostCenterId: input.parentCostCenterId,
      department: input.department,
      managerId: input.managerId,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.costCenters.set(costCenter.id, costCenter);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "finance.cost-center.created",
      aggregateId: costCenter.id,
      aggregateType: "cost_center",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: costCenter,
    });

    return costCenter;
  }

  /**
   * Allocate cost to cost center
   */
  private async allocateCost(
    costData: any,
    source: "WMS" | "TMS" | "FACILITY" | "HR",
  ): Promise<void> {
    const costCenterId =
      costData.costCenterId ||
      this.getDefaultCostCenter(costData.tenantId, source);

    if (!costCenterId) {
      return; // No cost center specified
    }

    const allocation: CostAllocation = {
      id: `ca-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId: costData.tenantId || "",
      costCenterId,
      sourceType: source,
      sourceId: costData.id || costData.sourceId || "",
      amount: costData.amount || costData.cost || 0,
      currency: costData.currency || "SAR",
      allocationMethod: costData.allocationMethod || "DIRECT",
      allocationBasis: costData.allocationBasis,
      period: {
        startDate:
          costData.period?.startDate ||
          new Date(new Date().getFullYear(), 0, 1).toISOString(),
        endDate: costData.period?.endDate || new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    };

    this.costAllocations.set(allocation.id, allocation);

    // Create GL entry for cost allocation
    const glEntry = await generalLedgerService.createGLEntry({
      tenantId: allocation.tenantId,
      entryDate: new Date().toISOString(),
      description: `Cost Allocation - ${source} - ${allocation.costCenterId}`,
      debitAccount: this.getCostCenterAccount(costCenterId),
      creditAccount: this.getSourceAccount(source),
      amount: allocation.amount,
      currency: allocation.currency,
      referenceType: "COST_ALLOCATION",
      referenceId: allocation.id,
      createdBy: "system",
    });

    allocation.glEntryId = glEntry.id;
    this.costAllocations.set(allocation.id, allocation);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "finance.cost-allocated",
      aggregateId: allocation.id,
      aggregateType: "cost_allocation",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: allocation,
    });
  }

  /**
   * Get cost center report
   */
  async getCostCenterReport(
    costCenterId: string,
    period: { startDate: Date | string; endDate: Date | string },
  ): Promise<CostCenterReport> {
    const costCenter = this.costCenters.get(costCenterId);
    if (!costCenter) {
      throw new Error(`Cost center ${costCenterId} not found`);
    }

    const allocations = Array.from(this.costAllocations.values()).filter(
      (ca) =>
        ca.costCenterId === costCenterId &&
        new Date(ca.period.startDate) >= new Date(period.startDate) &&
        new Date(ca.period.endDate) <= new Date(period.endDate),
    );

    const directCosts = allocations
      .filter((a) => a.allocationMethod === "DIRECT")
      .reduce((sum, a) => sum + a.amount, 0);

    const allocatedCosts = allocations
      .filter((a) => a.allocationMethod !== "DIRECT")
      .reduce((sum, a) => sum + a.amount, 0);

    const totalCosts = directCosts + allocatedCosts;

    return {
      costCenterId,
      costCenterName: costCenter.name,
      period,
      directCosts,
      allocatedCosts,
      totalCosts,
      allocations,
      currency: allocations[0]?.currency || "SAR",
    };
  }

  /**
   * Get product cost
   */
  async getProductCost(
    productId: string,
    period: { startDate: Date | string; endDate: Date | string },
    tenantId: string,
  ): Promise<ProductCost> {
    // This would integrate with WMS to get product costs
    // For now, simplified version

    const directMaterials = 0; // Would come from WMS inventory costs
    const directLabor = 0; // Would come from HR payroll
    const manufacturingOverhead = 0; // Would come from Facility costs

    return {
      productId,
      productName: "Product", // Would come from WMS
      directMaterials,
      directLabor,
      manufacturingOverhead,
      totalCost: directMaterials + directLabor + manufacturingOverhead,
      currency: "SAR",
      period,
    };
  }

  /**
   * Get default cost center for source
   */
  private getDefaultCostCenter(
    tenantId: string,
    source: "WMS" | "TMS" | "FACILITY" | "HR",
  ): string | null {
    const costCenters = Array.from(this.costCenters.values()).filter(
      (cc) => cc.tenantId === tenantId && cc.isActive,
    );

    // Find cost center matching source
    const matching = costCenters.find((cc) => cc.department === source);
    return matching?.id || costCenters[0]?.id || null;
  }

  /**
   * Get cost center GL account
   */
  private getCostCenterAccount(costCenterId: string): string {
    // Would map cost center to GL account
    // For now, use default expense account
    return "6000";
  }

  /**
   * Get source GL account
   */
  private getSourceAccount(source: "WMS" | "TMS" | "FACILITY" | "HR"): string {
    const accountMap = {
      WMS: "5000", // Cost of Goods Sold
      TMS: "6300", // Freight Expenses
      FACILITY: "6200", // Utility Expenses
      HR: "6100", // Payroll Expenses
    };
    return accountMap[source] || "6000";
  }

  /**
   * Get cost centers
   */
  async getCostCenters(filters: {
    tenantId: string;
    department?: string;
    isActive?: boolean;
  }): Promise<CostCenter[]> {
    let costCenters = Array.from(this.costCenters.values()).filter(
      (cc) => cc.tenantId === filters.tenantId,
    );

    if (filters.department) {
      costCenters = costCenters.filter(
        (cc) => cc.department === filters.department,
      );
    }

    if (filters.isActive !== undefined) {
      costCenters = costCenters.filter(
        (cc) => cc.isActive === filters.isActive,
      );
    }

    return costCenters.sort((a, b) => a.code.localeCompare(b.code));
  }
}

export const costAccountingService = new CostAccountingService();

// Initialize event handlers on service creation
if (typeof window === "undefined") {
  costAccountingService.initializeEventHandlers();
}
