/**
 * Arabic Intent Detection API Endpoint
 *
 * POST /api/nlp/arabic/intent - Detect business intent in Arabic text
 *
 * @module api/nlp/arabic
 */

import { NextRequest, NextResponse } from "next/server";
import { arabicNLPService } from "@/lib/services/nlp/arabic-nlp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, shipmentId, customerId, previousMessages } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 },
      );
    }

    // Detect intent
    const intent = await arabicNLPService.detectIntent(text, {
      shipmentId,
      customerId,
      previousMessages,
    });

    return NextResponse.json({
      success: true,
      data: intent,
      message: "Intent detected successfully",
    });
  } catch (error) {
    console.error("Error detecting intent:", error);
    return NextResponse.json(
      {
        error: "Failed to detect intent",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
