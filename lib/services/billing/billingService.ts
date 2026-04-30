/**
 * 💰 COMPREHENSIVE BILLING SERVICE
 * 
 * Main orchestrator for all billing operations
 * Integrates with all billing sub-services
 * 
 * Features:
 * - Subscription lifecycle management
 * - Invoice generation and management
 * - Payment processing
 * - Usage-based billing
 * - Proration handling
 * - Tax calculation
 * - Discount and credit management
 * - Revenue recognition
 * - Dunning management
 * - Billing analytics
 * 
 * BlueDXP Platform - Enterprise-Grade Billing
 */

import { eventBus } from "@/lib/services/event-store";
import { notificationService } from "@/lib/services/notifications/notificationService";
import { invoiceService } from "./invoiceService";
import { paymentService } from "./paymentService";
import { subscriptionService } from "./subscriptionService";
import { usageBillingService } from "./usageBillingService";
import { prorationService } from "./prorationService";
import { taxService } from "./taxService";
import { discountService } from "./discountService";
import { creditService } from "./creditService";
import { revenueRecognitionService } from "./revenueRecognitionService";
import { dunningService } from "./dunningService";
import { billingAnalyticsService } from "./billingAnalyticsService";
import type {
  IBillingService,
  Subscription,
  Invoice,
  Payment,
  UsageBillingCalculation,
  Proration,
  BillingAnalytics,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  GenerateInvoiceInput,
  ProcessPaymentInput,
  RecordUsageInput,
  CalculateProrationInput,
} from "@/types/billing";

// ============================================================================
// BILLING SERVICE
// ============================================================================

class BillingService implements IBillingService {
  /**
   * Initialize billing service
   */
  async initialize(): Promise<void> {
    // Initialize all sub-services
    await this.initializeEventHandlers();
    
    // Start automated processes
    await this.startAutomatedProcesses();
  }

  /**
   * Initialize event handlers
   */
  private async initializeEventHandlers(): Promise<void> {
    // Subscription events
    eventBus.subscribe("subscription.created", async (event: any) => {
      await this.handleSubscriptionCreated(event);
    });

    eventBus.subscribe("subscription.updated", async (event: any) => {
      await this.handleSubscriptionUpdated(event);
    });

    eventBus.subscribe("subscription.canceled", async (event: any) => {
      await this.handleSubscriptionCanceled(event);
    });

    // Invoice events
    eventBus.subscribe("invoice.created", async (event: any) => {
      await this.handleInvoiceCreated(event);
    });

    eventBus.subscribe("invoice.paid", async (event: any) => {
      await this.handleInvoicePaid(event);
    });

    // Payment events
    eventBus.subscribe("payment.succeeded", async (event: any) => {
      await this.handlePaymentSucceeded(event);
    });

    eventBus.subscribe("payment.failed", async (event: any) => {
      await this.handlePaymentFailed(event);
    });

    // Usage events
    eventBus.subscribe("usage.recorded", async (event: any) => {
      await this.handleUsageRecorded(event);
    });
  }

  /**
   * Start automated processes
   */
  private async startAutomatedProcesses(): Promise<void> {
    // Schedule automated invoice generation (runs daily)
    this.scheduleAutomatedInvoiceGeneration();
    
    // Schedule dunning process (runs daily)
    this.scheduleDunningProcess();
    
    // Schedule revenue recognition (runs daily)
    this.scheduleRevenueRecognition();
  }

  // ==========================================================================
  // SUBSCRIPTION MANAGEMENT
  // ==========================================================================

  /**
   * Create subscription
   */
  async createSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
    try {
      // Create subscription
      const subscription = await subscriptionService.createSubscription(input);

      // Generate initial invoice if not trial
      if (!input.trialDays || input.trialDays === 0) {
        await this.generateInitialInvoice(subscription);
      }

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "billing.subscription.created",
        aggregateId: subscription.id,
        aggregateType: "subscription",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: subscription,
      });

      return subscription;
    } catch (error) {
      console.error("[BillingService] Error creating subscription:", error);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    id: string,
    input: UpdateSubscriptionInput
  ): Promise<Subscription> {
    try {
      // Get current subscription
      const currentSubscription = await subscriptionService.getSubscription(id);

      // Calculate proration if plan/quantity changed
      let proration: Proration | null = null;
      if (input.planId || input.quantity !== undefined) {
        proration = await prorationService.calculateProration({
          subscriptionId: id,
          changeType: input.planId ? "plan_change" : "quantity_change",
          fromPlanId: currentSubscription.planId,
          toPlanId: input.planId,
          fromQuantity: currentSubscription.quantity,
          toQuantity: input.quantity,
          effectiveDate: new Date().toISOString(),
        });
      }

      // Update subscription
      const updatedSubscription = await subscriptionService.updateSubscription(
        id,
        input
      );

      // Apply proration if exists
      if (proration) {
        await prorationService.applyProration(proration.id);
      }

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "billing.subscription.updated",
        aggregateId: id,
        aggregateType: "subscription",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: updatedSubscription,
      });

      return updatedSubscription;
    } catch (error) {
      console.error("[BillingService] Error updating subscription:", error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(id: string, reason?: string): Promise<Subscription> {
    try {
      const subscription = await subscriptionService.cancelSubscription(id, reason);

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "billing.subscription.canceled",
        aggregateId: id,
        aggregateType: "subscription",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: subscription,
      });

      return subscription;
    } catch (error) {
      console.error("[BillingService] Error canceling subscription:", error);
      throw error;
    }
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(id: string): Promise<Subscription> {
    try {
      return await subscriptionService.pauseSubscription(id);
    } catch (error) {
      console.error("[BillingService] Error pausing subscription:", error);
      throw error;
    }
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(id: string): Promise<Subscription> {
    try {
      return await subscriptionService.resumeSubscription(id);
    } catch (error) {
      console.error("[BillingService] Error resuming subscription:", error);
      throw error;
    }
  }

  // ==========================================================================
  // INVOICE MANAGEMENT
  // ==========================================================================

  /**
   * Generate invoice
   */
  async generateInvoice(input: GenerateInvoiceInput): Promise<Invoice> {
    try {
      // Generate invoice
      const invoice = await invoiceService.generateInvoice(input);

      // Calculate taxes
      const taxCalculation = await taxService.calculateTax(invoice);
      invoice.taxes = taxCalculation.taxes;
      invoice.taxAmount = taxCalculation.totalTax;
      invoice.total = invoice.subtotal - invoice.discountAmount + invoice.taxAmount;

      // Apply credits if any
      if (input.credits && input.credits.length > 0) {
        const credits = await creditService.getCredits(input.userId);
        const applicableCredits = credits.filter((c) =>
          input.credits!.includes(c.id)
        );
        let creditAmount = 0;
        for (const credit of applicableCredits) {
          const applied = Math.min(credit.balance, invoice.total - creditAmount);
          creditAmount += applied;
          await creditService.applyCredit(credit.id, invoice.id, applied);
        }
        invoice.total = Math.max(0, invoice.total - creditAmount);
        invoice.amountDue = invoice.total - invoice.amountPaid;
      }

      // Apply discounts if any
      if (input.discounts && input.discounts.length > 0) {
        const discounts = await discountService.getDiscounts(input.discounts);
        let discountAmount = 0;
        for (const discount of discounts) {
          const discountValue = await discountService.calculateDiscount(
            discount,
            invoice.subtotal
          );
          discountAmount += discountValue;
        }
        invoice.discountAmount = discountAmount;
        invoice.total = invoice.subtotal - invoice.discountAmount + invoice.taxAmount;
        invoice.amountDue = invoice.total - invoice.amountPaid;
      }

      // Update invoice with final amounts
      await invoiceService.updateInvoice(invoice);

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "billing.invoice.created",
        aggregateId: invoice.id,
        aggregateType: "invoice",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: invoice,
      });

      return invoice;
    } catch (error) {
      console.error("[BillingService] Error generating invoice:", error);
      throw error;
    }
  }

  /**
   * Get invoice
   */
  async getInvoice(id: string): Promise<Invoice> {
    return await invoiceService.getInvoice(id);
  }

  /**
   * Void invoice
   */
  async voidInvoice(id: string, reason?: string): Promise<Invoice> {
    try {
      const invoice = await invoiceService.voidInvoice(id, reason);

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "billing.invoice.voided",
        aggregateId: id,
        aggregateType: "invoice",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: invoice,
      });

      return invoice;
    } catch (error) {
      console.error("[BillingService] Error voiding invoice:", error);
      throw error;
    }
  }

  /**
   * Send invoice
   */
  async sendInvoice(id: string): Promise<void> {
    try {
      await invoiceService.sendInvoice(id);
    } catch (error) {
      console.error("[BillingService] Error sending invoice:", error);
      throw error;
    }
  }

  // ==========================================================================
  // PAYMENT PROCESSING
  // ==========================================================================

  /**
   * Process payment
   */
  async processPayment(input: ProcessPaymentInput): Promise<Payment> {
    try {
      // Process payment
      const payment = await paymentService.processPayment(input);

      // Update invoice status
      if (payment.invoiceId) {
        const invoice = await invoiceService.getInvoice(payment.invoiceId);
        invoice.amountPaid += payment.amount;
        invoice.amountDue = invoice.total - invoice.amountPaid;
        invoice.status =
          invoice.amountDue <= 0 ? "paid" : "partially_paid";
        await invoiceService.updateInvoice(invoice);

        // If fully paid, trigger revenue recognition
        if (invoice.status === "paid") {
          await revenueRecognitionService.recognizeRevenue(invoice.id);
        }
      }

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "billing.payment.succeeded",
        aggregateId: payment.id,
        aggregateType: "payment",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: payment,
      });

      return payment;
    } catch (error) {
      console.error("[BillingService] Error processing payment:", error);
      throw error;
    }
  }

  /**
   * Retry payment
   */
  async retryPayment(paymentId: string): Promise<Payment> {
    try {
      return await paymentService.retryPayment(paymentId);
    } catch (error) {
      console.error("[BillingService] Error retrying payment:", error);
      throw error;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<any> {
    try {
      const refund = await paymentService.refundPayment(paymentId, amount, reason);

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "billing.payment.refunded",
        aggregateId: paymentId,
        aggregateType: "payment",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: refund,
      });

      return refund;
    } catch (error) {
      console.error("[BillingService] Error refunding payment:", error);
      throw error;
    }
  }

  // ==========================================================================
  // USAGE BILLING
  // ==========================================================================

  /**
   * Calculate usage billing
   */
  async calculateUsageBilling(
    subscriptionId: string,
    period: { start: Date; end: Date }
  ): Promise<UsageBillingCalculation> {
    return await usageBillingService.calculateUsageBilling(
      subscriptionId,
      period
    );
  }

  /**
   * Record usage
   */
  async recordUsage(input: RecordUsageInput): Promise<any> {
    try {
      const usageRecord = await usageBillingService.recordUsage(input);

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "billing.usage.recorded",
        aggregateId: usageRecord.id,
        aggregateType: "usage_record",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: usageRecord,
      });

      return usageRecord;
    } catch (error) {
      console.error("[BillingService] Error recording usage:", error);
      throw error;
    }
  }

  // ==========================================================================
  // PRORATION
  // ==========================================================================

  /**
   * Calculate proration
   */
  async calculateProration(
    input: CalculateProrationInput
  ): Promise<Proration> {
    return await prorationService.calculateProration(input);
  }

  /**
   * Apply proration
   */
  async applyProration(prorationId: string): Promise<void> {
    await prorationService.applyProration(prorationId);
  }

  // ==========================================================================
  // ANALYTICS
  // ==========================================================================

  /**
   * Get billing analytics
   */
  async getAnalytics(
    tenantId: string,
    period: { start: Date; end: Date }
  ): Promise<BillingAnalytics> {
    return await billingAnalyticsService.getAnalytics(tenantId, period);
  }

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  private async handleSubscriptionCreated(event: any): Promise<void> {
    // Handle subscription created event
    // Could trigger welcome email, setup tasks, etc.
  }

  private async handleSubscriptionUpdated(event: any): Promise<void> {
    // Handle subscription updated event
  }

  private async handleSubscriptionCanceled(event: any): Promise<void> {
    // Handle subscription canceled event
    // Could trigger cancellation survey, retention offer, etc.
  }

  private async handleInvoiceCreated(event: any): Promise<void> {
    // Auto-send invoice if configured
    const invoice = event.payload;
    if (invoice.autoSend !== false) {
      await this.sendInvoice(invoice.id);
    }
  }

  private async handleInvoicePaid(event: any): Promise<void> {
    // Handle invoice paid event
    // Could trigger thank you email, receipt, etc.
  }

  private async handlePaymentSucceeded(event: any): Promise<void> {
    // Handle payment succeeded event
    // Could trigger confirmation email, receipt, etc.
  }

  private async handlePaymentFailed(event: any): Promise<void> {
    // Handle payment failed event
    // Trigger dunning process
    const payment = event.payload;
    if (payment.invoiceId) {
      await dunningService.handlePaymentFailure(payment.invoiceId);
    }
  }

  private async handleUsageRecorded(event: any): Promise<void> {
    // Handle usage recorded event
    // Could trigger usage alerts, billing updates, etc.
  }

  // ==========================================================================
  // AUTOMATED PROCESSES
  // ==========================================================================

  /**
   * Generate initial invoice for subscription
   */
  private async generateInitialInvoice(
    subscription: Subscription
  ): Promise<void> {
    try {
      await this.generateInvoice({
        tenantId: subscription.tenantId,
        userId: subscription.userId,
        subscriptionId: subscription.id,
        type: "subscription",
        lineItems: [
          {
            description: `${subscription.planName} - ${subscription.billingCycle}`,
            quantity: subscription.quantity,
            unitPrice: subscription.basePrice,
            amount: subscription.basePrice * subscription.quantity,
            type: "subscription",
            period: {
              start: subscription.currentPeriodStart,
              end: subscription.currentPeriodEnd,
            },
          },
        ],
      });
    } catch (error) {
      console.error(
        "[BillingService] Error generating initial invoice:",
        error
      );
    }
  }

  /**
   * Schedule automated invoice generation
   */
  private scheduleAutomatedInvoiceGeneration(): void {
    // Run daily at 2 AM
    // This would typically use a cron job or scheduled task system
    // For now, we'll set up the structure
    setInterval(async () => {
      try {
        await this.processRecurringInvoices();
      } catch (error) {
        console.error(
          "[BillingService] Error in automated invoice generation:",
          error
        );
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Process recurring invoices
   */
  private async processRecurringInvoices(): Promise<void> {
    // Get all active subscriptions due for billing
    const subscriptions = await subscriptionService.getSubscriptionsDueForBilling();

    for (const subscription of subscriptions) {
      try {
        // Generate invoice
        await this.generateInvoice({
          tenantId: subscription.tenantId,
          userId: subscription.userId,
          subscriptionId: subscription.id,
          type: "subscription",
          lineItems: [
            {
              description: `${subscription.planName} - ${subscription.billingCycle}`,
              quantity: subscription.quantity,
              unitPrice: subscription.basePrice,
              amount: subscription.basePrice * subscription.quantity,
              type: "subscription",
              period: {
                start: subscription.currentPeriodStart,
                end: subscription.currentPeriodEnd,
              },
            },
          ],
        });
      } catch (error) {
        console.error(
          `[BillingService] Error generating invoice for subscription ${subscription.id}:`,
          error
        );
      }
    }
  }

  /**
   * Schedule dunning process
   */
  private scheduleDunningProcess(): void {
    // Run daily at 3 AM
    setInterval(async () => {
      try {
        await dunningService.processDunning();
      } catch (error) {
        console.error("[BillingService] Error in dunning process:", error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Schedule revenue recognition
   */
  private scheduleRevenueRecognition(): void {
    // Run daily at 4 AM
    setInterval(async () => {
      try {
        await revenueRecognitionService.processRevenueRecognition();
      } catch (error) {
        console.error(
          "[BillingService] Error in revenue recognition:",
          error
        );
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }
}

// Export singleton instance
export const billingService = new BillingService();

// Initialize on module load (server-side only)
if (typeof window === "undefined") {
  billingService.initialize().catch((error) => {
    console.error("[BillingService] Error initializing:", error);
  });
}
