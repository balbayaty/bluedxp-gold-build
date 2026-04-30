/**
 * ASN Prediction API
 */

import { NextRequest, NextResponse } from "next/server";
import { getPredictiveAsnService } from "@/lib/services/asn";
import { authenticate } from "@/lib/auth";
import { validateTenant } from "@/lib/tenant";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticate(req);
    await validateTenant(user.tenantId);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "arrival"; // arrival, exception, quality

    const predictiveService = getPredictiveAsnService();

    let result;
    switch (type) {
      case "arrival":
        result = await predictiveService.predictArrival(
          params.id,
          user.tenantId,
        );
        break;
      case "exception":
        result = await predictiveService.predictExceptionProbability(
          params.id,
          user.tenantId,
        );
        break;
      case "quality":
        result = await predictiveService.predictQualityScore(
          params.id,
          user.tenantId,
        );
        break;
      default:
        return NextResponse.json(
          { error: "Invalid prediction type" },
          { status: 400 },
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("ASN prediction error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate prediction" },
      { status: 500 },
    );
  }
}
