/**
 * CRM Opportunities API
 * GET /api/crm/opportunities - Get opportunities
 * POST /api/crm/opportunities - Create opportunity
 */

import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/services/crm/opportunityService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const accountId = searchParams.get("accountId") || undefined;
    const stage = searchParams.get("stage") as any;
    const ownerId = searchParams.get("ownerId") || undefined;

    const opportunities = await opportunityService.getOpportunities({
      tenantId,
      accountId,
      stage,
      ownerId,
    });

    return NextResponse.json({
      success: true,
      data: opportunities,
    });
  } catch (error: unknown) {
    logger.error("Error fetching opportunities", {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "crm-opportunities", action: "fetch", tenantId },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch opportunities",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const opportunity = await opportunityService.createOpportunity(body);

    return NextResponse.json({
      success: true,
      data: opportunity,
    });
  } catch (error: unknown) {
    logger.error("Error creating opportunity", {
      error: error instanceof Error ? error.message : String(error),
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "crm-opportunities", action: "create" },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create opportunity",
      },
      { status: 500 },
    );
  }
}
