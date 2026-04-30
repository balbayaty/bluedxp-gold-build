/**
 * ISO-IMS CAPA API Route
 * Production-ready API with comprehensive validation, security, and error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { capaService } from "@/lib/services/iso-ims/capaService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { eventBus, createEvent } from "@/lib/services/event-store";

// Validation schemas
const createCAPASchema = z.object({
  tenantId: z.string().min(1, "Tenant ID is required"),
  customerId: z.string().optional(),
  warehouseId: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  capaType: z.enum(["CORRECTIVE_ACTION", "PREVENTIVE_ACTION"]),
  capaSource: z.enum([
    "NCR",
    "AUDIT",
    "RISK_ASSESSMENT",
    "CUSTOMER_COMPLAINT",
    "MANAGEMENT_REVIEW",
    "INCIDENT",
    "INTERNAL_REVIEW",
    "OTHER",
  ]),
  assignedTo: z.string().min(1, "Assigned to is required"),
  department: z.string().min(1, "Department is required"),
  owner: z.string().min(1, "Owner is required"),
  targetDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  rootCause: z.string().optional(),
  actionPlan: z.string().min(1, "Action plan is required"),
  resourcesRequired: z.string().optional(),
  estimatedCost: z.number().optional(),
  linkedNCR: z.string().optional(),
  linkedAudit: z.string().optional(),
  linkedMaterial: z.string().optional(),
  linkedOrder: z.string().optional(),
  linkedLocation: z.string().optional(),
  linkedCustomer: z.string().optional(),
  linkedSupplier: z.string().optional(),
  linkedRisk: z.string().optional(),
  linkedIncident: z.string().optional(),
  createdBy: z.string().min(1, "Created by is required"),
});

/**
 * GET - List CAPAs with filters and pagination
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId = context.tenantId;
    const { searchParams } = new URL(request.url);

    // Parse filters
    const status = searchParams.get("status")
      ? searchParams.get("status")?.split(",")
      : undefined;
    const priority = searchParams.get("priority")
      ? searchParams.get("priority")?.split(",")
      : undefined;
    const assignedTo = searchParams.get("assignedTo")
      ? searchParams.get("assignedTo")?.split(",")
      : undefined;
    const capaType = searchParams.get("capaType")
      ? searchParams.get("capaType")?.split(",")
      : undefined;
    const customerId = searchParams.get("customerId") || undefined;
    const warehouseId = searchParams.get("warehouseId") || undefined;

    // Pagination
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(
      parseInt(searchParams.get("pageSize") || "20", 10),
      100,
    ); // Max 100 per page

    // Sorting
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // Build filters object
    const filters: any = {};
    if (status && status.length > 0) filters.status = status;
    if (priority && priority.length > 0) filters.priority = priority;
    if (assignedTo && assignedTo.length > 0) filters.assignedTo = assignedTo;

    const result = await capaService.getCAPAs({
      tenantId,
      customerId,
      warehouseId,
      filter: Object.keys(filters).length > 0 ? filters : undefined,
      pagination: {
        page,
        pageSize,
      },
      sort: {
        field: sortBy,
        direction: sortOrder.toUpperCase() as "ASC" | "DESC",
      },
    });

    console.log("CAPA API GET response:", {
      tenantId,
      count: result.capas.length,
      total: result.total,
      capaNumbers: result.capas.map((c) => c.capaNumber),
    });

    return NextResponse.json({
      success: true,
      data: result.capas,
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching CAPAs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch CAPAs",
      },
      { status: 500 },
    );
  }
}

/**
 * POST - Create new CAPA
 */
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();

    // Override tenantId and createdBy from auth context for security
    body.tenantId = context.tenantId;
    if (!body.createdBy) {
      body.createdBy = context.userId;
    }

    // Validate input
    const validatedData = createCAPASchema.safeParse(body);

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

    // Create CAPA
    console.log("Creating CAPA with data:", {
      tenantId: validatedData.data.tenantId,
      subject: validatedData.data.subject,
      capaType: validatedData.data.capaType,
    });

    const capa = await capaService.createCAPA(validatedData.data);

    // Publish event to Event Bus (service may already publish, but ensure it here too)
    try {
      const event = createEvent(
        "iso-ims.capa.created",
        capa.id,
        "CAPA",
        {
          capaId: capa.id,
          capaNumber: capa.capaNumber,
          subject: capa.subject,
          status: capa.status,
          priority: capa.priority,
          capaType: capa.capaType,
          tenantId: validatedData.data.tenantId,
          createdAt: new Date(),
        },
        1,
        {
          tenantId: validatedData.data.tenantId,
          userId: context.userId || validatedData.data.createdBy || "system",
        },
      );
      await eventBus.publish(event);
    } catch (error) {
      console.error("Error publishing CAPA creation event:", error);
      // Don't throw - creation should succeed even if event publishing fails
    }

    console.log("CAPA created successfully:", {
      id: capa.id,
      capaNumber: capa.capaNumber,
      tenantId: capa.tenantId,
    });

    return NextResponse.json(
      {
        success: true,
        data: capa,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating CAPA:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create CAPA",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.capa",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.capa",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});