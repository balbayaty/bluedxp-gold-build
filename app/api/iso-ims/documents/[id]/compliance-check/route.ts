/**
 * Document Compliance Check API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { documentService } from "@/lib/services/iso-ims/documentService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const result = await documentService.performComplianceCheck(
      params.id,
      context.tenantId,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error performing compliance check:", error);
    return NextResponse.json(
      { error: "Failed to perform compliance check" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.documents.compliance",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
