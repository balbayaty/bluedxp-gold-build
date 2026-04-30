/**
 * Smart Detection Form API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { smartDetectionService } from "@/lib/services/forms/smartDetectionService";

// POST - Detect form fields
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.fields || !body.context) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: fields, context" },
        { status: 400 },
      );
    }

    const result = await smartDetectionService.detectFormFields(
      body.fields,
      body.context,
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error detecting form fields:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to detect form fields",
      },
      { status: 500 },
    );
  }
}
