/**
 * Claim Extraction API
 * POST /api/truth-engine/claims/extract
 * POST /api/truth-engine/claims/validate
 * GET /api/truth-engine/claims?entityType=...&entityId=...
 * GET /api/truth-engine/claims/statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { claimExtractionService } from "@/lib/services/truth-engine";
import { truthEngineService } from "@/lib/services/truth-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, text, eventId, claimId, evidenceIds } = body;

    if (action === "extract") {
      if (!text && !eventId) {
        return NextResponse.json(
          { error: "text or eventId is required" },
          { status: 400 },
        );
      }

      if (text) {
        const claims = await claimExtractionService.extractFromText(text);
        return NextResponse.json({ claims });
      }

      if (eventId) {
        const event = await truthEngineService.getTruthEvent(eventId);
        if (!event) {
          return NextResponse.json(
            { error: "Event not found" },
            { status: 404 },
          );
        }
        const claims = await claimExtractionService.extractFromEvent(event);
        return NextResponse.json({ claims });
      }
    }

    if (action === "validate") {
      if (!claimId || !evidenceIds) {
        return NextResponse.json(
          { error: "claimId and evidenceIds are required" },
          { status: 400 },
        );
      }

      const result = await claimExtractionService.validateClaim(
        claimId,
        evidenceIds,
      );
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "extract" or "validate"' },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Claim extraction error:", error);
    return NextResponse.json(
      { error: error.message || "Operation failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const statistics = searchParams.get("statistics");

    if (statistics === "true") {
      const stats = claimExtractionService.getClaimStatistics();
      return NextResponse.json(stats);
    }

    if (entityType && entityId) {
      const claims = await claimExtractionService.getClaimsForEntity(
        entityType,
        entityId,
      );
      return NextResponse.json({ claims });
    }

    return NextResponse.json(
      { error: "entityType and entityId, or statistics=true is required" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Claim query error:", error);
    return NextResponse.json(
      { error: error.message || "Query failed" },
      { status: 500 },
    );
  }
}
