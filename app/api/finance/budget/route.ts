/**
 * Budget API
 * GET /api/finance/budget - Get budgets
 * POST /api/finance/budget - Create budget
 */

import { NextRequest, NextResponse } from "next/server";
import { budgetService } from "@/lib/services/finance/budgetService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId;
    const budgetType = searchParams.get("budgetType") as any;
    const status = searchParams.get("status") as any;

    const budgets = await budgetService.getBudgets({
      tenantId,
      budgetType,
      status,
    });

    return NextResponse.json({
      success: true,
      data: budgets,
    });
  } catch (error: unknown) {
    logger.error("Error fetching budgets", {
      error: error instanceof Error ? error.message : String(error),
      tenantId: context.tenantId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      {
        context: "finance-budget",
        action: "fetch",
        tenantId: context.tenantId,
      },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch budgets",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    body.tenantId = context.tenantId;
    body.createdBy = context.userId;

    const budget = await budgetService.createBudget(body);

    return NextResponse.json({
      success: true,
      data: budget,
    });
  } catch (error: unknown) {
    logger.error("Error creating budget", {
      error: error instanceof Error ? error.message : String(error),
      tenantId: context.tenantId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      {
        context: "finance-budget",
        action: "create",
        tenantId: context.tenantId,
      },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create budget",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "finance",
  featureId: "finance.budget",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.budget",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
