/**
 * Unified Finance Integration Service
 * CENTRAL HUB that reuses all existing financial services (NO DUPLICATION)
 * Aggregates financial data from Marketplace, Transportation, Facility, HR, WMS, TMS
 * Provides unified financial view across all modules
 */

import { generalLedgerService } from "../generalLedgerService";
import { accountsPayableService } from "../accountsPayableService";
import { accountsReceivableService } from "../accountsReceivableService";
import { financialReportingService } from "../financialReportingService";
import { budgetService } from "../budgetService";
import { costAccountingService } from "../costAccountingService";
import { paymentService } from "@/lib/services/marketplace/paymentService";
import { invoiceService } from "@/lib/services/marketplace/invoiceService";
import { financialManagementService } from "@/lib/services/transportation/financialManagementService";
import { getUtilityBillService } from "@/lib/services/facility/utility-bills/utilityBillService";
import { eventBus } from "@/lib/services/event-store";
import type {
  UnifiedFinancialData,
  FinancialIntegration,
} from "@/types/finance";

// ============================================================================
// SERVICE
// ============================================================================

class UnifiedFinanceService {
  // Reuse existing services (NO DUPLICATION)
  private marketplacePaymentService = paymentService;
  private marketplaceInvoiceService = invoiceService;
  private transportationFinancialService = financialManagementService;
  private utilityBillService = getUtilityBillService();

  // New finance services (only for new functionality)
  private glService = generalLedgerService;
  private apService = accountsPayableService;
  private arService = accountsReceivableService;
  private reportingService = financialReportingService;
  private budgetServiceInstance = budgetService;
  private costAccountingServiceInstance = costAccountingService;

  private integrations: Map<string, FinancialIntegration> = new Map();

  /**
   * Initialize unified finance service
   */
  async initialize(tenantId: string): Promise<void> {
    // Initialize chart of accounts
    await this.glService.initializeChartOfAccounts(tenantId);

    // Initialize integrations
    await this.initializeIntegrations(tenantId);
  }

  /**
   * Initialize financial integrations
   */
  private async initializeIntegrations(tenantId: string): Promise<void> {
    const integrations: FinancialIntegration[] = [
      {
        module: "MARKETPLACE",
        enabled: true,
        autoPostToGL: true,
        glAccountMapping: {
          payment: "1000", // Cash
          invoice: "1100", // Accounts Receivable
        },
      },
      {
        module: "TRANSPORTATION",
        enabled: true,
        autoPostToGL: true,
        glAccountMapping: {
          payment: "1000", // Cash
          invoice: "2000", // Accounts Payable
        },
      },
      {
        module: "FACILITY",
        enabled: true,
        autoPostToGL: true,
        glAccountMapping: {
          "utility-bill": "6200", // Utility Expenses
        },
      },
      {
        module: "HR",
        enabled: true,
        autoPostToGL: true,
        glAccountMapping: {
          payroll: "6100", // Payroll Expenses
        },
      },
      {
        module: "WMS",
        enabled: true,
        autoPostToGL: true,
        glAccountMapping: {
          inventory: "1200", // Inventory
          cost: "5000", // Cost of Goods Sold
        },
      },
      {
        module: "TMS",
        enabled: true,
        autoPostToGL: true,
        glAccountMapping: {
          freight: "6300", // Freight Expenses
        },
      },
    ];

    integrations.forEach((integration) => {
      this.integrations.set(`${tenantId}-${integration.module}`, integration);
    });
  }

  /**
   * Get unified financial data from all modules
   * AGGREGATES existing data (NO DUPLICATION)
   */
  async getUnifiedFinancialData(
    tenantId: string,
  ): Promise<UnifiedFinancialData> {
    // Get payments from all modules (reuse existing services)
    const marketplacePayments = await this.getMarketplacePayments(tenantId);
    const transportationPayments =
      await this.getTransportationPayments(tenantId);
    const facilityPayments = await this.getFacilityPayments(tenantId);

    // Get invoices from all modules (reuse existing services)
    const marketplaceInvoices = await this.getMarketplaceInvoices(tenantId);
    const transportationInvoices =
      await this.getTransportationInvoices(tenantId);
    const facilityInvoices = await this.getFacilityInvoices(tenantId);

    // Get GL entries (new service)
    const glEntries = await this.glService.getGLEntries({ tenantId });

    // Get AP records (new service, but references existing invoices)
    const apRecords = await this.apService.getAPRecords({ tenantId });

    // Get AR records (new service, but references existing invoices)
    const arRecords = await this.arService.getARRecords({ tenantId });

    // Get budgets (new service)
    const budgets = await this.budgetServiceInstance.getBudgets({ tenantId });

    // Get cost allocations (new service)
    const costAllocations = await this.costAccountingServiceInstance
      .getCostCenters({ tenantId })
      .then((centers) =>
        Promise.all(
          centers.map((cc) =>
            this.costAccountingServiceInstance.getCostCenterReport(cc.id, {
              startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(),
              endDate: new Date().toISOString(),
            }),
          ),
        ),
      )
      .then((reports) => reports.flatMap((r) => r.allocations));

    return {
      payments: {
        marketplace: marketplacePayments,
        transportation: transportationPayments,
        facility: facilityPayments,
        total:
          marketplacePayments.length +
          transportationPayments.length +
          facilityPayments.length,
      },
      invoices: {
        marketplace: marketplaceInvoices,
        transportation: transportationInvoices,
        facility: facilityInvoices,
        total:
          marketplaceInvoices.length +
          transportationInvoices.length +
          facilityInvoices.length,
      },
      glEntries,
      accountsPayable: apRecords,
      accountsReceivable: arRecords,
      budgets,
      costAllocations,
    };
  }

  /**
   * Get marketplace payments (REUSE existing service)
   */
  private async getMarketplacePayments(tenantId: string): Promise<any[]> {
    // Reuse marketplace payment service
    // This would need to be implemented in the payment service
    // For now, return empty array
    return [];
  }

  /**
   * Get transportation payments (REUSE existing service)
   */
  private async getTransportationPayments(tenantId: string): Promise<any[]> {
    // Reuse transportation financial service
    // This would need to be implemented in the financial service
    // For now, return empty array
    return [];
  }

  /**
   * Get facility payments (REUSE existing service)
   */
  private async getFacilityPayments(tenantId: string): Promise<any[]> {
    // Reuse utility bill service
    const bills = await this.utilityBillService.getBills({ tenantId });
    return bills.bills
      .filter((b) => b.paymentStatus === "paid")
      .map((b) => ({
        id: b.id,
        amount: b.totalAmount,
        currency: b.currency,
        date: b.paidAt || b.createdAt,
        source: "FACILITY",
      }));
  }

  /**
   * Get marketplace invoices (REUSE existing service)
   */
  private async getMarketplaceInvoices(tenantId: string): Promise<any[]> {
    // Reuse marketplace invoice service
    // This would need to be implemented in the invoice service
    // For now, return empty array
    return [];
  }

  /**
   * Get transportation invoices (REUSE existing service)
   */
  private async getTransportationInvoices(tenantId: string): Promise<any[]> {
    // Reuse transportation financial service
    // This would need to be implemented in the financial service
    // For now, return empty array
    return [];
  }

  /**
   * Get facility invoices (REUSE existing service)
   */
  private async getFacilityInvoices(tenantId: string): Promise<any[]> {
    // Reuse utility bill service
    const bills = await this.utilityBillService.getBills({ tenantId });
    return bills.bills.map((b) => ({
      id: b.id,
      invoiceNumber: b.billNumber,
      amount: b.totalAmount,
      currency: b.currency,
      date: b.billDate || b.createdAt,
      source: "FACILITY",
    }));
  }

  /**
   * Get financial dashboard summary
   */
  async getFinancialDashboardSummary(tenantId: string): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    accountsReceivable: number;
    accountsPayable: number;
    cashBalance: number;
    budgets: {
      total: number;
      actual: number;
      variance: number;
    };
    currency: string;
  }> {
    const period = {
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(),
      endDate: new Date().toISOString(),
    };

    // Get P&L
    const pl = await this.reportingService.generateProfitLossStatement(
      tenantId,
      period,
    );

    // Get Balance Sheet
    const balanceSheet = await this.reportingService.generateBalanceSheet(
      tenantId,
      period.endDate,
    );

    // Get AR aging
    const arAging = await this.arService.getARAgingReport(tenantId);

    // Get AP aging
    const apAging = await this.apService.getAPAgingReport(tenantId);

    // Get cash balance
    const cashBalance =
      balanceSheet.assets.current.items.find((a) => a.accountCode === "1000")
        ?.balance || 0;

    // Get budgets
    const budgets = await this.budgetServiceInstance.getBudgets({
      tenantId,
      status: "ACTIVE",
    });
    const totalBudget = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
    const totalActual = budgets.reduce((sum, b) => {
      return (
        sum +
        b.budgetItems.reduce((itemSum, item) => itemSum + item.actualAmount, 0)
      );
    }, 0);

    return {
      totalRevenue: pl.revenue.total,
      totalExpenses: pl.operatingExpenses.total + pl.costOfGoodsSold.total,
      netIncome: pl.netIncome,
      accountsReceivable: arAging.total,
      accountsPayable: apAging.total,
      cashBalance,
      budgets: {
        total: totalBudget,
        actual: totalActual,
        variance: totalActual - totalBudget,
      },
      currency: pl.currency,
    };
  }

  /**
   * Get financial integrations status
   */
  async getFinancialIntegrations(
    tenantId: string,
  ): Promise<FinancialIntegration[]> {
    return Array.from(this.integrations.values()).filter((i) => {
      const key = `${tenantId}-${i.module}`;
      return this.integrations.has(key);
    });
  }

  /**
   * Update financial integration
   */
  async updateFinancialIntegration(
    tenantId: string,
    module: FinancialIntegration["module"],
    updates: Partial<FinancialIntegration>,
  ): Promise<FinancialIntegration> {
    const key = `${tenantId}-${module}`;
    const integration = this.integrations.get(key);

    if (!integration) {
      throw new Error(`Financial integration for ${module} not found`);
    }

    const updated = {
      ...integration,
      ...updates,
      lastSyncAt: new Date().toISOString(),
    };

    this.integrations.set(key, updated);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "finance.integration.updated",
      aggregateId: key,
      aggregateType: "financial_integration",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: updated,
    });

    return updated;
  }
}

export const unifiedFinanceService = new UnifiedFinanceService();
