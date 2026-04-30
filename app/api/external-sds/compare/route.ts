/**
 * External SDS Comparison API
 * Compare SDS from multiple external sources
 */

import { NextRequest, NextResponse } from "next/server";
import { sdsAggregator } from "@/lib/services/external-sds/sdsAggregator";
import { chemwatchService } from "@/lib/services/external-sds/chemwatchService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { casNumber, internalSDS } = body;

    if (!casNumber) {
      return NextResponse.json(
        { success: false, error: "CAS number is required" },
        { status: 400 },
      );
    }

    // Get external SDS
    const externalSDS = await chemwatchService.searchByCAS(casNumber);

    if (externalSDS.length === 0) {
      return NextResponse.json(
        { success: false, error: "No external SDS found" },
        { status: 404 },
      );
    }

    // Compare with internal if provided
    if (internalSDS) {
      const comparison = await chemwatchService.compareSDS(
        externalSDS[0],
        internalSDS,
      );

      return NextResponse.json({
        success: true,
        comparison,
        externalSDS: externalSDS[0],
      });
    }

    // Compare sources
    const sourceComparison = await sdsAggregator.compareSources(casNumber);

    return NextResponse.json({
      success: true,
      ...sourceComparison,
      externalSDS: externalSDS[0],
    });
  } catch (error: any) {
    console.error("Error comparing SDS:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to compare SDS" },
      { status: 500 },
    );
  }
}
