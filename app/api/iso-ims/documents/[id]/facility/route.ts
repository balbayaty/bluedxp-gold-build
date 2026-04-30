/**
 * Document-Facility Linking API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { isoIMSFacilityIntegrationService } from "@/lib/services/iso-ims/facilityIntegrationService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

const linkSchema = z.object({
  facilityId: z.string().min(1),
});

async function postHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const validated = linkSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.errors },
        { status: 400 },
      );
    }

    const result =
      await isoIMSFacilityIntegrationService.linkDocumentToFacility(
        params.id,
        validated.data.facilityId,
        context.tenantId,
        context.userId,
      );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error linking document to facility:", error);
    return NextResponse.json(
      { error: "Failed to link document to facility" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.documents.facility",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
