/**
 * Drill-Down API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { drillDownService } from "@/lib/services/iso-ims/drilldown/drillDownService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

const drillDownSchema = z.object({
  targetType: z.string().min(1),
  targetId: z.string().min(1),
  targetData: z.record(z.any()),
});

async function postHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { sessionId: string } },
) {
  try {
    const body = await request.json();
    const validated = drillDownSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.errors },
        { status: 400 },
      );
    }

    const level = await drillDownService.drillDown(
      params.sessionId,
      validated.data.targetType,
      validated.data.targetId,
      validated.data.targetData,
    );

    const navigation = await drillDownService.getNavigation(params.sessionId);

    return NextResponse.json({ level, navigation });
  } catch (error) {
    console.error("Error drilling down:", error);
    return NextResponse.json(
      { error: "Failed to drill down" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.drilldown",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
