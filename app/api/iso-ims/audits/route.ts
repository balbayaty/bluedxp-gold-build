/**
 * ISO-IMS Audit API Route
 * GET /api/iso-ims/audits - List audits
 * POST /api/iso-ims/audits - Create audit
 * 
 * Uses Prisma iso_ims_audits model via auditService - PRODUCTION READY
 */

import { NextRequest, NextResponse } from "next/server";
import { auditService } from "@/lib/services/iso-ims/auditService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// Validation schema for creating audit
const createAuditSchema = z.object({
  tenantId: z.string().min(1),
  customerId: z.string().optional(),
  warehouseId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  auditType: z.enum(["INTERNAL", "EXTERNAL", "SUPPLIER", "CERTIFICATION", "SURVEILLANCE"]),
  scope: z.enum(["DEPARTMENT", "FACILITY", "PROCESS", "PRODUCT", "SYSTEM", "FULL"]),
  isoStandards: z.array(z.string()),
  clauses: z.array(z.string()).optional(),
  plannedDate: z.string().or(z.date()).transform((val) => new Date(val)),
  duration: z.number().optional(),
  leadAuditor: z.string().min(1),
  auditTeam: z.array(z.object({
    userId: z.string(),
    role: z.string(),
  })),
  auditLocation: z.string().optional(),
  createdBy: z.string().min(1),
});

/**
 * GET /api/iso-ims/audits - List audits
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = context.tenantId || searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant ID is required" },
        { status: 400 },
      );
    }

    // Parse filters
    const status = searchParams.get("status")
      ? searchParams.get("status")?.split(",")
      : undefined;
    const auditType = searchParams.get("auditType")
      ? searchParams.get("auditType")?.split(",")
      : undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const result = await auditService.getAudits({
      tenantId,
      filter: {
        tenantId,
        status: status?.[0],
        auditType: auditType?.[0],
      },
      pagination: {
        offset: (page - 1) * pageSize,
        limit: pageSize,
      },
      sort: {
        field: "createdAt",
        direction: "DESC",
      },
    });

    return NextResponse.json({
      success: true,
      audits: result.audits,
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching audits:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch audits" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/iso-ims/audits - Create audit
 */
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();

    // Override tenantId and createdBy from auth context
    body.tenantId = context.tenantId || body.tenantId;
    if (!body.createdBy) {
      body.createdBy = context.userId || "system";
    }

    const validatedData = createAuditSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validatedData.error.format(),
        },
        { status: 400 },
      );
    }

    const audit = await auditService.createAudit(validatedData.data);

    return NextResponse.json(
      {
        success: true,
        audit,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating audit:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create audit",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.audit",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.audit",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
