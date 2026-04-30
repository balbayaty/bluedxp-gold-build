import { NextRequest, NextResponse } from "next/server";
import { ncrService } from "@/lib/services/iso-ims/ncrService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { eventBus, createEvent } from "@/lib/services/event-store";

// Validation schema for creating NCR
const createNCRSchema = z.object({
  tenantId: z.string().min(1),
  customerId: z.string().optional(),
  warehouseId: z.string().optional(),
  subject: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  severity: z.enum(["MINOR", "MAJOR", "CRITICAL"]),
  ncType: z.enum([
    "PRODUCT",
    "PROCESS",
    "SYSTEM",
    "SUPPLIER",
    "CUSTOMER",
    "DOCUMENTATION",
    "TRAINING",
    "OTHER",
  ]),
  reportedBy: z.string().min(1),
  reportedDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  reportedLocation: z.string().optional(),
  assignedTo: z.string().optional(),
  department: z.string().optional(),
  immediateAction: z.string().optional(),
  immediateActionTaken: z.boolean().optional(),
  linkedMaterial: z.string().optional(),
  linkedBatch: z.string().optional(),
  linkedSO: z.string().optional(),
  linkedPO: z.string().optional(),
  linkedLocation: z.string().optional(),
  linkedCustomer: z.string().optional(),
  linkedSupplier: z.string().optional(),
  linkedAudit: z.string().optional(),
  createdBy: z.string().optional(), // Optional, defaults to reportedBy in service
});

async function getHandler(req: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 },
      );
    }

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
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const result = await ncrService.getNCRs({
      tenantId,
      filter: {
        status: status?.[0],
        priority: priority?.[0],
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
      data: result.ncrs,
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching NCRs:", error);
    return NextResponse.json(
      { error: "Failed to fetch NCRs" },
      { status: 500 },
    );
  }
}

async function postHandler(req: NextRequest, context: APIRequestContext) {
  try {
    const body = await req.json();

    const validatedData = createNCRSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedData.error.format() },
        { status: 400 },
      );
    }

    const ncr = await ncrService.createNCR(validatedData.data);

    // Publish event to Event Bus (service may already publish, but ensure it here too)
    try {
      const event = createEvent(
        "iso-ims.ncr.created",
        ncr.id,
        "NCR",
        {
          ncrId: ncr.id,
          ncrNumber: ncr.ncrNumber,
          subject: ncr.subject,
          status: ncr.status,
          priority: ncr.priority,
          severity: ncr.severity,
          tenantId: validatedData.data.tenantId,
          createdAt: new Date(),
        },
        1,
        {
          tenantId: validatedData.data.tenantId,
          userId: context.userId || validatedData.data.reportedBy || "system",
        },
      );
      await eventBus.publish(event);
    } catch (error) {
      console.error("Error publishing NCR creation event:", error);
      // Don't throw - creation should succeed even if event publishing fails
    }

    return NextResponse.json(
      {
        success: true,
        data: ncr,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating NCR:", error);
    return NextResponse.json(
      {
        error: "Failed to create NCR",
        message: error instanceof Error ? error.message : "Unknown error",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.stack
              : undefined
            : undefined,
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.ncr",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.ncr",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
