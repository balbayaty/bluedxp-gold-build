/**
 * 🚀 PERMISSION TEMPLATES API
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { withRowLevelSecurity } from "@/middleware/rowLevelSecurity";
import { roleService } from "@/lib/services/user";

async function GET(req: NextRequest, context: any) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = context.security?.tenantId || searchParams.get("tenantId");

    const templates = await roleService.getRoleTemplates(tenantId || undefined);
    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error("[Templates API] Error getting templates:", error);
    return NextResponse.json(
      { error: "Failed to get templates" },
      { status: 500 },
    );
  }
}

export const GETHandler = withAPIGateway(
  withRowLevelSecurity(GET, { requireAuth: true }),
  { requireAuth: true },
);

export { GETHandler as GET };
