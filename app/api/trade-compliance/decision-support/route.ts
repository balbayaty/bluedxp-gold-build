/**
 * Decision Support API Route
 * Provides AI-powered decision recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { decisionSupportService } from "@/lib/services/trade-compliance/decisionSupportService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const recommendation = await decisionSupportService.generateRecommendations(
      {
        recordId: body.recordId,
        tradeDirection: body.tradeDirection,
        originCountry: body.originCountry,
        destinationCountry: body.destinationCountry,
        productCategory: body.productCategory,
        totalValue: body.totalValue,
        urgency: body.urgency,
        historicalData: body.historicalData,
      },
    );

    return NextResponse.json({
      success: true,
      recommendation,
    });
  } catch (error) {
    console.error("Error generating decision recommendation:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate recommendation",
      },
      { status: 500 },
    );
  }
}
