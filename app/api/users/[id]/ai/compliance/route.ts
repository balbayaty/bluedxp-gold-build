/**
 * 🚀 AI COMPLIANCE CHECK API
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { withRowLevelSecurity } from "@/middleware/rowLevelSecurity";
import { aiPermissionService } from "@/lib/services/user/aiPermissionService";

async function GET(req: NextRequest, context: any) {
  try {
    const userId = context.params?.id;
    const { searchParams } = new URL(req.url);
    const complianceType = (searchParams.get("type") || "SOC2") as
      | "GDPR"
      | "SOC2"
      | "ISO27001"
      | "HIPAA"
      | "PCI_DSS";

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const complianceCheck = await aiPermissionService.checkCompliance(
      userId,
      complianceType,
    );
    return NextResponse.json({ success: true, data: complianceCheck });
  } catch (error) {
    console.error("[AI API] Error checking compliance:", error);
    return NextResponse.json(
      { error: "Failed to check compliance" },
      { status: 500 },
    );
  }
}

export const GETHandler = withAPIGateway(
  withRowLevelSecurity(GET, { requireAuth: true }),
  { requireAuth: true },
);

export { GETHandler as GET };
