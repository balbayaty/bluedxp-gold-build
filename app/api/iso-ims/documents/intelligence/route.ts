/**
 * Document Intelligence API Route
 *
 * Intelligent sorting, suggestions, and analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { documentIntelligenceService } from "@/lib/services/iso-ims/documentIntelligenceService";
import { documentService } from "@/lib/services/iso-ims/documentService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

const sortRequestSchema = z.object({
  documentIds: z.array(z.string()).optional(),
  sortConfig: z.object({
    criteria: z.array(
      z.object({
        field: z.enum([
          "relevance",
          "compliancePriority",
          "recency",
          "importance",
          "userPreference",
          "accessCount",
        ]),
        direction: z.enum(["ASC", "DESC"]),
        weight: z.number().optional(),
      }),
    ),
    context: z
      .object({
        module: z.string().optional(),
        facilityId: z.string().optional(),
        assetId: z.string().optional(),
        userId: z.string().optional(),
        userRole: z.string().optional(),
      })
      .optional(),
    personalizationEnabled: z.boolean().optional(),
  }),
});

const suggestLinksSchema = z.object({
  documentId: z.string().min(1),
});

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const action = body.action;
    const tenantId = context.tenantId;

    if (action === "sort") {
      const validated = sortRequestSchema.safeParse(body);
      if (!validated.success) {
        return NextResponse.json(
          { error: "Invalid request", details: validated.error.errors },
          { status: 400 },
        );
      }

      // Get documents if IDs provided, otherwise get all
      let documents = [];
      if (validated.data.documentIds && validated.data.documentIds.length > 0) {
        documents = await Promise.all(
          validated.data.documentIds.map((id) =>
            documentService.getDocument(id, tenantId),
          ),
        );
        documents = documents.filter(Boolean) as any[];
      } else {
        const result = await documentService.getDocuments({
          tenantId,
          pagination: { page: 1, pageSize: 100 },
        });
        documents = result.documents;
      }

      const sortResult =
        await documentIntelligenceService.sortDocumentsIntelligently(
          documents,
          validated.data.sortConfig,
        );

      return NextResponse.json(sortResult);
    }

    if (action === "suggest-links") {
      const validated = suggestLinksSchema.safeParse(body);
      if (!validated.success) {
        return NextResponse.json(
          { error: "Invalid request", details: validated.error.errors },
          { status: 400 },
        );
      }

      const suggestions = await documentService.suggestLinks(
        validated.data.documentId,
        tenantId,
      );

      return NextResponse.json({ suggestions });
    }

    if (action === "auto-classify") {
      const { title, description, content } = body;
      const classification =
        await documentIntelligenceService.autoClassifyDocument(
          title,
          description || "",
          content,
        );

      return NextResponse.json(classification);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in document intelligence:", error);
    return NextResponse.json(
      { error: "Failed to process intelligence request" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.documents.intelligence",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
