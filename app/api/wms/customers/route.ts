/**
 * WMS Customers API
 * GET /api/wms/customers - List all customers
 * POST /api/wms/customers - Create a new customer
 * 
 * Uses Prisma customers model - PRODUCTION READY
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { eventBus, createEvent } from "@/lib/services/event-store";

/**
 * GET /api/wms/customers - List customers
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId || searchParams.get("tenantId") || "default";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";

    // Build where clause
    const where: any = {
      tenantId,
      deletedAt: null, // Only active customers
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customers.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.customers.count({ where }),
    ]);

    // Map to expected format
    const mappedCustomers = customers.map((c) => ({
      id: c.id,
      customerNumber: c.code,
      customerName: c.name,
      status: c.status,
      type: c.type,
      contactPerson: (c.contactInfo as any)?.contactPerson || "",
      email: (c.contactInfo as any)?.email || "",
      phone: (c.contactInfo as any)?.phone || "",
      address: (c.contactInfo as any)?.address || "",
      city: (c.contactInfo as any)?.city || "",
      country: (c.contactInfo as any)?.country || "",
      postalCode: (c.contactInfo as any)?.postalCode || "",
      paymentTerms: (c.billingInfo as any)?.paymentTerms || "Net 30",
      creditLimit: (c.billingInfo as any)?.creditLimit || 0,
      currency: (c.billingInfo as any)?.currency || "SAR",
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: mappedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wms/customers - Create customer
 */
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId || body.tenantId || "default";

    if (!body.customerName || !body.customerNumber) {
      return NextResponse.json(
        { success: false, error: "customerName and customerNumber are required" },
        { status: 400 }
      );
    }

    const customer = await prisma.customers.create({
      data: {
        id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        tenantId,
        name: body.customerName,
        code: body.customerNumber,
        type: body.type || "DIRECT",
        status: body.status || "ACTIVE",
        contactInfo: {
          contactPerson: body.contactPerson || "",
          email: body.email || "",
          phone: body.phone || "",
          address: body.address || "",
          city: body.city || "",
          country: body.country || "",
          postalCode: body.postalCode || "",
        },
        billingInfo: {
          paymentTerms: body.paymentTerms || "Net 30",
          creditLimit: body.creditLimit || 0,
          currency: body.currency || "SAR",
        },
        updatedAt: new Date(),
      },
    });

    // Publish event to Event Bus
    try {
      const event = createEvent(
        "wms.customer.created",
        customer.id,
        "CUSTOMER",
        {
          customerId: customer.id,
          customerNumber: customer.code,
          customerName: customer.name,
          status: customer.status,
          type: customer.type,
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
      console.error("Error publishing customer creation event:", error);
      // Don't throw - creation should succeed even if event publishing fails
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: customer.id,
          customerNumber: customer.code,
          customerName: customer.name,
          status: customer.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating customer:", error);
    
    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Customer with this code already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to create customer" },
      { status: 500 }
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.customers",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.customers",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
