/**
 * Execute Closing Task API
 * POST /api/finance/period-closing/execute-task
 */

import { NextRequest, NextResponse } from "next/server";
import { periodClosingService } from "@/lib/services/finance/periodClosingService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId;
    const { closingId, taskId } = body;

    if (!closingId || !taskId) {
      return NextResponse.json(
        {
          success: false,
          error: "Closing ID and task ID are required",
        },
        { status: 400 },
      );
    }

    const task = await periodClosingService.executeClosingTask(
      tenantId,
      closingId,
      taskId,
      context.userId,
    );

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    console.error("Error executing closing task:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute closing task",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.period-closing",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
