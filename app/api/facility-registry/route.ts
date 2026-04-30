/**
 * Unified Facility Registry API
 *
 * Platform-level API for managing unified facilities
 * Auto-syncs to Geofence, Touchpoints, WMS, Route Analysis
 *
 * @module facility-registry-api
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { facilityRegistryService } from "@/lib/services/facility-registry/facilityRegistryService";
import { z } from "zod";
import type {
  FacilityCreateInput,
  FacilityQuery,
} from "@/types/unified-facility";

// Validation schemas
const OperatingHoursSchema = z.object({
  monday: z
    .object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    })
    .optional(),
  tuesday: z
    .object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    })
    .optional(),
  wednesday: z
    .object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    })
    .optional(),
  thursday: z
    .object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    })
    .optional(),
  friday: z
    .object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    })
    .optional(),
  saturday: z
    .object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    })
    .optional(),
  sunday: z
    .object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    })
    .optional(),
  timezone: z.string(),
  is24Hours: z.boolean().optional(),
});

const GovernmentDivisionInputSchema = z.object({
  code: z.string(),
  name: z.string(),
  nameLocal: z.string().optional(),
  type: z.string(),
  environmentalAgencyType: z.string().optional(),
  authority: z.object({
    name: z.string(),
    code: z.string(),
    country: z.string(),
    jurisdiction: z
      .enum(["NATIONAL", "REGIONAL", "LOCAL", "INTERNATIONAL"])
      .optional(),
    website: z.string().optional(),
  }),
  location: z
    .object({
      coordinates: z
        .object({
          latitude: z.number(),
          longitude: z.number(),
        })
        .optional(),
      building: z.string().optional(),
      floor: z.string().optional(),
      office: z.string().optional(),
      checkpoint: z.string().optional(),
      lane: z.string().optional(),
    })
    .optional(),
  operatingHours: OperatingHoursSchema,
  processingTimes: z
    .object({
      average: z.number().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  services: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        available: z.boolean(),
        processingTime: z.number(),
        requiresAppointment: z.boolean(),
        fee: z.number().optional(),
        currency: z.string().optional(),
      }),
    )
    .optional(),
  status: z
    .enum(["OPERATIONAL", "CLOSED", "MAINTENANCE", "EMERGENCY", "HOLIDAY"])
    .optional(),
  is24Hours: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const FacilityCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  nameLocal: z.string().optional(),
  type: z.string(),
  status: z
    .enum([
      "ACTIVE",
      "INACTIVE",
      "MAINTENANCE",
      "CLOSED",
      "PLANNED",
      "UNDER_CONSTRUCTION",
    ])
    .optional(),
  tenantId: z.string(),
  location: z.object({
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string(),
      region: z.string().optional(),
    }),
    timezone: z.string(),
    geofenceRadius: z.number().optional(),
  }),
  operatingHours: OperatingHoursSchema,
  constraints: z.array(z.any()).optional(),
  capabilities: z.array(z.any()).optional(),
  supportedTransportModes: z.array(z.string()).optional(),
  regulatoryAuthorities: z.array(z.any()).optional(),
  governmentDivisions: z.array(GovernmentDivisionInputSchema).optional(),
  environmentalAgencies: z.array(z.any()).optional(),
  licenses: z.array(z.any()).optional(),
  certifications: z.array(z.any()).optional(),
  capacity: z.any().optional(),
  processingTimes: z.any().optional(),
  contact: z.any().optional(),
  autoCreateGeofence: z.boolean().optional(),
  autoCreateTouchpoint: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * POST /api/facility-registry
 * Create new unified facility
 */
export async function POST(request: NextRequest) {
  return withAPIGateway(
    async (req: NextRequest, context) => {
      try {
        const body = await req.json();

        // Validate input
        const validationResult = FacilityCreateSchema.safeParse(body);
        if (!validationResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: "Validation failed",
              details: validationResult.error.errors,
            },
            { status: 400 },
          );
        }

        const input: FacilityCreateInput = {
          ...validationResult.data,
          createdBy: context.userId,
        };

        // Create facility
        const facility = await facilityRegistryService.createFacility(input);

        return NextResponse.json(
          {
            success: true,
            data: facility,
            message: "Facility created successfully",
          },
          { status: 201 },
        );
      } catch (error: any) {
        console.error("Error creating facility:", error);
        return NextResponse.json(
          {
            success: false,
            error: error.message || "Failed to create facility",
          },
          { status: 500 },
        );
      }
    },
    {
      moduleId: "FACILITY_MANAGEMENT",
      featureId: "FACILITY_REGISTRY",
      action: "CREATE",
      requireAuth: true,
      rateLimit: true,
    },
  )(request, {} as any);
}

/**
 * GET /api/facility-registry
 * List/search facilities
 */
export async function GET(request: NextRequest) {
  return withAPIGateway(
    async (req: NextRequest, context) => {
      try {
        const { searchParams } = new URL(req.url);
        const tenantId = context.tenantId || searchParams.get("tenantId") || "";

        if (!tenantId) {
          return NextResponse.json(
            {
              success: false,
              error: "tenantId is required",
            },
            { status: 400 },
          );
        }

        // Build query
        const query: FacilityQuery = {
          tenantId,
          ids: searchParams.get("ids")?.split(","),
          codes: searchParams.get("codes")?.split(","),
          types: searchParams.get("types")?.split(",") as any,
          status: searchParams.get("status")?.split(",") as any,
          country: searchParams.get("country") as any,
          hasGovernmentDivision: searchParams.get(
            "hasGovernmentDivision",
          ) as any,
          tags: searchParams.get("tags")?.split(","),
          search: searchParams.get("search") || undefined,
        };

        // Handle near location
        const lat = searchParams.get("lat");
        const lng = searchParams.get("lng");
        const radius = searchParams.get("radius");
        if (lat && lng && radius) {
          query.nearLocation = {
            coordinates: {
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
            },
            radius: parseFloat(radius),
          };
        }

        // Find facilities
        const facilities = await facilityRegistryService.findFacilities(query);

        return NextResponse.json(
          {
            success: true,
            data: facilities,
            count: facilities.length,
          },
          { status: 200 },
        );
      } catch (error: any) {
        console.error("Error fetching facilities:", error);
        return NextResponse.json(
          {
            success: false,
            error: error.message || "Failed to fetch facilities",
          },
          { status: 500 },
        );
      }
    },
    {
      moduleId: "FACILITY_MANAGEMENT",
      featureId: "FACILITY_REGISTRY",
      action: "READ",
      requireAuth: true,
      rateLimit: true,
    },
  )(request, {} as any);
}
