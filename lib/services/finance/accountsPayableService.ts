/**
 * Accounts Payable Service
 * Manages vendor invoices and payments
 * REUSES existing invoice services from Marketplace, Transportation, and Facility (NO DUPLICATION)
 */

import { eventBus } from "@/lib/services/event-store";
import { generalLedgerService } from "./generalLedgerService";
import type { AccountsPayable } from "@/types/finance";

// ============================================================================
// SERVICE
// ============================================================================

class AccountsPayableService {
  private apRecords: Map<string, AccountsPayable> = new Map();

  /**
   * Initialize event handlers to listen to invoice events from all modules
   */
  initializeEventHandlers(): void {
    // Subscribe to Marketplace invoice events (vendor invoices from providers)
    eventBus.subscribe("marketplace.invoice.created", async (event: any) => {
      // Only process if it's a vendor invoice (provider → customer)
      if (event.payload.providerId && event.payload.customerId) {
        await this.handleVendorInvoice(event, "MARKETPLACE");
      }
    });

    // Subscribe to Transportation invoice events
    eventBus.subscribe("transportation.invoice.created", async (event: any) => {
      await this.handleVendorInvoice(event, "TRANSPORTATION");
    });

    // Subscribe to Facility utility bill events
    eventBus.subscribe("facility.utility-bill.created", async (event: any) => {
      await this.handleVendorInvoice(event, "FACILITY");
    });

    // Subscribe to payment events to update AP status
    eventBus.subscribe("marketplace.payment.processed", async (event: any) => {
      await this.handlePayment(event, "MARKETPLACE");
    });

    eventBus.subscribe(
      "transportation.payment.processed",
      async (event: any) => {
        await this.handlePayment(event, "TRANSPORTATION");
      },
    );

    eventBus.subscribe("facility.utility-bill.paid", async (event: any) => {
      await this.handlePayment(event, "FACILITY");
    });
  }

  /**
   * Handle vendor invoice from any module
   * REUSES existing invoice data (no duplication)
   */
  private async handleVendorInvoice(
    event: any,
    source: "MARKETPLACE" | "TRANSPORTATION" | "FACILITY",
  ): Promise<void> {
    try {
      const invoiceId = event.payload.invoiceId || event.payload.id;
      const vendorId =
        event.payload.providerId ||
        event.payload.vendorId ||
        event.payload.supplierId;
      const vendorName =
        event.payload.providerName ||
        event.payload.vendorName ||
        event.payload.supplierName ||
        "Unknown Vendor";

      // Check if AP record already exists
      const existing = Array.from(this.apRecords.values()).find(
        (ap) => ap.invoiceId === invoiceId && ap.invoiceSource === source,
      );

      if (existing) {
        return; // Already processed
      }

      // Create AP record (references source invoice, doesn't duplicate)
      const apRecord: AccountsPayable = {
        id: `ap-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        tenantId: event.payload.tenantId || "",
        vendorId: vendorId || "",
        vendorName,
        invoiceId,
        invoiceSource: source,
        invoiceNumber: event.payload.invoiceNumber || `INV-${invoiceId}`,
        invoiceDate:
          event.payload.issueDate ||
          event.payload.invoiceDate ||
          new Date().toISOString(),
        dueDate:
          event.payload.dueDate ||
          this.calculateDueDate(
            event.payload.issueDate || new Date().toISOString(),
            30,
          ),
        amount: event.payload.total || event.payload.amount || 0,
        currency: event.payload.currency || "SAR",
        paidAmount: 0,
        outstandingAmount: event.payload.total || event.payload.amount || 0,
        status: "PENDING",
        paymentTerms: event.payload.paymentTerms || "NET_30",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.apRecords.set(apRecord.id, apRecord);

      // Create GL entry
      const glEntry = await generalLedgerService.createGLEntry({
        tenantId: apRecord.tenantId,
        entryDate: apRecord.invoiceDate,
        description: `Accounts Payable - ${apRecord.invoiceNumber}`,
        debitAccount: this.getExpenseAccount(source),
        creditAccount: "2000", // Accounts Payable
        amount: apRecord.amount,
        currency: apRecord.currency,
        referenceType: "INVOICE",
        referenceId: invoiceId,
        createdBy: "system",
      });

      apRecord.glEntryId = glEntry.id;
      this.apRecords.set(apRecord.id, apRecord);

      // Publish AP event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "finance.accounts-payable.created",
        aggregateId: apRecord.id,
        aggregateType: "accounts_payable",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: apRecord,
      });
    } catch (error) {
      console.error(`Error handling ${source} vendor invoice:`, error);
    }
  }

  /**
   * Handle payment to update AP status
   */
  private async handlePayment(
    event: any,
    source: "MARKETPLACE" | "TRANSPORTATION" | "FACILITY",
  ): Promise<void> {
    try {
      const invoiceId = event.payload.invoiceId || event.payload.billId;
      const paymentAmount = event.payload.amount || 0;

      // Find AP record
      const apRecord = Array.from(this.apRecords.values()).find(
        (ap) => ap.invoiceId === invoiceId && ap.invoiceSource === source,
      );

      if (!apRecord) {
        return; // AP record not found (might be customer invoice, not vendor)
      }

      // Update payment
      apRecord.paidAmount += paymentAmount;
      apRecord.outstandingAmount = apRecord.amount - apRecord.paidAmount;

      // Update status
      if (apRecord.outstandingAmount <= 0) {
        apRecord.status = "PAID";
      } else if (apRecord.paidAmount > 0) {
        apRecord.status = "PARTIAL";
      }

      // Check if overdue
      if (
        new Date() > new Date(apRecord.dueDate) &&
        apRecord.status !== "PAID"
      ) {
        apRecord.status = "OVERDUE";
      }

      apRecord.updatedAt = new Date().toISOString();
      this.apRecords.set(apRecord.id, apRecord);

      // Publish AP update event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "finance.accounts-payable.updated",
        aggregateId: apRecord.id,
        aggregateType: "accounts_payable",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: apRecord,
      });
    } catch (error) {
      console.error(`Error handling ${source} payment:`, error);
    }
  }

  /**
   * Get AP records
   */
  async getAPRecords(filters: {
    tenantId: string;
    vendorId?: string;
    status?: AccountsPayable["status"];
    invoiceSource?: AccountsPayable["invoiceSource"];
    startDate?: Date | string;
    endDate?: Date | string;
  }): Promise<AccountsPayable[]> {
    let records = Array.from(this.apRecords.values()).filter(
      (ap) => ap.tenantId === filters.tenantId,
    );

    if (filters.vendorId) {
      records = records.filter((ap) => ap.vendorId === filters.vendorId);
    }

    if (filters.status) {
      records = records.filter((ap) => ap.status === filters.status);
    }

    if (filters.invoiceSource) {
      records = records.filter(
        (ap) => ap.invoiceSource === filters.invoiceSource,
      );
    }

    if (filters.startDate) {
      records = records.filter(
        (ap) => new Date(ap.invoiceDate) >= new Date(filters.startDate!),
      );
    }

    if (filters.endDate) {
      records = records.filter(
        (ap) => new Date(ap.invoiceDate) <= new Date(filters.endDate!),
      );
    }

    return records.sort(
      (a, b) =>
        new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime(),
    );
  }

  /**
   * Get AP aging report
   */
  async getAPAgingReport(tenantId: string): Promise<{
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
    total: number;
  }> {
    const records = Array.from(this.apRecords.values()).filter(
      (ap) =>
        ap.tenantId === tenantId &&
        ap.status !== "PAID" &&
        ap.status !== "CANCELLED",
    );

    const now = new Date();
    let current = 0;
    let days30 = 0;
    let days60 = 0;
    let days90 = 0;
    let over90 = 0;

    records.forEach((ap) => {
      const daysPastDue = Math.floor(
        (now.getTime() - new Date(ap.dueDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const amount = ap.outstandingAmount;

      if (daysPastDue <= 0) {
        current += amount;
      } else if (daysPastDue <= 30) {
        days30 += amount;
      } else if (daysPastDue <= 60) {
        days60 += amount;
      } else if (daysPastDue <= 90) {
        days90 += amount;
      } else {
        over90 += amount;
      }
    });

    return {
      current,
      days30,
      days60,
      days90,
      over90,
      total: current + days30 + days60 + days90 + over90,
    };
  }

  /**
   * Get expense account code based on source
   */
  private getExpenseAccount(
    source: "MARKETPLACE" | "TRANSPORTATION" | "FACILITY",
  ): string {
    const accountMap = {
      MARKETPLACE: "6000", // Operating Expenses
      TRANSPORTATION: "6300", // Freight Expenses
      FACILITY: "6200", // Utility Expenses
    };
    return accountMap[source] || "6000";
  }

  /**
   * Calculate due date
   */
  private calculateDueDate(invoiceDate: Date | string, days: number): string {
    const date = new Date(invoiceDate);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  /**
   * Manually create AP record (for manual invoices)
   */
  async createManualAPRecord(input: {
    tenantId: string;
    vendorId: string;
    vendorName: string;
    invoiceNumber: string;
    invoiceDate: Date | string;
    dueDate: Date | string;
    amount: number;
    currency: string;
    paymentTerms?: string;
    createdBy: string;
  }): Promise<AccountsPayable> {
    const apRecord: AccountsPayable = {
      id: `ap-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId: input.tenantId,
      vendorId: input.vendorId,
      vendorName: input.vendorName,
      invoiceId: `manual-${Date.now()}`,
      invoiceSource: "MANUAL",
      invoiceNumber: input.invoiceNumber,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      amount: input.amount,
      currency: input.currency,
      paidAmount: 0,
      outstandingAmount: input.amount,
      status: "PENDING",
      paymentTerms: input.paymentTerms || "NET_30",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.apRecords.set(apRecord.id, apRecord);

    // Create GL entry
    const glEntry = await generalLedgerService.createGLEntry({
      tenantId: apRecord.tenantId,
      entryDate: apRecord.invoiceDate,
      description: `Accounts Payable - ${apRecord.invoiceNumber}`,
      debitAccount: "6000", // Operating Expenses
      creditAccount: "2000", // Accounts Payable
      amount: apRecord.amount,
      currency: apRecord.currency,
      referenceType: "INVOICE",
      referenceId: apRecord.invoiceId,
      createdBy: input.createdBy,
    });

    apRecord.glEntryId = glEntry.id;
    this.apRecords.set(apRecord.id, apRecord);

    return apRecord;
  }
}

export const accountsPayableService = new AccountsPayableService();

// Initialize event handlers on service creation
if (typeof window === "undefined") {
  accountsPayableService.initializeEventHandlers();
}
