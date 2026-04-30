/**
 * ASN Vision Analysis API
 */

import { NextRequest, NextResponse } from "next/server";
import { getVisionIntegrationService } from "@/lib/services/asn";
import { authenticate } from "@/lib/auth";
import { validateTenant } from "@/lib/tenant";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticate(req);
    await validateTenant(user.tenantId);

    const body = await req.json();
    const { photoUrl } = body;

    if (!photoUrl) {
      return NextResponse.json(
        { error: "Photo URL is required" },
        { status: 400 },
      );
    }

    const visionService = getVisionIntegrationService();
    const analysis = await visionService.analyzeReceivingPhoto(
      params.id,
      photoUrl,
      user.tenantId,
    );

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("Vision analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze photo" },
      { status: 500 },
    );
  }
}
