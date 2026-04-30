/**
 * Email Statistics API Route
 *
 * Get email statistics for a tenant
 */

import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/services/email";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "default";
    const from = searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : undefined;
    const to = searchParams.get("to")
      ? new Date(searchParams.get("to")!)
      : undefined;

    const stats = await emailService.getEmailStats(tenantId, from, to);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error("Error getting email stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get email statistics",
      },
      { status: 500 },
    );
  }
}
