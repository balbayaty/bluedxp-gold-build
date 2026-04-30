import { paymentService } from "./paymentService";
import { eventBus } from "@/lib/services/event-store";

export interface CommissionRate {
  category: string;
  rate: number; // Percentage (0-100)
  minAmount?: number;
  maxAmount?: number;
}

export interface Commission {
  id: string;
  paymentId: string;
  bookingId: string;
  providerId: string;
  customerId: string;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  providerAmount: number;
  platformAmount: number;
  status: "pending" | "calculated" | "paid" | "cancelled";
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

class CommissionService {
  private commissions: Map<string, Commission> = new Map();
  private commissionRates: CommissionRate[] = [
    { category: "storage", rate: 15 },
    { category: "crossdocking", rate: 12 },
    { category: "transportation", rate: 10 },
    { category: "freight", rate: 8 },
    { category: "consulting", rate: 20 },
    { category: "manpower", rate: 15 },
    { category: "translation", rate: 12 },
    { category: "default", rate: 10 },
  ];

  /**
   * Calculate commission for a payment
   */
  async calculateCommission(
    paymentId: string,
    bookingId: string,
    providerId: string,
    customerId: string,
    amount: number,
    serviceCategory: string,
  ): Promise<Commission> {
    const rate = this.getCommissionRate(serviceCategory, amount);
    const commissionAmount = amount * (rate / 100);
    const providerAmount = amount - commissionAmount;
    const platformAmount = commissionAmount;

    const commissionId = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const commission: Commission = {
      id: commissionId,
      paymentId,
      bookingId,
      providerId,
      customerId,
      amount,
      commissionRate: rate,
      commissionAmount,
      providerAmount,
      platformAmount,
      status: "calculated",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.commissions.set(commissionId, commission);

    await eventBus.publish("marketplace.commission.calculated", {
      commissionId,
      paymentId,
      bookingId,
      amount: commissionAmount,
    });

    return commission;
  }

  /**
   * Get commission rate for a category
   */
  getCommissionRate(category: string, amount: number): number {
    const rate = this.commissionRates.find(
      (r) =>
        r.category === category &&
        (!r.minAmount || amount >= r.minAmount) &&
        (!r.maxAmount || amount <= r.maxAmount),
    );

    return (
      rate?.rate ||
      this.commissionRates.find((r) => r.category === "default")?.rate ||
      10
    );
  }

  /**
   * Update commission rates
   */
  async updateCommissionRates(rates: CommissionRate[]): Promise<void> {
    this.commissionRates = rates;
  }

  /**
   * Get commission by ID
   */
  async getCommission(id: string): Promise<Commission | null> {
    return this.commissions.get(id) || null;
  }

  /**
   * Get commissions for a provider
   */
  async getCommissionsByProvider(providerId: string): Promise<Commission[]> {
    return Array.from(this.commissions.values()).filter(
      (c) => c.providerId === providerId,
    );
  }

  /**
   * Get commissions for a booking
   */
  async getCommissionsByBooking(bookingId: string): Promise<Commission[]> {
    return Array.from(this.commissions.values()).filter(
      (c) => c.bookingId === bookingId,
    );
  }

  /**
   * Mark commission as paid
   */
  async markCommissionAsPaid(commissionId: string): Promise<Commission | null> {
    const commission = this.commissions.get(commissionId);
    if (!commission) {
      return null;
    }

    const updated: Commission = {
      ...commission,
      status: "paid",
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.commissions.set(commissionId, updated);

    await eventBus.publish("marketplace.commission.paid", {
      commissionId,
      providerId: commission.providerId,
      amount: commission.commissionAmount,
    });

    return updated;
  }

  /**
   * Get commission statistics
   */
  async getCommissionStats(providerId?: string): Promise<{
    totalCommissions: number;
    totalAmount: number;
    paidCommissions: number;
    paidAmount: number;
    pendingCommissions: number;
    pendingAmount: number;
    averageCommissionRate: number;
  }> {
    let commissions = Array.from(this.commissions.values());

    if (providerId) {
      commissions = commissions.filter((c) => c.providerId === providerId);
    }

    const totalCommissions = commissions.length;
    const totalAmount = commissions.reduce(
      (sum, c) => sum + c.commissionAmount,
      0,
    );
    const paidCommissions = commissions.filter(
      (c) => c.status === "paid",
    ).length;
    const paidAmount = commissions
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + c.commissionAmount, 0);
    const pendingCommissions = commissions.filter(
      (c) => c.status === "calculated" || c.status === "pending",
    ).length;
    const pendingAmount = commissions
      .filter((c) => c.status === "calculated" || c.status === "pending")
      .reduce((sum, c) => sum + c.commissionAmount, 0);

    const averageCommissionRate =
      commissions.length > 0
        ? commissions.reduce((sum, c) => sum + c.commissionRate, 0) /
          commissions.length
        : 0;

    return {
      totalCommissions,
      totalAmount,
      paidCommissions,
      paidAmount,
      pendingCommissions,
      pendingAmount,
      averageCommissionRate,
    };
  }
}

export const commissionService = new CommissionService();
