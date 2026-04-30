/**
 * Touchpoints API
 */

import { NextRequest, NextResponse } from "next/server";
import { touchpointService } from "@/lib/services/customs/touchpointService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const query: any = {};
    if (country) query.country = country as any;
    if (type) query.type = type as any;
    if (status) query.status = status as any;

    const touchpoints = touchpointService.queryTouchpoints(query);

    return NextResponse.json({
      success: true,
      touchpoints,
      total: touchpoints.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
