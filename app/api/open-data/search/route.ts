/**
 * Open Data Search API
 * Search chemical data across multiple open data sources
 */

import { NextRequest, NextResponse } from "next/server";
import { openDataService } from "@/lib/services/open-data/openDataService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const byCAS = searchParams.get("byCAS") === "true";
    const byName = searchParams.get("byName") === "true";
    const sources = searchParams.get("sources")?.split(",");

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query is required" },
        { status: 400 },
      );
    }

    const results = await openDataService.searchChemical(query, {
      byCAS,
      byName,
      sources,
    });

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error: any) {
    console.error("Error searching open data:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to search open data" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { casNumber, action } = body;

    if (!casNumber) {
      return NextResponse.json(
        { success: false, error: "CAS number is required" },
        { status: 400 },
      );
    }

    let result: any;

    switch (action) {
      case "properties":
        result = await openDataService.getChemicalProperties(casNumber);
        break;
      case "regulatory":
        result = await openDataService.getRegulatoryInfo(casNumber);
        break;
      case "exposure":
        result = await openDataService.getExposureLimits(casNumber);
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action. Use: properties, regulatory, or exposure",
          },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Error fetching open data:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch open data" },
      { status: 500 },
    );
  }
}
