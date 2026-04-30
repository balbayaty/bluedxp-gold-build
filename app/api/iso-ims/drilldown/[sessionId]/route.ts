/**
 * Drill-Down API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { drillDownService } from "@/lib/services/iso-ims/drilldown/drillDownService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

const createSessionSchema = z.object({
  rootLevel: z.object({
    type: z.string(),
    title: z.string(),
    description: z.string().optional(),
    data: z.record(z.any()),
  }),
});

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { sessionId: string } },
) {
  try {
    const session = drillDownService.getSession(params.sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const navigation = await drillDownService.getNavigation(params.sessionId);

    return NextResponse.json({
      level: session.currentLevel,
      navigation,
    });
  } catch (error) {
    console.error("Error getting drill-down session:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const validated = createSessionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.errors },
        { status: 400 },
      );
    }

    const session = await drillDownService.createSession(
      context.tenantId,
      context.userId,
      validated.data.rootLevel,
    );

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Error creating drill-down session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.drilldown",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.drilldown",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
