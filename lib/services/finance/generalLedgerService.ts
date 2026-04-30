/**
 * General Ledger Service
 * Core GL functionality - Journal entries, account balances, trial balance
 * Integrates with all financial modules (Marketplace, Transportation, Facility)
 */

import { eventBus } from "@/lib/services/event-store";
import { notificationService } from "@/lib/services/notifications/notificationService";
import type {
  GeneralLedgerEntry,
  ChartOfAccounts,
  FinancialPeriod,
} from "@/types/finance";

// ============================================================================
// TYPES
// ============================================================================

export interface JournalEntry {
  id: string;
  tenantId: string;
  entryNumber: string;
  entryDate: Date | string;
  description: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  currency: string;
  status: "DRAFT" | "POSTED" | "REVERSED";
  referenceType?: string;
  referenceId?: string;
  postedBy?: string;
  postedAt?: Date | string;
  createdAt: Date | string;
  createdBy: string;
}

export interface JournalEntryLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface AccountBalance {
  accountCode: string;
  accountName: string;
  accountType: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  debitBalance: number;
  creditBalance: number;
  netBalance: number;
  currency: string;
  period: {
    startDate: Date | string;
    endDate: Date | string;
  };
}

export interface TrialBalance {
  period: {
    startDate: Date | string;
    endDate: Date | string;
  };
  accounts: AccountBalance[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  generatedAt: Date | string;
}

// ============================================================================
// SERVICE
// ============================================================================

class GeneralLedgerService {
  private glEntries: Map<string, GeneralLedgerEntry> = new Map();
  private chartOfAccounts: Map<string, ChartOfAccounts> = new Map();
  private financialPeriods: Map<string, FinancialPeriod> = new Map();
  private journalEntries: Map<string, JournalEntry> = new Map();

  /**
   * Initialize event handlers to listen to financial events from all modules
   */
  initializeEventHandlers(): void {
    // Subscribe to Marketplace payment events
    eventBus.subscribe("marketplace.payment.processed", async (event: any) => {
      await this.handlePaymentEvent(event, "MARKETPLACE");
    });

    // Subscribe to Transportation payment events
    eventBus.subscribe(
      "transportation.payment.processed",
      async (event: any) => {
        await this.handlePaymentEvent(event, "TRANSPORTATION");
      },
    );

    // Subscribe to Facility utility bill payment events
    eventBus.subscribe("facility.utility-bill.paid", async (event: any) => {
      await this.handlePaymentEvent(event, "FACILITY");
    });

    // Subscribe to invoice events
    eventBus.subscribe("marketplace.invoice.created", async (event: any) => {
      await this.handleInvoiceEvent(event, "MARKETPLACE");
    });

    // Subscribe to HR payroll events (if exists)
    eventBus.subscribe("hr.payroll.processed", async (event: any) => {
      await this.handlePayrollEvent(event);
    });
  }

  /**
   * Handle payment event from any module
   */
  private async handlePaymentEvent(
    event: any,
    source: "MARKETPLACE" | "TRANSPORTATION" | "FACILITY",
  ): Promise<void> {
    try {
      const glEntry = await this.createGLEntry({
        tenantId: event.payload.tenantId || "",
        entryDate: new Date().toISOString(),
        description: `Payment from ${source}`,
        debitAccount: this.getAccountCode("CASH", source),
        creditAccount: this.getAccountCode("ACCOUNTS_PAYABLE", source),
        amount: event.payload.amount || 0,
        currency: event.payload.currency || "SAR",
        referenceType: "PAYMENT",
        referenceId: event.payload.paymentId || event.payload.id,
        createdBy: "system",
      });

      // Publish finance event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "finance.gl.entry.created",
        aggregateId: glEntry.id,
        aggregateType: "gl_entry",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: glEntry,
      });
    } catch (error) {
      console.error(`Error handling ${source} payment event:`, error);
    }
  }

  /**
   * Handle invoice event
   */
  private async handleInvoiceEvent(
    event: any,
    source: "MARKETPLACE" | "TRANSPORTATION" | "FACILITY",
  ): Promise<void> {
    try {
      // Create AR entry for customer invoices
      if (event.payload.customerId) {
        const glEntry = await this.createGLEntry({
          tenantId: event.payload.tenantId || "",
          entryDate: new Date().toISOString(),
          description: `Invoice from ${source}`,
          debitAccount: this.getAccountCode("ACCOUNTS_RECEIVABLE", source),
          creditAccount: this.getAccountCode("REVENUE", source),
          amount: event.payload.amount || 0,
          currency: event.payload.currency || "SAR",
          referenceType: "INVOICE",
          referenceId: event.payload.invoiceId || event.payload.id,
          createdBy: "system",
        });

        await eventBus.publish({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "finance.gl.entry.created",
          aggregateId: glEntry.id,
          aggregateType: "gl_entry",
          version: 1,
          timestamp: new Date().toISOString(),
          payload: glEntry,
        });
      }
    } catch (error) {
      console.error(`Error handling ${source} invoice event:`, error);
    }
  }

  /**
   * Handle payroll event
   */
  private async handlePayrollEvent(event: any): Promise<void> {
    try {
      const glEntry = await this.createGLEntry({
        tenantId: event.payload.tenantId || "",
        entryDate: new Date().toISOString(),
        description: "Payroll payment",
        debitAccount: this.getAccountCode("PAYROLL_EXPENSE", "HR"),
        creditAccount: this.getAccountCode("CASH", "HR"),
        amount: event.payload.totalAmount || 0,
        currency: event.payload.currency || "SAR",
        referenceType: "PAYROLL",
        referenceId: event.payload.payrollId || event.payload.id,
        createdBy: "system",
      });

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "finance.gl.entry.created",
        aggregateId: glEntry.id,
        aggregateType: "gl_entry",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: glEntry,
      });
    } catch (error) {
      console.error("Error handling payroll event:", error);
    }
  }

  /**
   * Create GL entry
   */
  async createGLEntry(input: {
    tenantId: string;
    entryDate: Date | string;
    description: string;
    debitAccount: string;
    creditAccount: string;
    amount: number;
    currency: string;
    referenceType?: string;
    referenceId?: string;
    createdBy: string;
  }): Promise<GeneralLedgerEntry> {
    const entry: GeneralLedgerEntry = {
      id: `gl-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId: input.tenantId,
      entryNumber: this.generateEntryNumber(),
      entryDate: input.entryDate,
      journalEntryType: "AUTOMATIC",
      description: input.description,
      debitAccount: input.debitAccount,
      creditAccount: input.creditAccount,
      amount: input.amount,
      currency: input.currency,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      status: "POSTED", // Auto-post for automatic entries
      postedBy: input.createdBy,
      postedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy,
    };

    this.glEntries.set(entry.id, entry);

    return entry;
  }

  /**
   * Create journal entry (manual entry)
   */
  async createJournalEntry(input: {
    tenantId: string;
    entryDate: Date | string;
    description: string;
    lines: JournalEntryLine[];
    currency: string;
    createdBy: string;
  }): Promise<JournalEntry> {
    // Validate: Total debits must equal total credits
    const totalDebit = input.lines.reduce(
      (sum, line) => sum + (line.debit || 0),
      0,
    );
    const totalCredit = input.lines.reduce(
      (sum, line) => sum + (line.credit || 0),
      0,
    );

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        "Journal entry must balance: Total debits must equal total credits",
      );
    }

    const entry: JournalEntry = {
      id: `je-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId: input.tenantId,
      entryNumber: this.generateEntryNumber(),
      entryDate: input.entryDate,
      description: input.description,
      lines: input.lines,
      totalDebit,
      totalCredit,
      currency: input.currency,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy,
    };

    this.journalEntries.set(entry.id, entry);

    return entry;
  }

  /**
   * Post journal entry to GL
   */
  async postJournalEntry(
    journalEntryId: string,
    postedBy: string,
  ): Promise<GeneralLedgerEntry[]> {
    const journalEntry = this.journalEntries.get(journalEntryId);
    if (!journalEntry) {
      throw new Error(`Journal entry ${journalEntryId} not found`);
    }

    if (journalEntry.status !== "DRAFT") {
      throw new Error(`Journal entry ${journalEntryId} is already posted`);
    }

    const glEntries: GeneralLedgerEntry[] = [];

    // Create GL entry for each line
    for (const line of journalEntry.lines) {
      const glEntry = await this.createGLEntry({
        tenantId: journalEntry.tenantId,
        entryDate: journalEntry.entryDate,
        description: `${journalEntry.description} - ${line.description || ""}`,
        debitAccount:
          line.debit > 0
            ? line.accountCode
            : journalEntry.lines.find((l) => l.credit > 0)?.accountCode || "",
        creditAccount:
          line.credit > 0
            ? line.accountCode
            : journalEntry.lines.find((l) => l.debit > 0)?.accountCode || "",
        amount: line.debit || line.credit,
        currency: journalEntry.currency,
        referenceType: "JOURNAL_ENTRY",
        referenceId: journalEntryId,
        createdBy: postedBy,
      });

      glEntries.push(glEntry);
    }

    // Update journal entry status
    journalEntry.status = "POSTED";
    journalEntry.postedBy = postedBy;
    journalEntry.postedAt = new Date().toISOString();
    this.journalEntries.set(journalEntryId, journalEntry);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "finance.journal-entry.posted",
      aggregateId: journalEntryId,
      aggregateType: "journal_entry",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { journalEntryId, glEntries },
    });

    return glEntries;
  }

  /**
   * Get account balance
   */
  async getAccountBalance(
    accountCode: string,
    period: { startDate: Date | string; endDate: Date | string },
    tenantId: string,
  ): Promise<AccountBalance> {
    const entries = Array.from(this.glEntries.values()).filter(
      (e) =>
        e.tenantId === tenantId &&
        (e.debitAccount === accountCode || e.creditAccount === accountCode) &&
        new Date(e.entryDate) >= new Date(period.startDate) &&
        new Date(e.entryDate) <= new Date(period.endDate),
    );

    let debitBalance = 0;
    let creditBalance = 0;

    entries.forEach((entry) => {
      if (entry.debitAccount === accountCode) {
        debitBalance += entry.amount;
      }
      if (entry.creditAccount === accountCode) {
        creditBalance += entry.amount;
      }
    });

    const account = this.chartOfAccounts.get(accountCode);
    const accountType = account?.accountType || "ASSET";

    // Calculate net balance based on account type
    let netBalance = 0;
    if (accountType === "ASSET" || accountType === "EXPENSE") {
      netBalance = debitBalance - creditBalance;
    } else {
      netBalance = creditBalance - debitBalance;
    }

    return {
      accountCode,
      accountName: account?.accountName || accountCode,
      accountType,
      debitBalance,
      creditBalance,
      netBalance,
      currency: entries[0]?.currency || "SAR",
      period,
    };
  }

  /**
   * Get trial balance
   */
  async getTrialBalance(
    period: { startDate: Date | string; endDate: Date | string },
    tenantId: string,
  ): Promise<TrialBalance> {
    const accounts = Array.from(this.chartOfAccounts.values()).filter(
      (a) => a.tenantId === tenantId && a.isActive,
    );
    const accountBalances: AccountBalance[] = [];

    for (const account of accounts) {
      const balance = await this.getAccountBalance(
        account.accountCode,
        period,
        tenantId,
      );
      accountBalances.push(balance);
    }

    const totalDebits = accountBalances.reduce(
      (sum, b) => sum + b.debitBalance,
      0,
    );
    const totalCredits = accountBalances.reduce(
      (sum, b) => sum + b.creditBalance,
      0,
    );
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    return {
      period,
      accounts: accountBalances,
      totalDebits,
      totalCredits,
      isBalanced,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get GL entries
   */
  async getGLEntries(filters: {
    tenantId: string;
    accountCode?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    status?: GeneralLedgerEntry["status"];
  }): Promise<GeneralLedgerEntry[]> {
    let entries = Array.from(this.glEntries.values()).filter(
      (e) => e.tenantId === filters.tenantId,
    );

    if (filters.accountCode) {
      entries = entries.filter(
        (e) =>
          e.debitAccount === filters.accountCode ||
          e.creditAccount === filters.accountCode,
      );
    }

    if (filters.startDate) {
      entries = entries.filter(
        (e) => new Date(e.entryDate) >= new Date(filters.startDate!),
      );
    }

    if (filters.endDate) {
      entries = entries.filter(
        (e) => new Date(e.entryDate) <= new Date(filters.endDate!),
      );
    }

    if (filters.status) {
      entries = entries.filter((e) => e.status === filters.status);
    }

    return entries.sort(
      (a, b) =>
        new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime(),
    );
  }

  /**
   * Initialize chart of accounts (default accounts)
   */
  async initializeChartOfAccounts(tenantId: string): Promise<void> {
    const defaultAccounts: Omit<ChartOfAccounts, "id" | "createdAt">[] = [
      // Assets
      {
        tenantId,
        accountCode: "1000",
        accountName: "Cash",
        accountType: "ASSET",
        level: 1,
        isActive: true,
        currency: "SAR",
      },
      {
        tenantId,
        accountCode: "1100",
        accountName: "Accounts Receivable",
        accountType: "ASSET",
        level: 1,
        isActive: true,
        currency: "SAR",
      },
      {
        tenantId,
        accountCode: "1200",
        accountName: "Inventory",
        accountType: "ASSET",
        level: 1,
        isActive: true,
        currency: "SAR",
      },

      // Liabilities
      {
        tenantId,
        accountCode: "2000",
        accountName: "Accounts Payable",
        accountType: "LIABILITY",
        level: 1,
        isActive: true,
        currency: "SAR",
      },

      // Equity
      {
        tenantId,
        accountCode: "3000",
        accountName: "Equity",
        accountType: "EQUITY",
        level: 1,
        isActive: true,
        currency: "SAR",
      },

      // Revenue
      {
        tenantId,
        accountCode: "4000",
        accountName: "Revenue",
        accountType: "REVENUE",
        level: 1,
        isActive: true,
        currency: "SAR",
      },

      // Expenses
      {
        tenantId,
        accountCode: "5000",
        accountName: "Cost of Goods Sold",
        accountType: "EXPENSE",
        level: 1,
        isActive: true,
        currency: "SAR",
      },
      {
        tenantId,
        accountCode: "6000",
        accountName: "Operating Expenses",
        accountType: "EXPENSE",
        level: 1,
        isActive: true,
        currency: "SAR",
      },
      {
        tenantId,
        accountCode: "6100",
        accountName: "Payroll Expense",
        accountType: "EXPENSE",
        level: 2,
        parentAccountCode: "6000",
        isActive: true,
        currency: "SAR",
      },
      {
        tenantId,
        accountCode: "6200",
        accountName: "Utility Expenses",
        accountType: "EXPENSE",
        level: 2,
        parentAccountCode: "6000",
        isActive: true,
        currency: "SAR",
      },
      {
        tenantId,
        accountCode: "6300",
        accountName: "Freight Expenses",
        accountType: "EXPENSE",
        level: 2,
        parentAccountCode: "6000",
        isActive: true,
        currency: "SAR",
      },
    ];

    for (const account of defaultAccounts) {
      const existing = Array.from(this.chartOfAccounts.values()).find(
        (a) => a.tenantId === tenantId && a.accountCode === account.accountCode,
      );
      if (!existing) {
        this.chartOfAccounts.set(`${tenantId}-${account.accountCode}`, {
          id: `coa-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          ...account,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Get account code based on source and type
   */
  private getAccountCode(
    type:
      | "CASH"
      | "ACCOUNTS_PAYABLE"
      | "ACCOUNTS_RECEIVABLE"
      | "REVENUE"
      | "PAYROLL_EXPENSE",
    source: string,
  ): string {
    // Default account codes (can be configured)
    const accountMap: Record<string, Record<string, string>> = {
      CASH: {
        MARKETPLACE: "1000",
        TRANSPORTATION: "1000",
        FACILITY: "1000",
        HR: "1000",
      },
      ACCOUNTS_PAYABLE: {
        MARKETPLACE: "2001",
        TRANSPORTATION: "2002",
        FACILITY: "2003",
      },
      ACCOUNTS_RECEIVABLE: { MARKETPLACE: "1101", TRANSPORTATION: "1102" },
      REVENUE: { MARKETPLACE: "4001", TRANSPORTATION: "4002" },
      PAYROLL_EXPENSE: { HR: "6100" },
    };

    return accountMap[type]?.[source] || "1000";
  }

  /**
   * Generate entry number
   */
  private generateEntryNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `GL-${year}${month}${day}-${random}`;
  }
}

export const generalLedgerService = new GeneralLedgerService();

// Initialize event handlers on service creation
if (typeof window === "undefined") {
  generalLedgerService.initializeEventHandlers();
}
