/**
 * ETW Events API Routes
 *
 * GET /api/etw/[id]/events - Get ETW events
 * POST /api/etw/[id]/events - Add chain-of-custody event
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { etwEventService } from "@/lib/services/etw/eventService";
import { AddETWEventSchema } from "@/types/etw";
import { z } from "zod";

async function getEvents(
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
      request.nextUrl.pathname.split("/").slice(0, -1).pop() ||
      "";
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ETW ID required" },
        { status: 400 },
      );
    }

    const events = await etwEventService.getEvents(id, context.tenantId);

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("[ETW API] Get events error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get events",
      },
      { status: 500 },
    );
  }
}

async function addEvent(
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
      request.nextUrl.pathname.split("/").slice(0, -1).pop() ||
      "";
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ETW ID required" },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Validate input
    const validated = AddETWEventSchema.parse({
      ...body,
      etwId: id,
      actor: {
        ...body.actor,
        id: body.actor?.id || context.userId,
      },
    });

    // Add event
    const event = await etwEventService.addEvent(validated);

    return NextResponse.json(
      {
        success: true,
        data: event,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[ETW API] Add event error:", error);

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
        error: error instanceof Error ? error.message : "Failed to add event",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getEvents, {
  moduleId: "tms",
  featureId: "tms.etw",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(addEvent, {
  moduleId: "tms",
  featureId: "tms.etw",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
