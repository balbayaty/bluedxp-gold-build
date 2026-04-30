/**
 * Get Root Cause Analysis by ID
 */

import { NextResponse } from "next/server";
import { rootCauseAnalysisEngine } from "@/lib/services/intelligence-analytics";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const rca = rootCauseAnalysisEngine.getAnalysis(id);

    if (!rca) {
      return NextResponse.json(
        { error: "Root cause analysis not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(rca);
  } catch (error) {
    console.error("Error getting root cause analysis:", error);
    return NextResponse.json(
      { error: "Failed to get root cause analysis" },
      { status: 500 },
    );
  }
}
