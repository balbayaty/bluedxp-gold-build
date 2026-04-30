import { NextRequest, NextResponse } from "next/server";
import { brandMessagingService } from "@/lib/services/brand-messaging/brandMessagingService";
import type { BatchGenerationRequest } from "@/types/brand-messaging";

export async function POST(request: NextRequest) {
  try {
    const body: BatchGenerationRequest = await request.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "items array is required and must not be empty",
        },
        { status: 400 },
      );
    }

    const result = await brandMessagingService.batchGenerate(body);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Batch generate error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to batch generate messages",
      },
      { status: 500 },
    );
  }
}
