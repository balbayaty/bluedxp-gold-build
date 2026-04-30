/**
 * Pulse Recognition API
 * POST /api/pulse/recognition/give - Give recognition
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { pulseRecognitionService } from "@/lib/services/pulse";

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    const { userId: fromUserId, tenantId } = auth.context;
    const body = await request.json();
    const { toUserId, pointsPP, reason, tags } = body;

    if (!toUserId || !pointsPP || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: "toUserId, pointsPP, and reason are required",
        },
        { status: 400 },
      );
    }

    const recognition = await pulseRecognitionService.giveRecognition(
      fromUserId,
      toUserId,
      tenantId,
      pointsPP,
      reason,
      tags,
    );

    return NextResponse.json({ success: true, data: recognition });
  } catch (error: any) {
    console.error("Give recognition error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to give recognition" },
      { status: 500 },
    );
  }
}
