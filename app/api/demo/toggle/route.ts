/**
 * Demo Mode Toggle API
 *
 * Enable/disable demo data mode
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const enabled = body.enabled === true;

    // In a real app, this would be stored per-user/tenant in database
    // For now, we'll use a simple approach
    return NextResponse.json({
      success: true,
      enabled,
      message: enabled
        ? "Demo mode enabled - dashboards will show demo data"
        : "Demo mode disabled",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to toggle demo mode" },
      { status: 500 },
    );
  }
}

export async function GET() {
  // Check if demo mode is enabled
  const enabled =
    process.env.ENABLE_DEMO_DATA === "true" ||
    process.env.NODE_ENV === "development";
  return NextResponse.json({
    success: true,
    enabled,
  });
}
