/**
 * Compliance Check API
 */

import { NextRequest, NextResponse } from "next/server";
import { complianceService } from "@/lib/services/customs/complianceService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const declaration = body.declaration;

    if (!declaration) {
      return NextResponse.json(
        { success: false, error: "Declaration is required" },
        { status: 400 },
      );
    }

    // Check compliance
    const result = await complianceService.checkCompliance(declaration);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
