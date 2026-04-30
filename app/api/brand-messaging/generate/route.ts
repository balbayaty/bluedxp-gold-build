import { NextRequest, NextResponse } from "next/server";
import { brandMessagingService } from "@/lib/services/brand-messaging/brandMessagingService";
import type { MessagingGenerationRequest } from "@/types/brand-messaging";

export async function POST(request: NextRequest) {
  try {
    const body: MessagingGenerationRequest = await request.json();

    if (!body.type || !body.context) {
      return NextResponse.json(
        { success: false, error: "type and context are required" },
        { status: 400 },
      );
    }

    const message = await brandMessagingService.generateMessage(body);

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Generate message error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate message",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const stats = brandMessagingService.getCacheStats();
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get stats" },
      { status: 500 },
    );
  }
}
