/**
 * 💰 BILLING ANALYTICS API
 * 
 * Billing analytics and reporting
 * 
 * BlueDXP Platform - Enterprise-Grade Billing
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { billingService } from "@/lib/services/billing/billingService";

// GET - Get billing analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = session.user.tenantId || searchParams.get("tenantId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const period = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: endDate ? new Date(endDate) : new Date(),
    };

    const analytics = await billingService.getAnalytics(tenantId, period);

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("[Billing] Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
