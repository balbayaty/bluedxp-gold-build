/**
 * Arabic Sentiment Analysis API Endpoint
 *
 * POST /api/nlp/arabic/sentiment - Analyze sentiment in Arabic text
 *
 * @module api/nlp/arabic
 */

import { NextRequest, NextResponse } from "next/server";
import { arabicNLPService } from "@/lib/services/nlp/arabic-nlp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 },
      );
    }

    // Analyze sentiment
    const sentiment = await arabicNLPService.analyzeSentiment(text);

    return NextResponse.json({
      success: true,
      data: sentiment,
      message: "Sentiment analyzed successfully",
    });
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze sentiment",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
