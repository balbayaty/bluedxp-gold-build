/**
 * Label Printing API
 * Print labels to PDF or printer
 */

import { NextRequest, NextResponse } from "next/server";
import { labelService } from "@/lib/services/labels/labelService";
import { GHSLabel } from "@/types/container";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { labelData, options } = body;

    if (!labelData) {
      return NextResponse.json(
        { success: false, error: "Label data is required" },
        { status: 400 },
      );
    }

    const success = await labelService.printLabel(
      labelData as GHSLabel,
      options,
    );

    return NextResponse.json({
      success,
      message: success ? "Label sent to printer" : "Failed to print label",
    });
  } catch (error: any) {
    console.error("Error printing label:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to print label" },
      { status: 500 },
    );
  }
}
