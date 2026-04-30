/**
 * General Ledger API
 * GET /api/finance/general-ledger - Get GL entries
 * POST /api/finance/general-ledger - Create journal entry
 */

import { NextRequest, NextResponse } from "next/server";
import { generalLedgerService } from "@/lib/services/finance/generalLedgerService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId;
    const accountCode = searchParams.get("accountCode") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const status = searchParams.get("status") as any;

    const entries = await generalLedgerService.getGLEntries({
      tenantId,
      accountCode,
      startDate,
      endDate,
      status,
    });

    return NextResponse.json({
      success: true,
      data: entries,
    });
  } catch (error: unknown) {
    logger.error("Error fetching GL entries", {
      error: error instanceof Error ? error.message : String(error),
      tenantId: context.tenantId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      {
        context: "finance-general-ledger",
        action: "fetch",
        tenantId: context.tenantId,
      },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch GL entries",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId;
    const { entryDate, description, lines, currency } = body;

    const journalEntry = await generalLedgerService.createJournalEntry({
      tenantId,
      entryDate,
      description,
      lines,
      currency,
      createdBy: context.userId,
    });

    return NextResponse.json({
      success: true,
      data: journalEntry,
    });
  } catch (error: unknown) {
    logger.error("Error creating journal entry", {
      error: error instanceof Error ? error.message : String(error),
      tenantId: context.tenantId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      {
        context: "finance-general-ledger",
        action: "create",
        tenantId: context.tenantId,
      },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create journal entry",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "finance",
  featureId: "finance.general-ledger",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.general-ledger",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
