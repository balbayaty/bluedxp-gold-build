/**
 * Root Cause Analysis API
 * Analyzes root cause for an issue
 */

import { NextResponse } from "next/server";
import { unifiedIntelligenceService } from "@/lib/services/intelligence-analytics";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tenantId,
      issueId,
      issueType,
      source,
      context,
      method = "HYBRID",
    } = body;

    if (!tenantId || !source) {
      return NextResponse.json(
        { error: "tenantId and source are required" },
        { status: 400 },
      );
    }

    const rca = await unifiedIntelligenceService.analyzeRootCause({
      tenantId,
      issueId,
      issueType,
      source,
      context,
      method,
    });

    return NextResponse.json(rca);
  } catch (error) {
    console.error("Error analyzing root cause:", error);
    return NextResponse.json(
      { error: "Failed to analyze root cause" },
      { status: 500 },
    );
  }
}
