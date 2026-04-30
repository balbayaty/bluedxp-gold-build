/**
 * Document Display API Route
 *
 * Multi-module document display endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { documentDisplayService } from "@/lib/services/iso-ims/documentDisplayService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

const displayQuerySchema = z.object({
  userId: z.string().optional(),
  context: z
    .object({
      module: z.string().optional(),
      facilityId: z.string().optional(),
      assetId: z.string().optional(),
      spaceId: z.string().optional(),
      materialId: z.string().optional(),
      orderId: z.string().optional(),
      standardCode: z.string().optional(),
      requirementId: z.string().optional(),
    })
    .optional(),
  filters: z
    .object({
      documentType: z.string().optional(),
      category: z.string().optional(),
      status: z.string().optional(),
      standard: z.string().optional(),
      search: z.string().optional(),
    })
    .optional(),
  pagination: z
    .object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
    })
    .optional(),
});

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const validated = displayQuerySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.errors },
        { status: 400 },
      );
    }

    const result = await documentDisplayService.getDocumentsForDisplay({
      tenantId: context.tenantId,
      ...validated.data,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in document display:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents for display" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.documents",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
