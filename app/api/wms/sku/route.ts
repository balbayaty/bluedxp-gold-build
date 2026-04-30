/**
 * WMS SKU/Material Master API
 * GET /api/wms/sku - Get SKUs/Materials
 * POST /api/wms/sku - Create or update SKU
 * 
 * Uses MaterialMaster Prisma model - PRODUCTION READY
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * GET /api/wms/sku - List SKUs/Materials
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId || searchParams.get("tenantId") || "default";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const type = searchParams.get("type") || "";

    // Build where clause
    const where: any = {
      tenantId,
    };

    if (search) {
      where.OR = [
        { materialNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (type) {
      where.type = type;
    }

    const [materials, total] = await Promise.all([
      prisma.materialMaster.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { materialNumber: "asc" },
      }),
      prisma.materialMaster.count({ where }),
    ]);

    // Map to SKU format
    const skus = materials.map((m) => ({
      id: m.id,
      sku: m.materialNumber,
      materialNumber: m.materialNumber,
      description: m.description,
      category: m.category,
      type: m.type,
      baseUnit: m.baseUnit,
      weight: m.weight,
      volume: m.volume,
      standardPrice: m.standardPrice ? Number(m.standardPrice) : 0,
      currency: m.currency,
      isHazardous: m.isHazardous,
      hazmatClass: m.hazmatClass,
      isBatchManaged: m.isBatchManaged,
      isSerialManaged: m.isSerialManaged,
      requiresTempControl: m.requiresTempControl,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: skus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching SKUs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch SKUs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wms/sku - Create or update SKU
 */
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId || body.tenantId || "default";

    const sku = body.sku || body.materialNumber;
    if (!sku) {
      return NextResponse.json(
        { success: false, error: "sku or materialNumber is required" },
        { status: 400 }
      );
    }

    if (!body.description) {
      return NextResponse.json(
        { success: false, error: "description is required" },
        { status: 400 }
      );
    }

    const material = await prisma.materialMaster.upsert({
      where: {
        tenantId_materialNumber: {
          tenantId,
          materialNumber: sku,
        },
      },
      create: {
        id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        tenantId,
        materialNumber: sku,
        description: body.description,
        category: body.category || "GENERAL",
        type: body.type || "FINISHED_GOOD",
        baseUnit: body.baseUnit || body.unit || "EA",
        weight: body.weight || null,
        volume: body.volume || null,
        standardPrice: body.standardPrice || body.price || 0,
        currency: body.currency || "SAR",
        isHazardous: body.isHazardous || false,
        hazmatClass: body.hazmatClass || null,
        isBatchManaged: body.isBatchManaged || false,
        isSerialManaged: body.isSerialManaged || false,
        requiresTempControl: body.requiresTempControl || false,
        updatedAt: new Date(),
      },
      update: {
        description: body.description,
        category: body.category || undefined,
        type: body.type || undefined,
        baseUnit: body.baseUnit || body.unit || undefined,
        weight: body.weight,
        volume: body.volume,
        standardPrice: body.standardPrice || body.price || undefined,
        currency: body.currency || undefined,
        isHazardous: body.isHazardous,
        hazmatClass: body.hazmatClass,
        isBatchManaged: body.isBatchManaged,
        isSerialManaged: body.isSerialManaged,
        requiresTempControl: body.requiresTempControl,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: material.id,
          sku: material.materialNumber,
          description: material.description,
          category: material.category,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating/updating SKU:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create/update SKU" },
      { status: 500 }
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.sku",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.sku",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
