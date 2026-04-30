/**
 * Compliance Report API Endpoint
 *
 * POST /api/saudi-alignment/reports - Generate compliance report
 *
 * @module api/saudi-alignment
 */

import { NextRequest, NextResponse } from "next/server";
import { reportGenerator } from "@/lib/services/saudi-alignment";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportType, entityId, entityType, dateRange, format } = body;

    if (!reportType) {
      return NextResponse.json(
        { error: "reportType is required" },
        { status: 400 },
      );
    }

    // Generate report
    const report = await reportGenerator.generateReport({
      reportType,
      entityId,
      entityType,
      dateRange: dateRange
        ? {
            from: new Date(dateRange.from),
            to: new Date(dateRange.to),
          }
        : undefined,
      format,
    });

    return NextResponse.json({
      success: true,
      data: report,
      message: "Compliance report generated successfully",
    });
  } catch (error) {
    console.error("Error generating compliance report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate compliance report",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
