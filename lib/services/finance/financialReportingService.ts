/**
 * Financial Reporting Service
 * Generates comprehensive financial reports from GL and other financial data
 * World-class reporting with P&L, Balance Sheet, Cash Flow, and more
 */

import { generalLedgerService } from "./generalLedgerService";
import { accountsPayableService } from "./accountsPayableService";
import { accountsReceivableService } from "./accountsReceivableService";
import { exportService } from "@/lib/services/export/exportService";
import type {
  FinancialReport,
  GeneralLedgerEntry,
  AccountBalance,
} from "@/types/finance";

// ============================================================================
// TYPES
// ============================================================================

export interface ProfitLossStatement {
  period: { startDate: Date | string; endDate: Date | string };
  revenue: {
    total: number;
    items: Array<{ accountCode: string; accountName: string; amount: number }>;
  };
  costOfGoodsSold: {
    total: number;
    items: Array<{ accountCode: string; accountName: string; amount: number }>;
  };
  grossProfit: number;
  operatingExpenses: {
    total: number;
    items: Array<{ accountCode: string; accountName: string; amount: number }>;
  };
  operatingIncome: number;
  otherIncome: number;
  otherExpenses: number;
  netIncome: number;
  currency: string;
}

export interface BalanceSheet {
  asOfDate: Date | string;
  assets: {
    current: {
      total: number;
      items: Array<{
        accountCode: string;
        accountName: string;
        balance: number;
      }>;
    };
    nonCurrent: {
      total: number;
      items: Array<{
        accountCode: string;
        accountName: string;
        balance: number;
      }>;
    };
    total: number;
  };
  liabilities: {
    current: {
      total: number;
      items: Array<{
        accountCode: string;
        accountName: string;
        balance: number;
      }>;
    };
    nonCurrent: {
      total: number;
      items: Array<{
        accountCode: string;
        accountName: string;
        balance: number;
      }>;
    };
    total: number;
  };
  equity: {
    total: number;
    items: Array<{ accountCode: string; accountName: string; balance: number }>;
  };
  totalLiabilitiesAndEquity: number;
  currency: string;
}

export interface CashFlowStatement {
  period: { startDate: Date | string; endDate: Date | string };
  operatingActivities: {
    netIncome: number;
    adjustments: Array<{ description: string; amount: number }>;
    changesInWorkingCapital: {
      accountsReceivable: number;
      accountsPayable: number;
      inventory: number;
      other: number;
    };
    netCashFromOperations: number;
  };
  investingActivities: {
    items: Array<{ description: string; amount: number }>;
    netCashFromInvesting: number;
  };
  financingActivities: {
    items: Array<{ description: string; amount: number }>;
    netCashFromFinancing: number;
  };
  netChangeInCash: number;
  beginningCash: number;
  endingCash: number;
  currency: string;
}

// ============================================================================
// SERVICE
// ============================================================================

class FinancialReportingService {
  /**
   * Generate Profit & Loss Statement
   */
  async generateProfitLossStatement(
    tenantId: string,
    period: { startDate: Date | string; endDate: Date | string },
  ): Promise<ProfitLossStatement> {
    const trialBalance = await generalLedgerService.getTrialBalance(
      period,
      tenantId,
    );

    // Revenue (4000 series)
    const revenueAccounts = trialBalance.accounts.filter((a) =>
      a.accountCode.startsWith("4000"),
    );
    const revenueTotal = revenueAccounts.reduce(
      (sum, a) => sum + (a.netBalance > 0 ? a.netBalance : 0),
      0,
    );

    // Cost of Goods Sold (5000 series)
    const cogsAccounts = trialBalance.accounts.filter((a) =>
      a.accountCode.startsWith("5000"),
    );
    const cogsTotal = cogsAccounts.reduce(
      (sum, a) => sum + Math.abs(a.netBalance),
      0,
    );

    // Operating Expenses (6000 series)
    const operatingExpenseAccounts = trialBalance.accounts.filter((a) =>
      a.accountCode.startsWith("6000"),
    );
    const operatingExpensesTotal = operatingExpenseAccounts.reduce(
      (sum, a) => sum + Math.abs(a.netBalance),
      0,
    );

    // Other Income/Expenses
    const otherIncome = 0; // Can be calculated from other revenue accounts
    const otherExpenses = 0; // Can be calculated from other expense accounts

    const grossProfit = revenueTotal - cogsTotal;
    const operatingIncome = grossProfit - operatingExpensesTotal;
    const netIncome = operatingIncome + otherIncome - otherExpenses;

    return {
      period,
      revenue: {
        total: revenueTotal,
        items: revenueAccounts.map((a) => ({
          accountCode: a.accountCode,
          accountName: a.accountName,
          amount: a.netBalance > 0 ? a.netBalance : 0,
        })),
      },
      costOfGoodsSold: {
        total: cogsTotal,
        items: cogsAccounts.map((a) => ({
          accountCode: a.accountCode,
          accountName: a.accountName,
          amount: Math.abs(a.netBalance),
        })),
      },
      grossProfit,
      operatingExpenses: {
        total: operatingExpensesTotal,
        items: operatingExpenseAccounts.map((a) => ({
          accountCode: a.accountCode,
          accountName: a.accountName,
          amount: Math.abs(a.netBalance),
        })),
      },
      operatingIncome,
      otherIncome,
      otherExpenses,
      netIncome,
      currency: trialBalance.accounts[0]?.currency || "SAR",
    };
  }

  /**
   * Generate Balance Sheet
   */
  async generateBalanceSheet(
    tenantId: string,
    asOfDate: Date | string,
  ): Promise<BalanceSheet> {
    const period = {
      startDate: new Date(2000, 0, 1).toISOString(), // From beginning
      endDate: asOfDate,
    };

    const trialBalance = await generalLedgerService.getTrialBalance(
      period,
      tenantId,
    );

    // Assets (1000 series)
    const assetAccounts = trialBalance.accounts.filter((a) =>
      a.accountCode.startsWith("1"),
    );
    const currentAssets = assetAccounts.filter((a) =>
      ["1000", "1100", "1200"].includes(a.accountCode),
    );
    const nonCurrentAssets = assetAccounts.filter(
      (a) => !["1000", "1100", "1200"].includes(a.accountCode),
    );

    // Liabilities (2000 series)
    const liabilityAccounts = trialBalance.accounts.filter((a) =>
      a.accountCode.startsWith("2"),
    );
    const currentLiabilities = liabilityAccounts.filter((a) =>
      a.accountCode.startsWith("20"),
    );
    const nonCurrentLiabilities = liabilityAccounts.filter(
      (a) => !a.accountCode.startsWith("20"),
    );

    // Equity (3000 series)
    const equityAccounts = trialBalance.accounts.filter((a) =>
      a.accountCode.startsWith("3"),
    );

    const currentAssetsTotal = currentAssets.reduce(
      (sum, a) => sum + Math.abs(a.netBalance),
      0,
    );
    const nonCurrentAssetsTotal = nonCurrentAssets.reduce(
      (sum, a) => sum + Math.abs(a.netBalance),
      0,
    );
    const assetsTotal = currentAssetsTotal + nonCurrentAssetsTotal;

    const currentLiabilitiesTotal = currentLiabilities.reduce(
      (sum, a) => sum + Math.abs(a.netBalance),
      0,
    );
    const nonCurrentLiabilitiesTotal = nonCurrentLiabilities.reduce(
      (sum, a) => sum + Math.abs(a.netBalance),
      0,
    );
    const liabilitiesTotal =
      currentLiabilitiesTotal + nonCurrentLiabilitiesTotal;

    const equityTotal = equityAccounts.reduce(
      (sum, a) => sum + (a.netBalance > 0 ? a.netBalance : 0),
      0,
    );

    return {
      asOfDate,
      assets: {
        current: {
          total: currentAssetsTotal,
          items: currentAssets.map((a) => ({
            accountCode: a.accountCode,
            accountName: a.accountName,
            balance: Math.abs(a.netBalance),
          })),
        },
        nonCurrent: {
          total: nonCurrentAssetsTotal,
          items: nonCurrentAssets.map((a) => ({
            accountCode: a.accountCode,
            accountName: a.accountName,
            balance: Math.abs(a.netBalance),
          })),
        },
        total: assetsTotal,
      },
      liabilities: {
        current: {
          total: currentLiabilitiesTotal,
          items: currentLiabilities.map((a) => ({
            accountCode: a.accountCode,
            accountName: a.accountName,
            balance: Math.abs(a.netBalance),
          })),
        },
        nonCurrent: {
          total: nonCurrentLiabilitiesTotal,
          items: nonCurrentLiabilities.map((a) => ({
            accountCode: a.accountCode,
            accountName: a.accountName,
            balance: Math.abs(a.netBalance),
          })),
        },
        total: liabilitiesTotal,
      },
      equity: {
        total: equityTotal,
        items: equityAccounts.map((a) => ({
          accountCode: a.accountCode,
          accountName: a.accountName,
          balance: a.netBalance > 0 ? a.netBalance : 0,
        })),
      },
      totalLiabilitiesAndEquity: liabilitiesTotal + equityTotal,
      currency: trialBalance.accounts[0]?.currency || "SAR",
    };
  }

  /**
   * Generate Cash Flow Statement
   */
  async generateCashFlowStatement(
    tenantId: string,
    period: { startDate: Date | string; endDate: Date | string },
  ): Promise<CashFlowStatement> {
    // Get P&L for net income
    const pl = await this.generateProfitLossStatement(tenantId, period);

    // Get AR aging for changes in working capital
    const arAging = await accountsReceivableService.getARAgingReport(tenantId);
    const apAging = await accountsPayableService.getAPAgingReport(tenantId);

    // Get cash balance at start and end
    const startPeriod = {
      startDate: new Date(2000, 0, 1).toISOString(),
      endDate: period.startDate,
    };
    const endPeriod = {
      startDate: new Date(2000, 0, 1).toISOString(),
      endDate: period.endDate,
    };

    const startCashBalance = await generalLedgerService.getAccountBalance(
      "1000",
      startPeriod,
      tenantId,
    );
    const endCashBalance = await generalLedgerService.getAccountBalance(
      "1000",
      endPeriod,
      tenantId,
    );

    // Calculate changes in working capital
    const changesInAR = arAging.total; // Simplified - would need previous period comparison
    const changesInAP = apAging.total; // Simplified

    // Operating activities
    const netCashFromOperations = pl.netIncome - changesInAR + changesInAP;

    // Investing activities (simplified - would need asset transactions)
    const investingItems: Array<{ description: string; amount: number }> = [];
    const netCashFromInvesting = investingItems.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    // Financing activities (simplified - would need equity/debt transactions)
    const financingItems: Array<{ description: string; amount: number }> = [];
    const netCashFromFinancing = financingItems.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    const netChangeInCash =
      netCashFromOperations + netCashFromInvesting + netCashFromFinancing;

    return {
      period,
      operatingActivities: {
        netIncome: pl.netIncome,
        adjustments: [],
        changesInWorkingCapital: {
          accountsReceivable: -changesInAR,
          accountsPayable: changesInAP,
          inventory: 0,
          other: 0,
        },
        netCashFromOperations,
      },
      investingActivities: {
        items: investingItems,
        netCashFromInvesting,
      },
      financingActivities: {
        items: financingItems,
        netCashFromFinancing,
      },
      netChangeInCash,
      beginningCash: startCashBalance.netBalance,
      endingCash: endCashBalance.netBalance,
      currency: "SAR",
    };
  }

  /**
   * Generate Trial Balance
   */
  async generateTrialBalance(
    tenantId: string,
    period: { startDate: Date | string; endDate: Date | string },
  ) {
    return await generalLedgerService.getTrialBalance(period, tenantId);
  }

  /**
   * Generate Aging Reports
   */
  async generateAgingReports(tenantId: string) {
    const arAging = await accountsReceivableService.getARAgingReport(tenantId);
    const apAging = await accountsPayableService.getAPAgingReport(tenantId);

    return {
      accountsReceivable: arAging,
      accountsPayable: apAging,
    };
  }

  /**
   * Export financial report
   */
  async exportReport(
    report: FinancialReport,
    format: "PDF" | "EXCEL" | "CSV" | "JSON",
  ): Promise<Blob | string> {
    return await exportService.exportData(report.data, format, report.name);
  }

  /**
   * Generate custom report
   */
  async generateCustomReport(
    tenantId: string,
    config: {
      reportType: "GL" | "AP" | "AR" | "BUDGET" | "COST";
      period: { startDate: Date | string; endDate: Date | string };
      filters?: Record<string, any>;
      columns?: string[];
    },
  ): Promise<FinancialReport> {
    let data: any;

    switch (config.reportType) {
      case "GL":
        data = await generalLedgerService.getGLEntries({
          tenantId,
          startDate: config.period.startDate,
          endDate: config.period.endDate,
          ...config.filters,
        });
        break;
      case "AP":
        data = await accountsPayableService.getAPRecords({
          tenantId,
          startDate: config.period.startDate,
          endDate: config.period.endDate,
          ...config.filters,
        });
        break;
      case "AR":
        data = await accountsReceivableService.getARRecords({
          tenantId,
          startDate: config.period.startDate,
          endDate: config.period.endDate,
          ...config.filters,
        });
        break;
      default:
        data = {};
    }

    return {
      id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId,
      reportType: "CUSTOM",
      name: `Custom ${config.reportType} Report`,
      period: config.period,
      data,
      format: "JSON",
      generatedAt: new Date().toISOString(),
      generatedBy: "system",
    };
  }
}

export const financialReportingService = new FinancialReportingService();
