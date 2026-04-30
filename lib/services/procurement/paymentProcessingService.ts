/**
 * Payment Processing Service
 * Automated payment scheduling, early payment discounts, payment terms management
 * Deep Finance integration for payment processing
 */

import { eventBus } from "@/lib/services/event-store";
import { invoiceService } from "./invoiceService";
import { financeIntegrationService } from "./integration/financeIntegration";
import type { DomainEvent } from "@/types/cqrs";

export type PaymentTerm =
  | "NET_30"
  | "NET_60"
  | "NET_90"
  | "2_10_NET_30"
  | "CUSTOM";

export interface PaymentSchedule {
  paymentId: string;
  invoiceId: string;
  purchaseOrderId: string;
  vendorId: string;
  amount: number;
  currency: string;
  scheduledDate: Date | string;
  dueDate: Date | string;
  paymentTerm: PaymentTerm;
  earlyPaymentDiscount?: {
    discountPercentage: number;
    discountAmount: number;
    discountDueDate: Date | string;
    eligible: boolean;
  };
  status: "SCHEDULED" | "APPROVED" | "PAID" | "CANCELLED" | "OVERDUE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  approvedBy?: string;
  approvedAt?: Date | string;
  paidAt?: Date | string;
  paymentReference?: string;
}

export interface PaymentTerms {
  vendorId: string;
  defaultTerm: PaymentTerm;
  customTerm?: string;
  earlyPaymentDiscount?: {
    discountPercentage: number;
    days: number; // e.g., 2% if paid within 10 days
  };
  projectSpecificTerms?: Record<string, PaymentTerm>; // projectId -> payment term
  negotiatedTerms?: Array<{
    contractId: string;
    term: PaymentTerm;
    effectiveDate: Date | string;
    expiryDate?: Date | string;
  }>;
}

export class PaymentProcessingService {
  private paymentSchedules: Map<string, PaymentSchedule> = new Map();
  private paymentTerms: Map<string, PaymentTerms> = new Map();

  /**
   * Schedule payment for invoice
   * Auto-schedule based on invoice date and payment terms
   */
  async schedulePayment(
    tenantId: string,
    invoiceId: string,
    paymentTerm?: PaymentTerm,
  ): Promise<PaymentSchedule> {
    const invoice = await invoiceService.getInvoice(invoiceId, tenantId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Get payment terms
    const terms =
      paymentTerm ||
      (await this.getPaymentTerms(tenantId, invoice.vendorId)).defaultTerm;

    // Calculate due date based on payment term
    const invoiceDate = new Date(invoice.invoiceDate);
    const dueDate = this.calculateDueDate(invoiceDate, terms);

    // Check for early payment discount
    const earlyPaymentDiscount = await this.calculateEarlyPaymentDiscount(
      tenantId,
      invoice.vendorId,
      invoice.totalAmount,
      terms,
    );

    const paymentId = `payment-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const schedule: PaymentSchedule = {
      paymentId,
      invoiceId,
      purchaseOrderId: invoice.purchaseOrderId,
      vendorId: invoice.vendorId,
      amount: invoice.totalAmount,
      currency: invoice.currency,
      scheduledDate: new Date().toISOString(),
      dueDate: dueDate.toISOString(),
      paymentTerm: terms,
      earlyPaymentDiscount,
      status: "SCHEDULED",
      priority: this.calculatePriority(
        invoice.totalAmount,
        dueDate,
        earlyPaymentDiscount,
      ),
    };

    this.paymentSchedules.set(paymentId, schedule);

    // Publish event
    await eventBus.publish({
      type: "procurement.payment.scheduled",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        paymentId,
        invoiceId,
        amount: schedule.amount,
        currency: schedule.currency,
        dueDate: schedule.dueDate,
        earlyPaymentDiscount: schedule.earlyPaymentDiscount,
      },
    } as DomainEvent);

    return schedule;
  }

  /**
   * Approve payment
   * Multi-level approval workflow
   */
  async approvePayment(
    tenantId: string,
    paymentId: string,
    approverId: string,
    approvalLevel: number = 1,
  ): Promise<PaymentSchedule> {
    const schedule = this.paymentSchedules.get(paymentId);
    if (!schedule) {
      throw new Error("Payment schedule not found");
    }

    // TODO: Implement multi-level approval logic
    // For now, single approval
    schedule.status = "APPROVED";
    schedule.approvedBy = approverId;
    schedule.approvedAt = new Date().toISOString();

    this.paymentSchedules.set(paymentId, schedule);

    await eventBus.publish({
      type: "procurement.payment.approved",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        paymentId,
        invoiceId: schedule.invoiceId,
        amount: schedule.amount,
        approverId,
      },
    } as DomainEvent);

    return schedule;
  }

  /**
   * Execute payment
   * Process payment through Finance module
   */
  async executePayment(
    tenantId: string,
    paymentId: string,
    paymentReference?: string,
  ): Promise<PaymentSchedule> {
    const schedule = this.paymentSchedules.get(paymentId);
    if (!schedule) {
      throw new Error("Payment schedule not found");
    }

    if (schedule.status !== "APPROVED") {
      throw new Error("Payment must be approved before execution");
    }

    // TODO: Call Finance payment service
    // await financeIntegrationService.processPayment(tenantId, schedule)

    schedule.status = "PAID";
    schedule.paidAt = new Date().toISOString();
    schedule.paymentReference = paymentReference || `PAY-${Date.now()}`;

    this.paymentSchedules.set(paymentId, schedule);

    await eventBus.publish({
      type: "procurement.payment.executed",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        paymentId,
        invoiceId: schedule.invoiceId,
        amount: schedule.amount,
        paymentReference: schedule.paymentReference,
      },
    } as DomainEvent);

    return schedule;
  }

  /**
   * Get payment terms for vendor
   */
  async getPaymentTerms(
    tenantId: string,
    vendorId: string,
  ): Promise<PaymentTerms> {
    let terms = this.paymentTerms.get(`${tenantId}-${vendorId}`);

    if (!terms) {
      // Default terms
      terms = {
        vendorId,
        defaultTerm: "NET_30",
      };
      this.paymentTerms.set(`${tenantId}-${vendorId}`, terms);
    }

    return terms;
  }

  /**
   * Set payment terms for vendor
   */
  async setPaymentTerms(
    tenantId: string,
    vendorId: string,
    terms: Partial<PaymentTerms>,
  ): Promise<PaymentTerms> {
    const existing = await this.getPaymentTerms(tenantId, vendorId);
    const updated: PaymentTerms = { ...existing, ...terms };

    this.paymentTerms.set(`${tenantId}-${vendorId}`, updated);

    return updated;
  }

  /**
   * Calculate early payment discount
   */
  async calculateEarlyPaymentDiscount(
    tenantId: string,
    vendorId: string,
    amount: number,
    paymentTerm: PaymentTerm,
  ): Promise<PaymentSchedule["earlyPaymentDiscount"] | undefined> {
    const terms = await this.getPaymentTerms(tenantId, vendorId);

    if (paymentTerm === "2_10_NET_30" || terms.earlyPaymentDiscount) {
      const discount = terms.earlyPaymentDiscount || {
        discountPercentage: 2,
        days: 10,
      };
      const discountAmount = (amount * discount.discountPercentage) / 100;
      const discountDueDate = new Date();
      discountDueDate.setDate(discountDueDate.getDate() + discount.days);

      return {
        discountPercentage: discount.discountPercentage,
        discountAmount,
        discountDueDate: discountDueDate.toISOString(),
        eligible: true,
      };
    }

    return undefined;
  }

  /**
   * Get payment schedule
   */
  async getPaymentSchedule(
    tenantId: string,
    filters?: {
      vendorId?: string;
      status?: PaymentSchedule["status"];
      dateFrom?: Date | string;
      dateTo?: Date | string;
    },
  ): Promise<PaymentSchedule[]> {
    let results = Array.from(this.paymentSchedules.values());

    if (filters?.vendorId) {
      results = results.filter((p) => p.vendorId === filters.vendorId);
    }

    if (filters?.status) {
      results = results.filter((p) => p.status === filters.status);
    }

    if (filters?.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      results = results.filter((p) => new Date(p.dueDate) >= fromDate);
    }

    if (filters?.dateTo) {
      const toDate = new Date(filters.dateTo);
      results = results.filter((p) => new Date(p.dueDate) <= toDate);
    }

    return results;
  }

  /**
   * Get early payment discount opportunities
   */
  async getEarlyPaymentDiscountOpportunities(
    tenantId: string,
    daysAhead: number = 30,
  ): Promise<
    Array<{
      paymentId: string;
      invoiceId: string;
      vendorId: string;
      amount: number;
      discountAmount: number;
      discountPercentage: number;
      discountDueDate: Date | string;
      potentialSavings: number;
    }>
  > {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    const schedules = await this.getPaymentSchedule({
      status: "SCHEDULED",
      dateTo: cutoffDate.toISOString(),
    });

    return schedules
      .filter((s) => s.earlyPaymentDiscount?.eligible)
      .map((s) => ({
        paymentId: s.paymentId,
        invoiceId: s.invoiceId,
        vendorId: s.vendorId,
        amount: s.amount,
        discountAmount: s.earlyPaymentDiscount!.discountAmount,
        discountPercentage: s.earlyPaymentDiscount!.discountPercentage,
        discountDueDate: s.earlyPaymentDiscount!.discountDueDate,
        potentialSavings: s.earlyPaymentDiscount!.discountAmount,
      }))
      .sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  /**
   * Calculate due date from payment term
   */
  private calculateDueDate(invoiceDate: Date, term: PaymentTerm): Date {
    const dueDate = new Date(invoiceDate);

    switch (term) {
      case "NET_30":
        dueDate.setDate(dueDate.getDate() + 30);
        break;
      case "NET_60":
        dueDate.setDate(dueDate.getDate() + 60);
        break;
      case "NET_90":
        dueDate.setDate(dueDate.getDate() + 90);
        break;
      case "2_10_NET_30":
        dueDate.setDate(dueDate.getDate() + 30);
        break;
      default:
        dueDate.setDate(dueDate.getDate() + 30);
    }

    return dueDate;
  }

  /**
   * Calculate payment priority
   */
  private calculatePriority(
    amount: number,
    dueDate: Date | string,
    earlyPaymentDiscount?: PaymentSchedule["earlyPaymentDiscount"],
  ): PaymentSchedule["priority"] {
    const daysUntilDue = Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Critical if overdue or high-value with discount expiring soon
    if (daysUntilDue < 0) {
      return "CRITICAL";
    }

    if (earlyPaymentDiscount?.eligible) {
      const discountDaysUntilDue = Math.ceil(
        (new Date(earlyPaymentDiscount.discountDueDate).getTime() -
          new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (discountDaysUntilDue <= 3 && amount > 10000) {
        return "HIGH";
      }
    }

    if (amount > 100000) {
      return "HIGH";
    }

    if (daysUntilDue <= 7) {
      return "HIGH";
    }

    if (daysUntilDue <= 14) {
      return "MEDIUM";
    }

    return "LOW";
  }

  /**
   * Initialize payment event subscriptions
   */
  initializePaymentEventSubscriptions(): void {
    // Subscribe to invoice approval events
    eventBus.subscribe(
      "procurement.invoice.approved",
      async (event: DomainEvent) => {
        console.log("Invoice approved, scheduling payment:", event.data);
        // Auto-schedule payment
        const { tenantId, invoiceId } = event.data;
        await this.schedulePayment(tenantId, invoiceId);
      },
    );
  }
}

// Singleton instance
export const paymentProcessingService = new PaymentProcessingService();

// Initialize event subscriptions
paymentProcessingService.initializePaymentEventSubscriptions();
