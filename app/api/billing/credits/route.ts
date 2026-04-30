/**
 * 💰 BILLING CREDITS API
 * 
 * Credit balance management:
 * - Get credit balance
 * - Get credit history
 * 
 * BlueDXP Platform - Production Ready
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/services/database/prismaClient";

// GET - Get credit balance and history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow demo mode
    const userId = session?.user?.id || request.headers.get("x-user-id") || "demo-user";
    const tenantId = session?.user?.tenantId || request.headers.get("x-tenant-id") || process.env.BOOTSTRAP_TENANT_ID || "default-tenant";

    // Get all active credits
    const credits = await prisma.billing_credits.findMany({
      where: {
        userId,
        status: { in: ["active", "partially_used"] },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate total balance
    const totalBalance = credits.reduce((sum, c) => sum + Number(c.balance), 0);
    const totalUsed = credits.reduce((sum, c) => sum + Number(c.used), 0);

    // Get recent credit transactions
    const transactions = await prisma.billing_credits.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      balance: totalBalance,
      used: totalUsed,
      credits: credits.map((c) => ({
        id: c.id,
        amount: Number(c.amount),
        balance: Number(c.balance),
        used: Number(c.used),
        type: c.type,
        reason: c.reason,
        expiresAt: c.expiresAt,
        status: c.status,
        createdAt: c.createdAt,
      })),
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type,
        reason: t.reason,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error("[Credits] Error fetching balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit balance" },
      { status: 500 }
    );
  }
}
