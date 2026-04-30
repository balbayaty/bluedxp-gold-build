/**
 * ASN Evidence API
 * Manage evidence and lineage tracking for ASN
 */

import { NextRequest, NextResponse } from "next/server";
import { asnEvidenceIntegration } from "@/lib/services/asn/asnEvidenceIntegration";

/**
 * GET /api/asn/[id]/evidence
 * Get all evidence for ASN
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const evidence = await asnEvidenceIntegration.getEvidenceForASN(params.id);
    const integrity = await asnEvidenceIntegration.verifyASNIntegrity(
      params.id,
    );
    const chain = await asnEvidenceIntegration.getEvidenceChain(params.id);

    return NextResponse.json({
      success: true,
      data: {
        evidence,
        integrity,
        chain,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in GET /api/asn/[id]/evidence:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/asn/[id]/evidence
 * Create evidence for ASN
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const evidenceId = await asnEvidenceIntegration.createEvidence(
      params.id,
      body,
    );

    return NextResponse.json({
      success: true,
      data: { evidenceId },
      message: "Evidence created successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in POST /api/asn/[id]/evidence:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
