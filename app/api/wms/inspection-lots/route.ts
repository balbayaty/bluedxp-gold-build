/**
 * WMS Inspection Lots API
 * GET /api/wms/inspection-lots - Get inspection lots
 * POST /api/wms/inspection-lots - Create inspection lot
 * 
 * Uses Prisma qhse_inspections model - PRODUCTION READY
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { eventBus, createEvent } from "@/lib/services/event-store";

/**
 * GET /api/wms/inspection-lots - List inspection lots
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId || searchParams.get("tenantId") || "default";
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";
    const materialNumber = searchParams.get("materialNumber") || "";
    const batchNumber = searchParams.get("batchNumber") || "";

    // Build where clause
    const where: any = {
      tenantId,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // Get inspections (inspection lots are quality inspections)
    const inspections = await prisma.qhse_inspections.findMany({
      where,
      orderBy: { scheduledDate: "desc" },
      take: 200,
    });

    // Map to inspection lot format
    const inspectionLots = inspections.map((insp) => ({
      id: insp.id,
      inspectionLotNumber: insp.inspectionNumber,
      materialNumber: (insp.findings as any)?.materialNumber || "",
      materialDescription: (insp.findings as any)?.materialDescription || "",
      batchNumber: (insp.findings as any)?.batchNumber || "",
      quantity: (insp.findings as any)?.quantity || 0,
      unit: (insp.findings as any)?.unit || "EA",
      status: insp.status === "COMPLETED" ? "RELEASED" : 
              insp.status === "IN_PROGRESS" ? "IN_PROGRESS" :
              insp.status === "SCHEDULED" ? "CREATED" : "CREATED",
      inspectionType: insp.type,
      qualityStandard: insp.regulatoryStandard || "ISO 9001",
      inspector: insp.conductedBy || insp.scheduledBy,
      inspectionDate: insp.conductedDate || insp.scheduledDate,
      result: insp.status === "COMPLETED" ? "PASSED" as const :
              insp.criticalFindings > 0 ? "FAILED" as const : "IN_PROGRESS" as const,
      stages: (insp.checklistItems as any) || [],
      certificateNumber: (insp.findings as any)?.certificateNumber,
      ncrNumber: (insp.correctiveActionsRequired as any)?.[0] || undefined,
      vendorNumber: "",
      vendorName: "",
      poNumber: "",
      grNumber: "",
      location: insp.location,
      quarantineLocation: insp.locationDetails || undefined,
      qualityScore: insp.complianceScore || 100,
      defectsFound: insp.totalFindings || 0,
      defectsDescription: (insp.findings as any)?.description,
      requiresReinspection: insp.followUpRequired || false,
      reinspectionDate: insp.followUpDate || undefined,
      releasedDate: insp.approvedAt || undefined,
      releasedBy: insp.approvedBy || undefined,
      createdAt: insp.createdAt,
      updatedAt: insp.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: inspectionLots,
      count: inspectionLots.length,
    });
  } catch (error) {
    console.error("Error fetching inspection lots:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inspection lots" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wms/inspection-lots - Create inspection lot
 */
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId || body.tenantId || "default";
    const userId = context.userId || body.userId || "system";

    if (!body.materialNumber || !body.batchNumber) {
      return NextResponse.json(
        { success: false, error: "materialNumber and batchNumber are required" },
        { status: 400 }
      );
    }

    // Generate inspection number
    const inspectionNumber = `INSP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const inspection = await prisma.qhse_inspections.create({
      data: {
        id: `insp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        tenantId,
        inspectionNumber,
        type: body.inspectionType || "QUALITY",
        status: "SCHEDULED",
        title: `Inspection for ${body.materialNumber} - Batch ${body.batchNumber}`,
        description: body.description || "",
        scheduledDate: body.inspectionDate ? new Date(body.inspectionDate) : new Date(),
        scheduledBy: userId,
        location: body.location || "",
        checklistItems: body.stages || [],
        findings: {
          materialNumber: body.materialNumber,
          batchNumber: body.batchNumber,
          quantity: body.quantity || 0,
          unit: body.unit || "EA",
        },
        regulatoryStandard: body.qualityStandard || "ISO 9001",
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // Publish event to Event Bus
    try {
      const event = createEvent(
        "wms.inspection_lot.created",
        inspection.id,
        "INSPECTION_LOT",
        {
          inspectionLotId: inspection.id,
          inspectionNumber: inspection.inspectionNumber,
          materialNumber: body.materialNumber,
          batchNumber: body.batchNumber,
          status: inspection.status,
          tenantId,
          createdAt: new Date(),
        },
        1,
        {
          tenantId,
          userId,
        },
      );
      await eventBus.publish(event);
    } catch (error) {
      console.error("Error publishing inspection lot creation event:", error);
      // Don't throw - creation should succeed even if event publishing fails
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: inspection.id,
          inspectionLotNumber: inspection.inspectionNumber,
          status: inspection.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating inspection lot:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create inspection lot" },
      { status: 500 }
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.inspection_lots",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.inspection_lots",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
