/**
 * Get Integration Data API
 * Fetch data from an integration
 */

import { NextRequest, NextResponse } from "next/server";
import { integrationManager } from "@/lib/services/external-integrations/integrationManager";

/**
 * GET /api/integrations/[id]/data
 * Get data from integration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const options: Record<string, any> = {};

    // Parse query parameters as options
    searchParams.forEach((value, key) => {
      // Try to parse as JSON, otherwise use as string
      try {
        options[key] = JSON.parse(value);
      } catch {
        options[key] = value;
      }
    });

    const result = await integrationManager.getIntegrationData(
      params.id,
      options,
    );

    if (!result.success) {
      return NextResponse.json(result, { status: result.statusCode || 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error fetching integration data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch integration data",
      },
      { status: 500 },
    );
  }
}
