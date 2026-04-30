/**
 * Audit Trail API
 * GET/POST /api/finance/audit-trail
 */

import { NextRequest, NextResponse } from "next/server";
import { auditTrailService } from "@/lib/services/finance/auditTrailService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId;
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let logs;
    if (entityType && entityId) {
      logs = await auditTrailService.getAuditTrail(
        tenantId,
        entityType,
        entityId,
      );
    } else if (userId) {
      logs = await auditTrailService.getAuditTrailByUser(
        tenantId,
        userId,
        startDate || undefined,
        endDate || undefined,
      );
    } else if (action) {
      logs = await auditTrailService.getAuditTrailByAction(
        tenantId,
        action as any,
        startDate || undefined,
        endDate || undefined,
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide entityType/entityId, userId, or action",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error: unknown) {
    logger.error("Error getting audit trail", {
      error: error instanceof Error ? error.message : String(error),
      tenantId: context.tenantId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      {
        context: "finance-audit-trail",
        action: "get",
        tenantId: context.tenantId,
      },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get audit trail",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId;
    const { log } = body;

    if (!log) {
      return NextResponse.json(
        {
          success: false,
          error: "Log data is required",
        },
        { status: 400 },
      );
    }

    const auditLog = await auditTrailService.logAuditEvent(tenantId, log);

    return NextResponse.json({
      success: true,
      data: auditLog,
    });
  } catch (error: unknown) {
    logger.error("Error logging audit event", {
      error: error instanceof Error ? error.message : String(error),
      tenantId: context.tenantId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      {
        context: "finance-audit-trail",
        action: "log",
        tenantId: context.tenantId,
      },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to log audit event",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "finance",
  featureId: "finance.audit-trail",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.audit-trail",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
