/**
 * Financial Plan API
 * GET/POST /api/finance/fpa/plan
 */

import { NextRequest, NextResponse } from "next/server";
import { fpaService } from "@/lib/services/finance/fpaService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId;
    const planId = searchParams.get("planId");

    if (planId) {
      const plan = await fpaService.getPlan(planId);
      return NextResponse.json({
        success: true,
        data: plan,
      });
    }

    const plans = await fpaService.getPlans(tenantId);
    return NextResponse.json({
      success: true,
      data: plans,
    });
  } catch (error: any) {
    console.error("Error getting financial plan:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get financial plan",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId;
    const { planData } = body;

    if (!planData) {
      return NextResponse.json(
        {
          success: false,
          error: "Plan data is required",
        },
        { status: 400 },
      );
    }

    const plan = await fpaService.createFinancialPlan(tenantId, planData);

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error: any) {
    console.error("Error creating financial plan:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create financial plan",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "finance",
  featureId: "finance.fpa.plan",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.fpa.plan",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
