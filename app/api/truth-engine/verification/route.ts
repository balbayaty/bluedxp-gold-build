/**
 * Multimodal Verification API
 * POST /api/truth-engine/verification
 */

import { NextRequest, NextResponse } from "next/server";
import { multimodalVerificationService } from "@/lib/services/truth-engine";
import { TruthEvidenceItem } from "@/types/truth-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { evidence } = body;

    if (!evidence) {
      return NextResponse.json(
        { error: "Evidence is required" },
        { status: 400 },
      );
    }

    const result = await multimodalVerificationService.verifyEvidence(
      evidence as TruthEvidenceItem,
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 500 },
    );
  }
}
