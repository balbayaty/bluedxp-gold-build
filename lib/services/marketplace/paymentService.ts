import { eventBus } from "@/lib/services/event-store";
import { paymentService as billingPaymentService } from "@/lib/services/billing/paymentService";
import type { MarketplaceBooking } from "@/types/marketplace";

export type PaymentMethod =
  | "mada"
  | "visa"
  | "mastercard"
  | "apple_pay"
  | "google_pay"
  | "bank_transfer"
  | "wallet";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled";

export interface Payment {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  gatewayResponse?: any;
  refundAmount?: number;
  refundReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface PaymentIntent {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, any>;
}

class PaymentService {
  private payments: Map<string, Payment> = new Map();
  private paymentIntents: Map<string, PaymentIntent> = new Map();

  /**
   * Create a payment intent for a booking
   */
  async createPaymentIntent(
    bookingId: string,
    amount: number,
    method: PaymentMethod,
    metadata?: Record<string, any>,
  ): Promise<PaymentIntent> {
    const intentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const intent: PaymentIntent = {
      id: intentId,
      bookingId,
      amount,
      currency: "SAR",
      method,
      returnUrl: `/marketplace/bookings/${bookingId}?payment=success`,
      cancelUrl: `/marketplace/bookings/${bookingId}?payment=cancelled`,
      metadata,
    };

    this.paymentIntents.set(intentId, intent);

    await eventBus.publish("marketplace.payment.intent.created", {
      intentId,
      bookingId,
      amount,
      method,
    });

    return intent;
  }

  /**
   * Process a payment
   * INTEGRATED: Now uses comprehensive billing system
   */
  async processPayment(
    intentId: string,
    paymentData: {
      method: PaymentMethod;
      transactionId?: string;
      gatewayResponse?: any;
    },
  ): Promise<Payment> {
    const intent = this.paymentIntents.get(intentId);
    if (!intent) {
      throw new Error("Payment intent not found");
    }

    // Use comprehensive billing payment service
    const billingPayment = await billingPaymentService.processPayment({
      tenantId: intent.metadata?.tenantId || "default-tenant",
      userId: intent.metadata?.customerId || "customer-1",
      invoiceId: intent.metadata?.invoiceId,
      amount: intent.amount,
      currency: intent.currency,
      paymentMethod: paymentData.method,
      paymentMethodId: paymentData.transactionId,
      gateway: "stripe", // Default, can be configured
      gatewayTransactionId: paymentData.transactionId,
      gatewayResponse: paymentData.gatewayResponse,
      metadata: {
        ...intent.metadata,
        marketplace: true,
        bookingId: intent.bookingId,
        providerId: intent.metadata?.providerId,
      },
    });

    // Convert billing payment to marketplace payment format
    const payment: Payment = {
      id: billingPayment.id,
      bookingId: intent.bookingId,
      customerId: billingPayment.userId,
      providerId: intent.metadata?.providerId || "provider-1",
      amount: Number(billingPayment.amount),
      currency: billingPayment.currency,
      method: paymentData.method,
      status: billingPayment.status === "succeeded" ? "completed" : billingPayment.status === "failed" ? "failed" : "processing",
      transactionId: billingPayment.gatewayTransactionId,
      gatewayResponse: billingPayment.gatewayResponse,
      metadata: billingPayment.metadata as any,
      createdAt: billingPayment.createdAt || new Date().toISOString(),
      updatedAt: billingPayment.updatedAt || new Date().toISOString(),
      completedAt: billingPayment.processedAt || undefined,
    };

    // Store in local map for backward compatibility
    this.payments.set(payment.id, payment);

    // Publish events
    await eventBus.publish("marketplace.payment.processing", {
      paymentId: payment.id,
      bookingId: intent.bookingId,
    });

    if (payment.status === "completed") {
      await eventBus.publish("marketplace.payment.completed", {
        paymentId: payment.id,
        bookingId: intent.bookingId,
        amount: payment.amount,
      });
    }

    return payment;
  }

  /**
   * Get payment by ID
   */
  async getPayment(id: string): Promise<Payment | null> {
    return this.payments.get(id) || null;
  }

  /**
   * Get payments for a booking
   */
  async getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (p) => p.bookingId === bookingId,
    );
  }

  /**
   * Get payments for a customer
   */
  async getPaymentsByCustomer(customerId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (p) => p.customerId === customerId,
    );
  }

  /**
   * Refund a payment
   */
  async refundPayment(
    paymentId: string,
    amount: number,
    reason?: string,
  ): Promise<Payment | null> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      return null;
    }

    if (payment.status !== "completed") {
      throw new Error("Only completed payments can be refunded");
    }

    if (amount > payment.amount) {
      throw new Error("Refund amount cannot exceed payment amount");
    }

    const refundedPayment: Payment = {
      ...payment,
      status: "refunded",
      refundAmount: amount,
      refundReason: reason,
      updatedAt: new Date().toISOString(),
    };

    this.payments.set(paymentId, refundedPayment);

    await eventBus.publish("marketplace.payment.refunded", {
      paymentId,
      bookingId: payment.bookingId,
      amount,
      reason,
    });

    return refundedPayment;
  }

  /**
   * Calculate commission for a payment
   */
  async calculateCommission(
    amount: number,
    serviceCategory: string,
  ): Promise<{
    commission: number;
    providerAmount: number;
    platformAmount: number;
  }> {
    // Commission rates by category (can be configured)
    const commissionRates: Record<string, number> = {
      storage: 0.15, // 15%
      crossdocking: 0.12, // 12%
      transportation: 0.1, // 10%
      freight: 0.08, // 8%
      consulting: 0.2, // 20%
      manpower: 0.15, // 15%
      translation: 0.12, // 12%
      default: 0.1, // 10%
    };

    const rate = commissionRates[serviceCategory] || commissionRates.default;
    const commission = amount * rate;
    const providerAmount = amount - commission;
    const platformAmount = commission;

    return {
      commission,
      providerAmount,
      platformAmount,
    };
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(
    providerId?: string,
    customerId?: string,
  ): Promise<{
    totalRevenue: number;
    totalPayments: number;
    completedPayments: number;
    pendingPayments: number;
    refundedPayments: number;
    averagePayment: number;
  }> {
    let payments = Array.from(this.payments.values());

    if (providerId) {
      payments = payments.filter((p) => p.providerId === providerId);
    }

    if (customerId) {
      payments = payments.filter((p) => p.customerId === customerId);
    }

    const totalRevenue = payments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalPayments = payments.length;
    const completedPayments = payments.filter(
      (p) => p.status === "completed",
    ).length;
    const pendingPayments = payments.filter(
      (p) => p.status === "pending" || p.status === "processing",
    ).length;
    const refundedPayments = payments.filter(
      (p) => p.status === "refunded",
    ).length;
    const averagePayment =
      completedPayments > 0 ? totalRevenue / completedPayments : 0;

    return {
      totalRevenue,
      totalPayments,
      completedPayments,
      pendingPayments,
      refundedPayments,
      averagePayment,
    };
  }
}

export const paymentService = new PaymentService();
