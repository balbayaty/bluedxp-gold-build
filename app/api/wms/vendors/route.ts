/**
 * WMS Vendors API
 * GET /api/wms/vendors - Get all vendors
 * POST /api/wms/vendors - Create a new vendor
 * 
 * Uses Prisma Vendor model - PRODUCTION READY
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { eventBus, createEvent } from "@/lib/services/event-store";

/**
 * GET /api/wms/vendors - List vendors
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId || searchParams.get("tenantId") || "default";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const vendorType = searchParams.get("vendorType") || "";

    // Build where clause
    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { vendorNumber: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (vendorType) {
      where.vendorType = vendorType;
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.vendor.count({ where }),
    ]);

    // Map to expected format
    const mappedVendors = vendors.map((v) => ({
      id: v.id,
      vendorNumber: v.vendorNumber,
      name: v.name,
      legalName: v.legalName,
      vendorType: v.vendorType,
      status: v.status,
      email: v.email,
      phone: v.phone,
      website: v.website,
      taxId: v.taxId,
      currency: v.currency,
      paymentTerms: v.paymentTerms,
      leadTime: v.leadTime,
      minimumOrderValue: v.minimumOrderValue ? Number(v.minimumOrderValue) : null,
      qualityRating: v.qualityRating ? Number(v.qualityRating) : null,
      deliveryRating: v.deliveryRating ? Number(v.deliveryRating) : null,
      complianceScore: v.complianceScore ? Number(v.complianceScore) : null,
      isApproved: v.isApproved,
      isPreferred: v.isPreferred,
      categories: v.categories,
      certifications: v.certifications,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: mappedVendors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wms/vendors - Create vendor
 */
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId || body.tenantId || "default";

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "name is required" },
        { status: 400 }
      );
    }

    // Generate vendor number if not provided
    const vendorNumber = body.vendorNumber || `VND-${Date.now().toString().slice(-8)}`;

    const vendor = await prisma.vendor.create({
      data: {
        id: `vnd-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        tenantId,
        vendorNumber,
        name: body.name,
        legalName: body.legalName || null,
        vendorType: body.vendorType || "SUPPLIER",
        status: body.status || "ACTIVE",
        email: body.email || null,
        phone: body.phone || null,
        website: body.website || null,
        taxId: body.taxId || null,
        currency: body.currency || "SAR",
        paymentTerms: body.paymentTerms || null,
        leadTime: body.leadTime || null,
        minimumOrderValue: body.minimumOrderValue || null,
        qualityRating: body.qualityRating || null,
        deliveryRating: body.deliveryRating || null,
        isApproved: body.isApproved ?? true,
        isPreferred: body.isPreferred ?? false,
        categories: body.categories || [],
        certifications: body.certifications || [],
        primaryAddress: body.primaryAddress || null,
        billingAddress: body.billingAddress || null,
        createdBy: body.createdBy || null,
      },
    });

    // Publish event to Event Bus
    try {
      const event = createEvent(
        "wms.vendor.created",
        vendor.id,
        "VENDOR",
        {
          vendorId: vendor.id,
          vendorNumber: vendor.vendorNumber,
          vendorName: vendor.name,
          status: vendor.status,
          vendorType: vendor.vendorType,
          tenantId,
          createdAt: new Date(),
        },
        1,
        {
          tenantId,
          userId: context.userId || "system",
        },
      );
      await eventBus.publish(event);
    } catch (error) {
      console.error("Error publishing vendor creation event:", error);
      // Don't throw - creation should succeed even if event publishing fails
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: vendor.id,
          vendorNumber: vendor.vendorNumber,
          name: vendor.name,
          status: vendor.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating vendor:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Vendor with this number already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create vendor" },
      { status: 500 }
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.vendors",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.vendors",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
