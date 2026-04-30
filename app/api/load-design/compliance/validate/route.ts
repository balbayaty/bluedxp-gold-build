/**
 * Load Compliance Validation API
 *
 * POST /api/load-design/compliance/validate
 *
 * Validate load plan compliance
 */

import { NextRequest, NextResponse } from "next/server";
import { loadComplianceValidator } from "@/lib/services/load-design/compliance/loadComplianceValidator";
import type { LoadPlan } from "@/types/load-design";

export async function POST(request: NextRequest) {
  try {
    const body: LoadPlan = await request.json();

    // Validate request
    if (!body.id || !body.items || !body.vehicleSpec) {
      return NextResponse.json({ error: "Invalid load plan" }, { status: 400 });
    }

    // Validate compliance
    const result = await loadComplianceValidator.validateLoadPlan(body);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Compliance validation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate compliance" },
      { status: 500 },
    );
  }
}
