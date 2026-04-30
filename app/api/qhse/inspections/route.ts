/**
 * QHSE Inspections API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseInspectionService } from "@/lib/services/qhse";
import type { Inspection, InspectionFilters } from "@/types/qhse";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: InspectionFilters = {
      tenantId: searchParams.get("tenantId") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      warehouseId: searchParams.get("warehouseId") || undefined,
      facilityId: searchParams.get("facilityId") || undefined,
      type: (searchParams.get("type") as Inspection["type"]) || undefined,
      status: (searchParams.get("status") as Inspection["status"]) || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      conductedBy: searchParams.get("conductedBy") || undefined,
    };

    const inspections = await qhseInspectionService.getInspections(filters);

    return NextResponse.json({
      success: true,
      data: inspections,
      count: inspections.length,
    });
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch inspections",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();

    if (!body.tenantId || !body.type || !body.title || !body.scheduledDate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: tenantId, type, title, scheduledDate",
        },
        { status: 400 },
      );
    }

    const inspection = await qhseInspectionService.createInspection({
      tenantId: body.tenantId,
      customerId: body.customerId,
      warehouseId: body.warehouseId,
      facilityId: body.facilityId,
      inspectionNumber: body.inspectionNumber,
      type: body.type,
      status: body.status || "SCHEDULED",
      title: body.title,
      description: body.description,
      scheduledDate: body.scheduledDate,
      scheduledBy: body.scheduledBy,
      location: body.location,
      locationDetails: body.locationDetails,
      checklistId: body.checklistId,
      followUpRequired: body.followUpRequired || false,
      createdBy: body.createdBy || body.scheduledBy,
      updatedBy: body.updatedBy || body.scheduledBy,
    });

    return NextResponse.json(
      {
        success: true,
        data: inspection,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating inspection:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create inspection",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.inspections",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.inspections",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
