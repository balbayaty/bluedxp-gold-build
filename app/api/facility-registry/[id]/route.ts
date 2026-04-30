/**
 * Unified Facility Registry API - Individual Facility
 *
 * GET, PUT, DELETE operations for specific facility
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { facilityRegistryService } from "@/lib/services/facility-registry/facilityRegistryService";
import type { FacilityUpdateInput } from "@/types/unified-facility";

/**
 * GET /api/facility-registry/[id]
 * Get facility by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAPIGateway(
    async (req: NextRequest, context) => {
      try {
        const { id } = params;
        const tenantId = context.tenantId || "";

        if (!tenantId) {
          return NextResponse.json(
            {
              success: false,
              error: "tenantId is required",
            },
            { status: 400 },
          );
        }

        const facility = await facilityRegistryService.getFacility(
          id,
          tenantId,
          ["all"],
        );

        if (!facility) {
          return NextResponse.json(
            {
              success: false,
              error: "Facility not found",
            },
            { status: 404 },
          );
        }

        return NextResponse.json(
          {
            success: true,
            data: facility,
          },
          { status: 200 },
        );
      } catch (error: any) {
        console.error("Error fetching facility:", error);
        return NextResponse.json(
          {
            success: false,
            error: error.message || "Failed to fetch facility",
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

/**
 * PUT /api/facility-registry/[id]
 * Update facility
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAPIGateway(
    async (req: NextRequest, context) => {
      try {
        const { id } = params;
        const tenantId = context.tenantId || "";
        const body = await req.json();

        if (!tenantId) {
          return NextResponse.json(
            {
              success: false,
              error: "tenantId is required",
            },
            { status: 400 },
          );
        }

        const input: FacilityUpdateInput = {
          ...body,
          updatedBy: context.userId,
        };

        const facility = await facilityRegistryService.updateFacility(
          id,
          tenantId,
          input,
        );

        return NextResponse.json(
          {
            success: true,
            data: facility,
            message: "Facility updated successfully",
          },
          { status: 200 },
        );
      } catch (error: any) {
        console.error("Error updating facility:", error);
        return NextResponse.json(
          {
            success: false,
            error: error.message || "Failed to update facility",
          },
          { status: 500 },
        );
      }
    },
    {
      moduleId: "FACILITY_MANAGEMENT",
      featureId: "FACILITY_REGISTRY",
      action: "UPDATE",
      requireAuth: true,
      rateLimit: true,
    },
  )(request, {} as any);
}

/**
 * DELETE /api/facility-registry/[id]
 * Delete facility (soft delete - sets status to CLOSED)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAPIGateway(
    async (req: NextRequest, context) => {
      try {
        const { id } = params;
        const tenantId = context.tenantId || "";

        if (!tenantId) {
          return NextResponse.json(
            {
              success: false,
              error: "tenantId is required",
            },
            { status: 400 },
          );
        }

        // Soft delete - update status to CLOSED
        const facility = await facilityRegistryService.updateFacility(
          id,
          tenantId,
          {
            status: "CLOSED",
            updatedBy: context.userId,
          },
        );

        return NextResponse.json(
          {
            success: true,
            data: facility,
            message: "Facility deleted successfully",
          },
          { status: 200 },
        );
      } catch (error: any) {
        console.error("Error deleting facility:", error);
        return NextResponse.json(
          {
            success: false,
            error: error.message || "Failed to delete facility",
          },
          { status: 500 },
        );
      }
    },
    {
      moduleId: "FACILITY_MANAGEMENT",
      featureId: "FACILITY_REGISTRY",
      action: "DELETE",
      requireAuth: true,
      rateLimit: true,
    },
  )(request, {} as any);
}
