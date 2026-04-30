/**
 * ETW Detail API Routes
 *
 * GET /api/etw/[id] - Get ETW details
 * PUT /api/etw/[id] - Update ETW
 * DELETE /api/etw/[id] - Delete ETW (soft delete)
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { etwService } from "@/lib/services/etw/etwService";
import { UpdateETWSchema } from "@/types/etw";
import { z } from "zod";

async function getETW(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    }

    const id =
      nextContext?.params?.id ||
      request.nextUrl.pathname.split("/").pop() ||
      "";
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ETW ID required" },
        { status: 400 },
      );
    }

    const etw = await etwService.get(id, context.tenantId);

    if (!etw) {
      return NextResponse.json(
        { success: false, error: "ETW not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: etw,
    });
  } catch (error) {
    console.error("[ETW API] Get error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get ETW",
      },
      { status: 500 },
    );
  }
}

async function updateETW(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    }

    if (!context.userId) {
      return NextResponse.json(
        { success: false, error: "User authentication required" },
        { status: 401 },
      );
    }

    const id =
      nextContext?.params?.id ||
      request.nextUrl.pathname.split("/").pop() ||
      "";
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ETW ID required" },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Validate input
    const validated = UpdateETWSchema.partial().parse({
      ...body,
      id,
    });

    // Update ETW
    const etw = await etwService.update(id, validated, context.userId);

    return NextResponse.json({
      success: true,
      data: etw,
    });
  } catch (error) {
    console.error("[ETW API] Update error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update ETW",
      },
      { status: 500 },
    );
  }
}

async function deleteETW(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    }

    if (!context.userId) {
      return NextResponse.json(
        { success: false, error: "User authentication required" },
        { status: 401 },
      );
    }

    const id =
      nextContext?.params?.id ||
      request.nextUrl.pathname.split("/").pop() ||
      "";
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ETW ID required" },
        { status: 400 },
      );
    }

    await etwService.delete(id, context.tenantId, context.userId);

    return NextResponse.json({
      success: true,
      message: "ETW deleted successfully",
    });
  } catch (error) {
    console.error("[ETW API] Delete error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete ETW",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getETW, {
  moduleId: "tms",
  featureId: "tms.etw",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});

export const PUT = withAPIGateway(updateETW, {
  moduleId: "tms",
  featureId: "tms.etw",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteETW, {
  moduleId: "tms",
  featureId: "tms.etw",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
