/**
 * Financial Management Service
 *
 * Freight audit & payment, payment automation, financial analytics,
 * invoice reconciliation
 * Integrates with existing payment and invoice services
 */

import type { Shipment, FreightCharges } from "@/types/tms";
import { freightAuditService } from "./freightAuditService";
import { eventBus } from "@/lib/services/event-store";
import { assertRealInProduction } from "./strictMode";
import { paymentService } from "@/lib/services/marketplace/paymentService";

export interface PaymentRequest {
  invoiceId: string;
  shipmentId: string;
  amount: number;
  currency: string;
  carrierId: string;
  paymentMethod: "ACH" | "WIRE" | "CHECK" | "CREDIT_CARD";
  scheduledDate?: Date | string;
  priority?: "NORMAL" | "URGENT";
}

export interface Payment {
  id: string;
  invoiceId: string;
  shipmentId: string;
  amount: number;
  currency: string;
  carrierId: string;
  paymentMethod: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  scheduledDate?: Date | string;
  processedDate?: Date | string;
  confirmationNumber?: string;
  failureReason?: string;
  createdAt: Date | string;
}

export interface FinancialAnalytics {
  period: { from: Date; to: Date };
  totalSpend: number;
  totalSavings: number;
  averageCostPerShipment: number;
  costByMode: Record<string, number>;
  costByCarrier: Record<string, number>;
  paymentMetrics: {
    totalPayments: number;
    averagePaymentTime: number; // days
    onTimePayments: number;
    latePayments: number;
  };
  trends: {
    spendTrend: "UP" | "DOWN" | "STABLE";
    savingsTrend: "UP" | "DOWN" | "STABLE";
  };
}

export interface InvoiceReconciliation {
  invoiceId: string;
  shipmentId: string;
  status: "PENDING" | "RECONCILED" | "DISCREPANCY" | "RESOLVED";
  discrepancies: {
    type: "AMOUNT" | "DATE" | "SERVICE" | "OTHER";
    description: string;
    expected: any;
    actual: any;
  }[];
  resolvedAt?: Date | string;
  resolvedBy?: string;
}

export class FinancialManagementService {
  private payments: Map<string, Payment> = new Map();
  private reconciliations: Map<string, InvoiceReconciliation> = new Map();

  /**
   * Process payment for invoice
   */
  async processPayment(request: PaymentRequest): Promise<Payment> {
    // 1. Verify invoice is audited and approved
    const invoice = await this.getInvoice(request.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.status !== "APPROVED" && invoice.status !== "AUDITED") {
      throw new Error(
        `Invoice status ${invoice.status} does not allow payment`,
      );
    }

    // 2. Create payment record
    const payment: Payment = {
      id: `payment-${Date.now()}`,
      invoiceId: request.invoiceId,
      shipmentId: request.shipmentId,
      amount: request.amount,
      currency: request.currency,
      carrierId: request.carrierId,
      paymentMethod: request.paymentMethod,
      status: request.scheduledDate ? "PENDING" : "PROCESSING",
      scheduledDate: request.scheduledDate,
      createdAt: new Date().toISOString(),
    };

    this.payments.set(payment.id, payment);

    // 3. Process payment (if not scheduled)
    if (!request.scheduledDate) {
      await this.executePayment(payment);
    } else {
      // Schedule payment
      await this.schedulePayment(payment);
    }

    // 4. Update invoice status
    invoice.status = "PAID";
    await this.updateInvoice(invoice);

    // 5. Publish event
    await eventBus.publish("transportation.payment.processed", {
      paymentId: payment.id,
      invoiceId: request.invoiceId,
      amount: request.amount,
    });

    return payment;
  }

  /**
   * Execute payment
   */
  private async executePayment(payment: Payment): Promise<void> {
    try {
      // Use existing payment service
      const result = await paymentService.processPayment({
        amount: payment.amount,
        currency: payment.currency,
        method: payment.paymentMethod,
        recipientId: payment.carrierId,
        description: `Payment for invoice ${payment.invoiceId}`,
      });

      if (result.success) {
        payment.status = "COMPLETED";
        payment.processedDate = new Date().toISOString();
        payment.confirmationNumber = result.transactionId;
      } else {
        payment.status = "FAILED";
        payment.failureReason = result.error;
      }

      this.payments.set(payment.id, payment);
    } catch (error) {
      payment.status = "FAILED";
      payment.failureReason =
        error instanceof Error ? error.message : "Unknown error";
      this.payments.set(payment.id, payment);
    }
  }

  /**
   * Schedule payment
   */
  private async schedulePayment(payment: Payment): Promise<void> {
    // In production, use job scheduler
    // For now, just store as pending
    payment.status = "PENDING";
    this.payments.set(payment.id, payment);
  }

  /**
   * Reconcile invoice with shipment
   */
  async reconcileInvoice(
    invoiceId: string,
    shipmentId: string,
  ): Promise<InvoiceReconciliation> {
    const invoice = await this.getInvoice(invoiceId);
    const shipment = await this.getShipment(shipmentId);

    if (!invoice || !shipment) {
      throw new Error("Invoice or shipment not found");
    }

    const discrepancies: InvoiceReconciliation["discrepancies"] = [];

    // Compare amounts
    if (invoice.total !== (shipment.freightCharges?.total || 0)) {
      discrepancies.push({
        type: "AMOUNT",
        description: `Invoice total ${invoice.total} does not match shipment total ${shipment.freightCharges?.total || 0}`,
        expected: shipment.freightCharges?.total || 0,
        actual: invoice.total,
      });
    }

    // Compare dates
    const invoiceDate = new Date(invoice.invoiceDate);
    const shipmentDate = shipment.actualDelivery
      ? new Date(shipment.actualDelivery)
      : null;
    if (
      shipmentDate &&
      Math.abs(invoiceDate.getTime() - shipmentDate.getTime()) >
        7 * 24 * 60 * 60 * 1000
    ) {
      discrepancies.push({
        type: "DATE",
        description: "Invoice date significantly different from delivery date",
        expected: shipmentDate.toISOString(),
        actual: invoiceDate.toISOString(),
      });
    }

    // Compare services
    if (invoice.carrierId !== shipment.carrierId) {
      discrepancies.push({
        type: "SERVICE",
        description: "Carrier mismatch",
        expected: shipment.carrierId,
        actual: invoice.carrierId,
      });
    }

    const reconciliation: InvoiceReconciliation = {
      invoiceId,
      shipmentId,
      status: discrepancies.length === 0 ? "RECONCILED" : "DISCREPANCY",
      discrepancies,
    };

    this.reconciliations.set(invoiceId, reconciliation);

    // Publish event
    await eventBus.publish("transportation.invoice.reconciled", {
      invoiceId,
      shipmentId,
      status: reconciliation.status,
      discrepanciesCount: discrepancies.length,
    });

    return reconciliation;
  }

  /**
   * Resolve reconciliation discrepancy
   */
  async resolveDiscrepancy(
    invoiceId: string,
    resolution: string,
    resolvedBy: string,
  ): Promise<void> {
    const reconciliation = this.reconciliations.get(invoiceId);
    if (!reconciliation) {
      throw new Error("Reconciliation not found");
    }

    reconciliation.status = "RESOLVED";
    reconciliation.resolvedAt = new Date().toISOString();
    reconciliation.resolvedBy = resolvedBy;

    this.reconciliations.set(invoiceId, reconciliation);

    await eventBus.publish("transportation.reconciliation.resolved", {
      invoiceId,
      resolvedBy,
    });
  }

  /**
   * Get financial analytics
   */
  async getFinancialAnalytics(
    dateRange: { from: Date; to: Date },
    filters?: {
      carrierId?: string;
      mode?: string;
    },
  ): Promise<FinancialAnalytics> {
    // Get shipments in date range
    const shipments = await this.getShipmentsInRange(dateRange, filters);

    // Calculate metrics
    const totalSpend = shipments.reduce(
      (sum, s) => sum + (s.freightCharges?.total || 0),
      0,
    );
    const totalSavings = shipments.reduce((sum, s) => {
      const invoice = this.getInvoiceForShipment(s.id);
      return sum + (invoice?.auditResult?.savings || 0);
    }, 0);

    // Cost by mode
    const costByMode: Record<string, number> = {};
    shipments.forEach((s) => {
      costByMode[s.mode] =
        (costByMode[s.mode] || 0) + (s.freightCharges?.total || 0);
    });

    // Cost by carrier
    const costByCarrier: Record<string, number> = {};
    shipments.forEach((s) => {
      if (s.carrierId) {
        costByCarrier[s.carrierId] =
          (costByCarrier[s.carrierId] || 0) + (s.freightCharges?.total || 0);
      }
    });

    // Payment metrics
    const payments = Array.from(this.payments.values()).filter((p) => {
      const date = new Date(p.createdAt);
      return date >= dateRange.from && date <= dateRange.to;
    });

    const completedPayments = payments.filter((p) => p.status === "COMPLETED");
    const averagePaymentTime =
      this.calculateAveragePaymentTime(completedPayments);

    // Trends (simplified)
    const spendTrend = this.calculateTrend(
      shipments.map((s) => s.freightCharges?.total || 0),
    );
    const savingsTrend = this.calculateTrend(
      shipments.map((s) => {
        const invoice = this.getInvoiceForShipment(s.id);
        return invoice?.auditResult?.savings || 0;
      }),
    );

    return {
      period: dateRange,
      totalSpend,
      totalSavings,
      averageCostPerShipment:
        shipments.length > 0 ? totalSpend / shipments.length : 0,
      costByMode,
      costByCarrier,
      paymentMetrics: {
        totalPayments: payments.length,
        averagePaymentTime,
        onTimePayments: completedPayments.length,
        latePayments: 0, // Would need due date comparison
      },
      trends: {
        spendTrend,
        savingsTrend,
      },
    };
  }

  /**
   * Get invoice (placeholder - would fetch from database)
   */
  private async getInvoice(invoiceId: string): Promise<any> {
    // In production, fetch from database
    assertRealInProduction(
      "tms.finance.getInvoice",
      "Invoice fetch is currently a placeholder. Wire invoice persistence/service before using in production.",
    );
    return null;
  }

  /**
   * Get shipment (placeholder)
   */
  private async getShipment(shipmentId: string): Promise<Shipment | null> {
    // In production, fetch from database
    assertRealInProduction(
      "tms.finance.getShipment",
      "Shipment fetch is currently a placeholder. Wire shipments persistence/service before using in production.",
    );
    return null;
  }

  /**
   * Get shipments in range
   */
  private async getShipmentsInRange(
    dateRange: { from: Date; to: Date },
    filters?: { carrierId?: string; mode?: string },
  ): Promise<Shipment[]> {
    // In production, query database
    assertRealInProduction(
      "tms.finance.getShipmentsInRange",
      "Shipment querying is currently a placeholder. Wire shipments persistence/service before using in production.",
    );
    return [];
  }

  /**
   * Get invoice for shipment
   */
  private getInvoiceForShipment(shipmentId: string): any {
    // In production, query database
    assertRealInProduction(
      "tms.finance.getInvoiceForShipment",
      "Invoice lookup is currently a placeholder. Wire invoice persistence/service before using in production.",
    );
    return null;
  }

  /**
   * Update invoice
   */
  private async updateInvoice(invoice: any): Promise<void> {
    // In production, update database
  }

  /**
   * Calculate average payment time
   */
  private calculateAveragePaymentTime(payments: Payment[]): number {
    if (payments.length === 0) return 0;

    const times = payments
      .filter((p) => p.processedDate)
      .map((p) => {
        const created = new Date(p.createdAt);
        const processed = new Date(p.processedDate!);
        return (
          (processed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        ); // days
      });

    return times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : 0;
  }

  /**
   * Calculate trend
   */
  private calculateTrend(values: number[]): "UP" | "DOWN" | "STABLE" {
    if (values.length < 2) return "STABLE";

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 5) return "UP";
    if (change < -5) return "DOWN";
    return "STABLE";
  }
}

export const financialManagementService = new FinancialManagementService();
