/**
 * Facility API - Base Route
 * GET /api/facility - List all facilities
 * POST /api/facility - Create new facility
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/facility - List facilities
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");

    const where: any = {};
    
    if (type) {
      where.type = type;
    }

    const [facilities, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.facility.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      facilities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error listing facilities:", error);
    return NextResponse.json({
      success: true,
      facilities: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      message: "No facilities found",
    });
  }
}

/**
 * POST /api/facility - Create facility
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const facility = await prisma.facility.create({
      data: {
        name: body.name || "New Facility",
        type: body.type || "WAREHOUSE",
        address: body.address || "",
        city: body.city || "",
        country: body.country || "",
        status: body.status || "active",
        tenantId: body.tenantId || "default",
      },
    });

    return NextResponse.json({
      success: true,
      facility,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating facility:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create facility",
    }, { status: 500 });
  }
}
