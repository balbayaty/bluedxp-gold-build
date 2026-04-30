/**
 * GHS Label Generation API
 * Generate GHS-compliant labels
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

    const label = labelService.generateGHSLabel(labelData as GHSLabel);
    const pdfBlob = await labelService.printLabelToPDF(
      labelData as GHSLabel,
      options,
    );

    // Convert blob to base64 for JSON response
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({
      success: true,
      label,
      pdf: base64,
      pdfUrl: `data:application/pdf;base64,${base64}`,
    });
  } catch (error: any) {
    console.error("Error generating label:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate label" },
      { status: 500 },
    );
  }
}
