import { NextRequest, NextResponse } from "next/server";
import { documentService } from "@/lib/services/iso-ims/documentService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

const createDocumentSchema = z.object({
  tenantId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  documentType: z.enum([
    "POLICY",
    "PROCEDURE",
    "WORK_INSTRUCTION",
    "FORM",
    "RECORD",
    "MANUAL",
    "SPECIFICATION",
    "CERTIFICATE",
    "OTHER",
  ]),
  category: z.enum([
    "QUALITY",
    "ENVIRONMENTAL",
    "SAFETY",
    "INFORMATION_SECURITY",
    "GENERAL",
  ]),
  owner: z.string().min(1),
  author: z.string().min(1),
  content: z.string().optional(),
  fileUrl: z.string().optional(),
  fileType: z.string().optional(),
  isoStandards: z.array(z.string()).optional(),
  clauses: z.array(z.string()).optional(),
  accessLevel: z.enum(["PUBLIC", "RESTRICTED", "CONFIDENTIAL"]),
  // Facility Management Integration
  facilityId: z.string().optional(),
  linkedFacilities: z.array(z.string()).optional(),
  linkedAssets: z.array(z.string()).optional(),
  linkedSpaces: z.array(z.string()).optional(),
  linkedCADDrawings: z.array(z.string()).optional(),
  // Intelligent Classification
  enableAutoClassification: z.boolean().optional(),
});

async function getHandler(req: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId") || context.tenantId || "default";

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const facilityId = searchParams.get("facilityId");
    const assetId = searchParams.get("assetId");
    const intelligentSort = searchParams.get("intelligentSort") !== "false";

    const result = await documentService.getDocuments({
      tenantId,
      pagination: { page, pageSize },
      filters: {
        search: searchParams.get("search") || undefined,
        documentType: searchParams.get("documentType") || undefined,
        category: searchParams.get("category") || undefined,
        status: searchParams.get("status") || undefined,
      },
      context:
        facilityId || assetId
          ? {
              facilityId: facilityId || undefined,
              assetId: assetId || undefined,
            }
          : undefined,
      intelligentSort,
    } as any);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching Documents:", error);
    // Return empty results instead of 500 for better UX
    return NextResponse.json({
      documents: [],
      total: 0,
      page: 1,
      pageSize: 20,
      message: "No documents found",
    });
  }
}

async function postHandler(req: NextRequest, context: APIRequestContext) {
  try {
    const body = await req.json();
    const validated = createDocumentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error.format() },
        { status: 400 },
      );
    }

    const doc = await documentService.createDocument(validated.data);
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("Error creating Document:", error);
    return NextResponse.json(
      { error: "Failed to create Document" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.documents",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.documents",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
