/**
 * Pulse Rewards API
 * GET /api/pulse/rewards/catalog - Get rewards catalog
 * POST /api/pulse/rewards/redeem - Redeem reward
 * GET /api/pulse/rewards/redemptions - Get user redemptions
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { pulseRewardsService } from "@/lib/services/pulse";

export async function GET(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    const { tenantId } = auth.context;
    const searchParams = request.nextUrl.searchParams;
    const path = request.nextUrl.pathname;

    if (path.includes("/catalog")) {
      const active = searchParams.get("active");
      const category = searchParams.get("category");

      const catalog = await pulseRewardsService.getCatalog(tenantId, {
        active:
          active === "true" ? true : active === "false" ? false : undefined,
        category: category || undefined,
      });

      return NextResponse.json({ success: true, data: catalog });
    }

    if (path.includes("/redemptions")) {
      const { userId, tenantId } = auth.context;
      const status = searchParams.get("status");

      const redemptions = await pulseRewardsService.getRedemptions(
        userId,
        tenantId,
        {
          status: status as any,
        },
      );

      return NextResponse.json({ success: true, data: redemptions });
    }

    return NextResponse.json(
      { success: false, error: "Invalid endpoint" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Rewards API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    const { userId, tenantId } = auth.context;
    const body = await request.json();
    const { rewardId } = body;

    if (!rewardId) {
      return NextResponse.json(
        { success: false, error: "rewardId is required" },
        { status: 400 },
      );
    }

    const redemption = await pulseRewardsService.redeemReward(
      userId,
      tenantId,
      rewardId,
    );

    return NextResponse.json({ success: true, data: redemption });
  } catch (error: any) {
    console.error("Redeem reward error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to redeem reward" },
      { status: 500 },
    );
  }
}
