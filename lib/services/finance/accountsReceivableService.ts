/**
 * Accounts Receivable Service
 * Manages customer invoices and payments
 * REUSES existing invoice services from Marketplace and WMS (NO DUPLICATION)
 */

import { eventBus } from "@/lib/services/event-store";
import { generalLedgerService } from "./generalLedgerService";
import type { AccountsReceivable } from "@/types/finance";

// ============================================================================
// SERVICE
// ============================================================================

class AccountsReceivableService {
  private arRecords: Map<string, AccountsReceivable> = new Map();

  /**
   * Initialize event handlers to listen to customer invoice events
   */
  initializeEventHandlers(): void {
    // Subscribe to Marketplace invoice events (customer invoices)
    eventBus.subscribe("marketplace.invoice.created", async (event: any) => {
      // Only process if it's a customer invoice (customer → provider)
      if (event.payload.customerId && !event.payload.providerId) {
        await this.handleCustomerInvoice(event, "MARKETPLACE");
      }
    });

    // Subscribe to WMS sales order events (for AR creation)
    eventBus.subscribe("wms.sales-order.created", async (event: any) => {
      await this.handleSalesOrder(event);
    });

    // Subscribe to payment events to update AR status
    eventBus.subscribe("marketplace.payment.processed", async (event: any) => {
      await this.handlePayment(event, "MARKETPLACE");
    });

    // Subscribe to WMS payment events (if exists)
    eventBus.subscribe("wms.payment.received", async (event: any) => {
      await this.handlePayment(event, "WMS");
    });
  }

  /**
   * Handle customer invoice from Marketplace
   * REUSES existing invoice data (no duplication)
   */
  private async handleCustomerInvoice(
    event: any,
    source: "MARKETPLACE",
  ): Promise<void> {
    try {
      const invoiceId = event.payload.invoiceId || event.payload.id;
      const customerId = event.payload.customerId;
      const customerName = event.payload.customerName || "Unknown Customer";

      // Check if AR record already exists
      const existing = Array.from(this.arRecords.values()).find(
        (ar) => ar.invoiceId === invoiceId && ar.invoiceSource === source,
      );

      if (existing) {
        return; // Already processed
      }

      // Create AR record (references source invoice, doesn't duplicate)
      const arRecord: AccountsReceivable = {
        id: `ar-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        tenantId: event.payload.tenantId || "",
        customerId,
        customerName,
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
        receivedAmount: 0,
        outstandingAmount: event.payload.total || event.payload.amount || 0,
        status: "PENDING",
        paymentTerms: event.payload.paymentTerms || "NET_30",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.arRecords.set(arRecord.id, arRecord);

      // Create GL entry
      const glEntry = await generalLedgerService.createGLEntry({
        tenantId: arRecord.tenantId,
        entryDate: arRecord.invoiceDate,
        description: `Accounts Receivable - ${arRecord.invoiceNumber}`,
        debitAccount: "1100", // Accounts Receivable
        creditAccount: "4000", // Revenue
        amount: arRecord.amount,
        currency: arRecord.currency,
        referenceType: "INVOICE",
        referenceId: invoiceId,
        createdBy: "system",
      });

      arRecord.glEntryId = glEntry.id;
      this.arRecords.set(arRecord.id, arRecord);

      // Publish AR event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "finance.accounts-receivable.created",
        aggregateId: arRecord.id,
        aggregateType: "accounts_receivable",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: arRecord,
      });
    } catch (error) {
      console.error(`Error handling ${source} customer invoice:`, error);
    }
  }

  /**
   * Handle sales order from WMS (create AR)
   */
  private async handleSalesOrder(event: any): Promise<void> {
    try {
      const salesOrderId = event.payload.id || event.payload.salesOrderId;
      const customerId = event.payload.customerId;
      const customerName = event.payload.customerName || "Unknown Customer";
      const amount = event.payload.totalAmount || event.payload.amount || 0;

      // Check if AR record already exists
      const existing = Array.from(this.arRecords.values()).find(
        (ar) =>
          ar.invoiceSource === "SALES_ORDER" && ar.referenceId === salesOrderId,
      );

      if (existing) {
        return; // Already processed
      }

      // Create AR record from sales order
      const arRecord: AccountsReceivable = {
        id: `ar-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        tenantId: event.payload.tenantId || "",
        customerId,
        customerName,
        invoiceId: `so-${salesOrderId}`,
        invoiceSource: "SALES_ORDER",
        invoiceNumber: `SO-${salesOrderId}`,
        invoiceDate: event.payload.orderDate || new Date().toISOString(),
        dueDate: this.calculateDueDate(
          event.payload.orderDate || new Date().toISOString(),
          30,
        ),
        amount,
        currency: event.payload.currency || "SAR",
        receivedAmount: 0,
        outstandingAmount: amount,
        status: "PENDING",
        paymentTerms: "NET_30",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.arRecords.set(arRecord.id, arRecord);

      // Create GL entry
      const glEntry = await generalLedgerService.createGLEntry({
        tenantId: arRecord.tenantId,
        entryDate: arRecord.invoiceDate,
        description: `Accounts Receivable - ${arRecord.invoiceNumber}`,
        debitAccount: "1100", // Accounts Receivable
        creditAccount: "4000", // Revenue
        amount: arRecord.amount,
        currency: arRecord.currency,
        referenceType: "SALES_ORDER",
        referenceId: salesOrderId,
        createdBy: "system",
      });

      arRecord.glEntryId = glEntry.id;
      this.arRecords.set(arRecord.id, arRecord);

      // Publish AR event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "finance.accounts-receivable.created",
        aggregateId: arRecord.id,
        aggregateType: "accounts_receivable",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: arRecord,
      });
    } catch (error) {
      console.error("Error handling sales order:", error);
    }
  }

  /**
   * Handle payment to update AR status
   */
  private async handlePayment(
    event: any,
    source: "MARKETPLACE" | "WMS",
  ): Promise<void> {
    try {
      const invoiceId = event.payload.invoiceId || event.payload.bookingId;
      const paymentAmount = event.payload.amount || 0;

      // Find AR record
      const arRecord = Array.from(this.arRecords.values()).find(
        (ar) =>
          (ar.invoiceId === invoiceId || ar.invoiceId.includes(invoiceId)) &&
          (ar.invoiceSource === source ||
            (source === "MARKETPLACE" && ar.invoiceSource === "MARKETPLACE")),
      );

      if (!arRecord) {
        return; // AR record not found
      }

      // Update payment
      arRecord.receivedAmount += paymentAmount;
      arRecord.outstandingAmount = arRecord.amount - arRecord.receivedAmount;

      // Update status
      if (arRecord.outstandingAmount <= 0) {
        arRecord.status = "PAID";
      } else if (arRecord.receivedAmount > 0) {
        arRecord.status = "PARTIAL";
      }

      // Check if overdue
      if (
        new Date() > new Date(arRecord.dueDate) &&
        arRecord.status !== "PAID"
      ) {
        arRecord.status = "OVERDUE";
      }

      arRecord.updatedAt = new Date().toISOString();
      this.arRecords.set(arRecord.id, arRecord);

      // Publish AR update event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "finance.accounts-receivable.updated",
        aggregateId: arRecord.id,
        aggregateType: "accounts_receivable",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: arRecord,
      });
    } catch (error) {
      console.error(`Error handling ${source} payment:`, error);
    }
  }

  /**
   * Get AR records
   */
  async getARRecords(filters: {
    tenantId: string;
    customerId?: string;
    status?: AccountsReceivable["status"];
    invoiceSource?: AccountsReceivable["invoiceSource"];
    startDate?: Date | string;
    endDate?: Date | string;
  }): Promise<AccountsReceivable[]> {
    let records = Array.from(this.arRecords.values()).filter(
      (ar) => ar.tenantId === filters.tenantId,
    );

    if (filters.customerId) {
      records = records.filter((ar) => ar.customerId === filters.customerId);
    }

    if (filters.status) {
      records = records.filter((ar) => ar.status === filters.status);
    }

    if (filters.invoiceSource) {
      records = records.filter(
        (ar) => ar.invoiceSource === filters.invoiceSource,
      );
    }

    if (filters.startDate) {
      records = records.filter(
        (ar) => new Date(ar.invoiceDate) >= new Date(filters.startDate!),
      );
    }

    if (filters.endDate) {
      records = records.filter(
        (ar) => new Date(ar.invoiceDate) <= new Date(filters.endDate!),
      );
    }

    return records.sort(
      (a, b) =>
        new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime(),
    );
  }

  /**
   * Get AR aging report
   */
  async getARAgingReport(tenantId: string): Promise<{
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
    total: number;
  }> {
    const records = Array.from(this.arRecords.values()).filter(
      (ar) =>
        ar.tenantId === tenantId &&
        ar.status !== "PAID" &&
        ar.status !== "WRITTEN_OFF",
    );

    const now = new Date();
    let current = 0;
    let days30 = 0;
    let days60 = 0;
    let days90 = 0;
    let over90 = 0;

    records.forEach((ar) => {
      const daysPastDue = Math.floor(
        (now.getTime() - new Date(ar.dueDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const amount = ar.outstandingAmount;

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
   * Calculate due date
   */
  private calculateDueDate(invoiceDate: Date | string, days: number): string {
    const date = new Date(invoiceDate);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  /**
   * Manually create AR record (for manual invoices)
   */
  async createManualARRecord(input: {
    tenantId: string;
    customerId: string;
    customerName: string;
    invoiceNumber: string;
    invoiceDate: Date | string;
    dueDate: Date | string;
    amount: number;
    currency: string;
    paymentTerms?: string;
    createdBy: string;
  }): Promise<AccountsReceivable> {
    const arRecord: AccountsReceivable = {
      id: `ar-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId: input.tenantId,
      customerId: input.customerId,
      customerName: input.customerName,
      invoiceId: `manual-${Date.now()}`,
      invoiceSource: "MANUAL",
      invoiceNumber: input.invoiceNumber,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      amount: input.amount,
      currency: input.currency,
      receivedAmount: 0,
      outstandingAmount: input.amount,
      status: "PENDING",
      paymentTerms: input.paymentTerms || "NET_30",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.arRecords.set(arRecord.id, arRecord);

    // Create GL entry
    const glEntry = await generalLedgerService.createGLEntry({
      tenantId: arRecord.tenantId,
      entryDate: arRecord.invoiceDate,
      description: `Accounts Receivable - ${arRecord.invoiceNumber}`,
      debitAccount: "1100", // Accounts Receivable
      creditAccount: "4000", // Revenue
      amount: arRecord.amount,
      currency: arRecord.currency,
      referenceType: "INVOICE",
      referenceId: arRecord.invoiceId,
      createdBy: input.createdBy,
    });

    arRecord.glEntryId = glEntry.id;
    this.arRecords.set(arRecord.id, arRecord);

    return arRecord;
  }
}

export const accountsReceivableService = new AccountsReceivableService();

// Initialize event handlers on service creation
if (typeof window === "undefined") {
  accountsReceivableService.initializeEventHandlers();
}
