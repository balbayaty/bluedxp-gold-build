/**
 * QHSE Incidents API Route
 * Handles incident CRUD operations
 * Production-ready with comprehensive validation, security, and error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseIncidentService } from "@/lib/services/qhse";
import { z } from "zod";
import type { Incident, IncidentFilters } from "@/types/qhse";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// Validation schemas
const createIncidentSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID is required"),
  customerId: z.string().optional(),
  warehouseId: z.string().optional(),
  facilityId: z.string().optional(),
  incidentNumber: z.string().optional(),
  type: z.enum([
    "NEAR_MISS",
    "FIRST_AID",
    "MEDICAL_TREATMENT",
    "LOST_TIME",
    "FATALITY",
    "PROPERTY_DAMAGE",
    "ENVIRONMENTAL_RELEASE",
    "FIRE",
    "EXPLOSION",
    "CHEMICAL_SPILL",
    "PPE_NON_COMPLIANCE",
    "SAFETY_VIOLATION",
    "OTHER",
  ]),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  status: z
    .enum([
      "REPORTED",
      "UNDER_INVESTIGATION",
      "INVESTIGATION_COMPLETE",
      "CORRECTIVE_ACTION_REQUIRED",
      "CLOSED",
      "ARCHIVED",
    ])
    .optional(),
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  locationDetails: z.string().optional(),
  occurredAt: z
    .string()
    .or(z.date())
    .transform((val) => (typeof val === "string" ? val : val.toISOString())),
  reportedAt: z
    .string()
    .or(z.date())
    .transform((val) => (typeof val === "string" ? val : val.toISOString()))
    .optional(),
  reportedBy: z.string().min(1, "Reported by is required"),
  peopleInvolved: z
    .array(
      z.object({
        personId: z.string(),
        personName: z.string(),
        role: z.string(),
        injuryType: z.string().optional(),
        severity: z.string().optional(),
      }),
    )
    .optional(),
  oshaRecordable: z.boolean().optional(),
  oshaClassification: z.string().optional(),
  riddorReportable: z.boolean().optional(),
  riddorClassification: z.string().optional(),
  photos: z.array(z.string().url()).optional(),
  documents: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  assignedTo: z.string().optional(),
  createdBy: z.string().min(1, "Created by is required"),
  updatedBy: z.string().optional(),
});

// GET - List incidents
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: IncidentFilters = {
      tenantId: searchParams.get("tenantId") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      warehouseId: searchParams.get("warehouseId") || undefined,
      facilityId: searchParams.get("facilityId") || undefined,
      type: (searchParams.get("type") as Incident["type"]) || undefined,
      severity:
        (searchParams.get("severity") as Incident["severity"]) || undefined,
      status: (searchParams.get("status") as Incident["status"]) || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      assignedTo: searchParams.get("assignedTo") || undefined,
      tags: searchParams.get("tags")?.split(",") || undefined,
    };

    const incidents = await qhseIncidentService.getIncidents(filters);

    return NextResponse.json({
      success: true,
      data: incidents,
      count: incidents.length,
    });
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch incidents",
      },
      { status: 500 },
    );
  }
}

// POST - Create incident
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const validatedData = createIncidentSchema.safeParse({
      ...body,
      occurredAt: body.occurredAt || new Date().toISOString(),
      reportedAt: body.reportedAt || new Date().toISOString(),
      status: body.status || "REPORTED",
      oshaRecordable: body.oshaRecordable || false,
      riddorReportable: body.riddorReportable || false,
      createdBy: body.createdBy || body.reportedBy,
      updatedBy:
        body.updatedBy || body.reportedBy || body.createdBy || body.reportedBy,
    });

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

    const incident = await qhseIncidentService.createIncident(
      validatedData.data,
    );

    return NextResponse.json(
      {
        success: true,
        data: incident,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating incident:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create incident",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.incidents",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.incidents",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
