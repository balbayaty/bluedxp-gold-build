/**
 * Warehouse Finance Integration
 * Warehouse cost accounting and financial tracking
 * NO DUPLICATION - Uses existing finance services
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import { generalLedgerService } from "@/lib/services/finance/generalLedgerService";
import { accountsPayableService } from "@/lib/services/finance/accountsPayableService";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// WAREHOUSE FINANCE TYPES
// ============================================================================

export interface WarehouseFinancialSummary {
  warehouseId: string;
  period: { start: Date; end: Date };
  costs: {
    operational: number;
    labor: number;
    equipment: number;
    utilities: number;
    maintenance: number;
    total: number;
  };
  revenue: {
    storage: number;
    handling: number;
    valueAdded: number;
    total: number;
  };
  profit: number;
  margin: number;
}

export interface WarehouseCostAllocation {
  warehouseId: string;
  costCenter: string;
  allocations: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

// ============================================================================
// WAREHOUSE FINANCE INTEGRATION
// ============================================================================

class WarehouseFinanceIntegration {
  /**
   * Get warehouse financial summary
   */
  async getFinancialSummary(
    warehouseId: string,
    period: { start: Date; end: Date },
  ): Promise<WarehouseFinancialSummary> {
    // In production, would query finance services
    // For now, return mock data
    const costs = {
      operational: 50000,
      labor: 30000,
      equipment: 15000,
      utilities: 5000,
      maintenance: 10000,
      total: 110000,
    };

    const revenue = {
      storage: 80000,
      handling: 40000,
      valueAdded: 20000,
      total: 140000,
    };

    const profit = revenue.total - costs.total;
    const margin = (profit / revenue.total) * 100;

    return {
      warehouseId,
      period,
      costs,
      revenue,
      profit,
      margin,
    };
  }

  /**
   * Record warehouse cost
   */
  async recordCost(
    warehouseId: string,
    cost: {
      category: string;
      amount: number;
      description: string;
      date: Date;
    },
  ): Promise<void> {
    // Create GL entry
    await generalLedgerService.createEntry({
      accountCode: "WAREHOUSE_COSTS",
      debit: cost.amount,
      credit: 0,
      description: `Warehouse ${cost.category}: ${cost.description}`,
      reference: warehouseId,
      date: cost.date,
    });

    // Publish event
    await eventBus.publish({
      id: `warehouse-cost-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.cost.recorded",
      aggregateId: warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        warehouseId,
        cost,
      },
    });
  }

  /**
   * Allocate warehouse costs
   */
  async allocateCosts(
    warehouseId: string,
    allocations: Array<{ costCenter: string; percentage: number }>,
  ): Promise<WarehouseCostAllocation> {
    // In production, would calculate actual allocations
    const allocation: WarehouseCostAllocation = {
      warehouseId,
      costCenter: "WAREHOUSE",
      allocations: allocations.map((a) => ({
        category: a.costCenter,
        amount: 0, // Would calculate from total costs
        percentage: a.percentage,
      })),
    };

    return allocation;
  }
}

export const warehouseFinanceIntegration = new WarehouseFinanceIntegration();
