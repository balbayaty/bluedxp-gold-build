/**
 * Initialize Warehouse Mock Data API
 * Creates warehouses and areas for testing MSDS warehouse assignment
 * BlueDXP Platform - MSDS Integration
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeWarehouseMockData } from "@/utils/warehouseAreaMockData";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * POST /api/warehouse/initialize-mock-data
 * Initialize comprehensive mock data for warehouses and areas
 */
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { warehouses, areas, standaloneAreas, crossModuleAreas } =
      await initializeWarehouseMockData();

    return NextResponse.json({
      success: true,
      message: "Mock data initialized successfully",
      data: {
        warehouses: warehouses.length,
        areas: areas.length,
        standaloneAreas: standaloneAreas.length,
        crossModuleAreas: crossModuleAreas.length,
        total:
          warehouses.length +
          areas.length +
          standaloneAreas.length +
          crossModuleAreas.length,
      },
      summary: {
        warehouses: warehouses.map((w) => ({
          id: w.id,
          code: w.warehouseCode,
          name: w.warehouseName,
          city: w.location.city,
        })),
        areasByType: {
          warehouseAreas: areas.length,
          standalone: standaloneAreas.length,
          crossModule: crossModuleAreas.length,
        },
      },
    });
  } catch (error) {
    console.error("Error initializing mock data:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to initialize mock data",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/warehouse/initialize-mock-data
 * Get status of mock data
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { warehouseAreaService } = require("@/lib/services/wms/areaService");
    const {
      generateMultiTenantWarehouses,
    } = require("@/utils/mockDataGenerators");

    const warehouses = generateMultiTenantWarehouses(15);
    const allAreas = await warehouseAreaService.listAreas({});
    const standaloneAreas = await warehouseAreaService.listAreas({
      standalone: true,
    });
    const crossModuleAreas = await warehouseAreaService.listAreas({
      linkedModuleId: "tms",
    });

    return NextResponse.json({
      success: true,
      data: {
        warehouses: warehouses.length,
        totalAreas: allAreas.length,
        standaloneAreas: standaloneAreas.length,
        crossModuleAreas: crossModuleAreas.length,
        areasByWarehouse: warehouses.map((w: any) => ({
          warehouseId: w.id,
          warehouseName: w.warehouseName,
          areaCount: allAreas.filter((a: any) => a.warehouseId === w.id).length,
        })),
      },
    });
  } catch (error) {
    console.error("Error getting mock data status:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get mock data status",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.mock-data",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.mock-data",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
