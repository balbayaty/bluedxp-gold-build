/**
 * External SDS Fetch API
 * Fetch SDS from external databases (Chemwatch, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { sdsAggregator } from "@/lib/services/external-sds/sdsAggregator";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const casNumber = searchParams.get("casNumber");
    const productName = searchParams.get("productName");

    if (!casNumber && !productName) {
      return NextResponse.json(
        { success: false, error: "CAS number or product name is required" },
        { status: 400 },
      );
    }

    const aggregated = await sdsAggregator.aggregateSDS(
      casNumber || undefined,
      productName || undefined,
    );

    return NextResponse.json({
      success: true,
      ...aggregated,
    });
  } catch (error: any) {
    console.error("Error fetching external SDS:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch external SDS",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { casNumber, productName, action } = body;

    if (!casNumber && !productName) {
      return NextResponse.json(
        { success: false, error: "CAS number or product name is required" },
        { status: 400 },
      );
    }

    if (action === "compare") {
      const comparison = await sdsAggregator.compareSources(casNumber);
      return NextResponse.json({
        success: true,
        ...comparison,
      });
    }

    const aggregated = await sdsAggregator.aggregateSDS(casNumber, productName);

    return NextResponse.json({
      success: true,
      ...aggregated,
    });
  } catch (error: any) {
    console.error("Error processing external SDS request:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}
