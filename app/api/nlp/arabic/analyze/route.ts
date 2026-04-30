/**
 * Arabic NLP Analysis API Endpoint
 *
 * POST /api/nlp/arabic/analyze - Analyze Arabic text comprehensively
 *
 * @module api/nlp/arabic
 */

import { NextRequest, NextResponse } from "next/server";
import { arabicNLPService } from "@/lib/services/nlp/arabic-nlp";
import type { AnalysisOptions } from "@/lib/services/nlp/arabic-nlp/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, options } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 },
      );
    }

    // Analyze text
    const analysis = await arabicNLPService.analyze(
      text,
      options as AnalysisOptions,
    );

    return NextResponse.json({
      success: true,
      data: analysis,
      message: "Arabic text analyzed successfully",
    });
  } catch (error) {
    console.error("Error analyzing Arabic text:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze Arabic text",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
