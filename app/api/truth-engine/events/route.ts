/**
 * Truth Engine Events API
 * RESTful API for TruthEvent operations
 */

import { NextRequest, NextResponse } from "next/server";
import { truthEngineService } from "@/lib/services/truth-engine";
import { TruthEvent } from "@/types/truth-engine";
import { checkTruthEngineRateLimit } from "@/lib/services/truth-engine/security/rateLimiter";
import {
  validateTruthEvent,
  sanitizeTruthEvent,
} from "@/lib/services/truth-engine/security/validation";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier =
      request.headers.get("x-api-key") ||
      request.headers.get("x-user-id") ||
      "anonymous";
    const rateLimit = checkTruthEngineRateLimit("event", identifier);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          reason: rateLimit.reason,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimit.resetAt?.toISOString() || "",
          },
        },
      );
    }

    const body = await request.json();
    const { event, tenantId } = body;

    // Validate input
    const validation = validateTruthEvent(event);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors: validation.errors,
        },
        { status: 400 },
      );
    }

    // Sanitize input
    const sanitized = sanitizeTruthEvent(event);

    if (!event || !tenantId) {
      return NextResponse.json(
        { success: false, error: "event and tenantId are required" },
        { status: 400 },
      );
    }

    const truthEvent = await truthEngineService.recordTruthEvent({
      ...sanitized,
      tenantId,
    } as any);

    return NextResponse.json(
      {
        success: true,
        event: truthEvent,
      },
      {
        headers: {
          "X-RateLimit-Remaining": (rateLimit.remaining || 0).toString(),
          "X-RateLimit-Reset": rateLimit.resetAt?.toISOString() || "",
        },
      },
    );
  } catch (error: any) {
    console.error("Error recording truth event:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to record truth event",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const eventTypes = searchParams.get("eventTypes")?.split(",");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const minConfidence = searchParams.get("minConfidence");

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "tenantId is required" },
        { status: 400 },
      );
    }

    if (entityType && entityId) {
      // Get timeline
      const timeline = await truthEngineService.getTruthTimeline(
        entityType,
        entityId,
        {
          eventTypes: eventTypes as any,
          dateFrom,
          dateTo,
          minConfidence: minConfidence ? parseFloat(minConfidence) : undefined,
        },
      );

      return NextResponse.json({
        success: true,
        timeline,
      });
    } else {
      // Search events
      const result = await truthEngineService.searchTruthEvents({
        tenantId,
        eventTypes: eventTypes as any,
        dateFrom,
        dateTo,
        minConfidence: minConfidence ? parseFloat(minConfidence) : undefined,
        limit: parseInt(searchParams.get("limit") || "100"),
        offset: parseInt(searchParams.get("offset") || "0"),
      });

      return NextResponse.json({
        success: true,
        ...result,
      });
    }
  } catch (error: any) {
    console.error("Error fetching truth events:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch truth events",
      },
      { status: 500 },
    );
  }
}
