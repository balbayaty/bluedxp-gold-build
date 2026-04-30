/**
 * 💰 CREDIT SERVICE
 * 
 * Credit management
 * 
 * BlueDXP Platform - Enterprise-Grade Billing
 */

import { prisma } from "@/lib/services/database/prismaClient";
import type { Credit } from "@/types/billing";

// ============================================================================
// CREDIT SERVICE
// ============================================================================

class CreditService {
  /**
   * Get credits for user
   */
  async getCredits(userId: string): Promise<Credit[]> {
    const dbCredits = await prisma.billing_credits.findMany({
      where: { userId, status: "active" },
    });

    return dbCredits.map((c) => ({
      id: c.id,
      tenantId: c.tenantId,
      userId: c.userId,
      amount: Number(c.amount),
      currency: c.currency,
      balance: Number(c.balance),
      used: Number(c.used),
      type: c.type as any,
      reason: c.reason || undefined,
      expiresAt: c.expiresAt?.toISOString(),
      appliedToInvoices: (c.appliedToInvoices as any) || undefined,
      status: c.status as any,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  /**
   * Add credit to user account
   */
  async addCredit(input: {
    tenantId: string;
    userId: string;
    amount: number;
    currency: string;
    type: string;
    reason?: string;
    expiresAt?: string;
  }): Promise<Credit> {
    const creditId = `credit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const created = await prisma.billing_credits.create({
      data: {
        id: creditId,
        tenantId: input.tenantId,
        userId: input.userId,
        amount: input.amount,
        currency: input.currency,
        balance: input.amount,
        used: 0,
        type: input.type as any,
        reason: input.reason || null,
        status: "active",
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        appliedToInvoices: [],
      },
    });

    return {
      id: created.id,
      tenantId: created.tenantId,
      userId: created.userId,
      amount: Number(created.amount),
      currency: created.currency,
      balance: Number(created.balance),
      used: Number(created.used),
      type: created.type as any,
      reason: created.reason || undefined,
      expiresAt: created.expiresAt?.toISOString(),
      appliedToInvoices: (created.appliedToInvoices as any) || undefined,
      status: created.status as any,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  /**
   * Get credit balance
   */
  async getBalance(userId: string): Promise<{ totalBalance: number; currency: string }> {
    const credits = await prisma.billing_credits.findMany({
      where: {
        userId,
        status: { in: ["active", "partially_used"] },
      },
    });

    const totalBalance = credits.reduce((sum, c) => sum + Number(c.balance), 0);
    const currency = credits[0]?.currency || "SAR";

    return { totalBalance, currency };
  }

  /**
   * Get credit history
   */
  async getCreditHistory(userId: string): Promise<Credit[]> {
    return this.getCredits(userId);
  }

  /**
   * Apply credit to invoice
   */
  async applyCredit(creditId: string, invoiceId: string, amount: number): Promise<void> {
    const credit = await prisma.billing_credits.findUnique({
      where: { id: creditId },
    });

    if (!credit) {
      throw new Error(`Credit ${creditId} not found`);
    }

    const appliedInvoices = ((credit.appliedToInvoices as any) || []) as string[];
    appliedInvoices.push(invoiceId);

    await prisma.billing_credits.update({
      where: { id: creditId },
      data: {
        balance: credit.balance - amount,
        used: credit.used + amount,
        appliedToInvoices: appliedInvoices as any,
        status: credit.balance - amount <= 0 ? "exhausted" : credit.status,
      },
    });
  }
}

export const creditService = new CreditService();
