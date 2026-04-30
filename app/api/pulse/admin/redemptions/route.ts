/**
 * Pulse Admin - Redemptions API
 * GET /api/pulse/admin/redemptions/pending - Get pending redemptions
 * POST /api/pulse/admin/redemptions/:id/approve - Approve/reject redemption
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { pulseRewardsService } from "@/lib/services/pulse";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request, ["pulse.admin"]);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    const { tenantId } = auth.context;
    const redemptions = await prisma.pulseRedemption.findMany({
      where: {
        tenantId,
        status: "REQUESTED",
      },
      include: {
        reward: true,
      },
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: redemptions });
  } catch (error) {
    console.error("Get pending redemptions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get redemptions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request, ["pulse.admin"]);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    const { userId: approverUserId, tenantId } = auth.context;
    const body = await request.json();
    const { redemptionId, approved, notes } = body;

    if (!redemptionId || approved === undefined) {
      return NextResponse.json(
        { success: false, error: "redemptionId and approved are required" },
        { status: 400 },
      );
    }

    const redemption = await pulseRewardsService.approveRedemption(
      redemptionId,
      approverUserId,
      tenantId,
      approved,
      notes,
    );

    return NextResponse.json({ success: true, data: redemption });
  } catch (error: any) {
    console.error("Approve redemption error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process redemption",
      },
      { status: 500 },
    );
  }
}
