/**
 * Decision Query API
 * Query decisions with filters
 */

import { NextRequest, NextResponse } from "next/server";
import { decisionService } from "@/lib/services/decision-core";
import type { DecisionQuery } from "@/lib/services/decision-core/types";

export async function POST(request: NextRequest) {
  try {
    const query: DecisionQuery = await request.json();

    const result = await decisionService.queryDecisions(query);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Decision query error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to query decisions" },
      { status: 500 },
    );
  }
}
