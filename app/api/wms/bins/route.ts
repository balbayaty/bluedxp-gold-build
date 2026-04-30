/**
 * WMS Bins API
 * GET /api/wms/bins - List all storage bins
 * POST /api/wms/bins - Create a new bin
 * 
 * Uses Prisma storageBin model via binService - PRODUCTION READY
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * GET /api/wms/bins - List bins
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId || searchParams.get("tenantId") || "default";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const warehouseId = searchParams.get("warehouseId") || "";
    const areaId = searchParams.get("areaId") || "";
    const zone = searchParams.get("zone") || "";
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    // Build where clause
    const where: any = {
      tenantId,
    };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (areaId) {
      where.areaId = areaId;
    }

    if (zone) {
      where.zone = zone;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { binCode: { contains: search, mode: "insensitive" } },
        { tempBinCode: { contains: search, mode: "insensitive" } },
      ];
    }

    const [bins, total] = await Promise.all([
      prisma.storageBin.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { binCode: "asc" },
        include: {
          area: true,
        },
      }),
      prisma.storageBin.count({ where }),
    ]);

    // Map to expected format
    const mappedBins = bins.map((b) => ({
      id: b.id,
      binCode: b.binCode || b.tempBinCode,
      zone: b.zone || (b.area as any)?.zone || "",
      aisle: b.aisle || "",
      rack: b.rack || "",
      level: b.level || "",
      binType: b.binType || "PALLET",
      capacity: b.capacity || 0,
      currentStock: b.currentStock || 0,
      availableCapacity: (b.capacity || 0) - (b.currentStock || 0),
      utilization: b.capacity ? ((b.currentStock || 0) / b.capacity) * 100 : 0,
      maxWeight: b.maxWeight ? Number(b.maxWeight) : 0,
      currentWeight: b.currentWeight ? Number(b.currentWeight) : 0,
      status: b.status || "EMPTY",
      warehouseId: b.warehouseId,
      areaId: b.areaId,
      areaName: (b.area as any)?.areaName || "",
      allowedMaterialTypes: b.allowedMaterialTypes || [],
      restrictions: b.restrictions || "",
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: mappedBins,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching bins:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bins" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wms/bins - Create bin
 */
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId || body.tenantId || "default";

    if (!body.binCode) {
      return NextResponse.json(
        { success: false, error: "binCode is required" },
        { status: 400 }
      );
    }

    const bin = await prisma.storageBin.create({
      data: {
        id: `bin-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        tenantId,
        binCode: body.binCode,
        tempBinCode: body.binCode,
        warehouseId: body.warehouseId || null,
        areaId: body.areaId || null,
        zone: body.zone || null,
        aisle: body.aisle || null,
        rack: body.rack || null,
        level: body.level || null,
        binType: body.binType || "PALLET",
        capacity: body.capacity || 100,
        currentStock: body.currentStock || 0,
        maxWeight: body.maxWeight || 1000,
        currentWeight: body.currentWeight || 0,
        status: body.status || "EMPTY",
        allowedMaterialTypes: body.allowedMaterialTypes || [],
        restrictions: body.restrictions || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: bin.id,
          binCode: bin.binCode,
          status: bin.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating bin:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Bin with this code already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to create bin" },
      { status: 500 }
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.bins",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.bins",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
