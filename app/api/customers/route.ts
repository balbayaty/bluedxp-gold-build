/**
 * Customers API
 * GET /api/customers - Get all customers
 * POST /api/customers - Create a new customer
 * 
 * Uses Prisma Customer model - PRODUCTION READY
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * GET /api/customers - List customers
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId || searchParams.get("tenantId") || "default";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const customerType = searchParams.get("customerType") || "";
    const segment = searchParams.get("segment") || "";

    // Build where clause
    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { customerNumber: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerType) {
      where.customerType = customerType;
    }

    if (segment) {
      where.segment = segment;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.customer.count({ where }),
    ]);

    // Map to expected format
    const mappedCustomers = customers.map((c) => ({
      id: c.id,
      customerNumber: c.customerNumber,
      name: c.name,
      legalName: c.legalName,
      customerType: c.customerType,
      status: c.status,
      email: c.email,
      phone: c.phone,
      website: c.website,
      taxId: c.taxId,
      vatNumber: c.vatNumber,
      currency: c.currency,
      paymentTerms: c.paymentTerms,
      creditLimit: c.creditLimit ? Number(c.creditLimit) : null,
      creditUsed: c.creditUsed ? Number(c.creditUsed) : 0,
      creditRating: c.creditRating,
      industry: c.industry,
      segment: c.segment,
      tier: c.tier,
      isActive: c.isActive,
      accountManager: c.accountManager,
      tags: c.tags,
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
 * POST /api/customers - Create customer
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

    // Generate customer number if not provided
    const customerNumber = body.customerNumber || `CUS-${Date.now().toString().slice(-8)}`;

    const customer = await prisma.customer.create({
      data: {
        id: `cus-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        tenantId,
        customerNumber,
        name: body.name,
        legalName: body.legalName || null,
        customerType: body.customerType || "CORPORATE",
        status: body.status || "ACTIVE",
        email: body.email || null,
        phone: body.phone || null,
        website: body.website || null,
        taxId: body.taxId || null,
        vatNumber: body.vatNumber || null,
        currency: body.currency || "SAR",
        paymentTerms: body.paymentTerms || null,
        creditLimit: body.creditLimit || null,
        creditRating: body.creditRating || null,
        industry: body.industry || null,
        segment: body.segment || null,
        tier: body.tier || "STANDARD",
        isActive: body.isActive ?? true,
        primaryAddress: body.primaryAddress || null,
        billingAddress: body.billingAddress || null,
        shippingAddress: body.shippingAddress || null,
        contacts: body.contacts || null,
        preferences: body.preferences || null,
        tags: body.tags || [],
        notes: body.notes || null,
        accountManager: body.accountManager || null,
        createdBy: body.createdBy || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: customer.id,
          customerNumber: customer.customerNumber,
          name: customer.name,
          status: customer.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating customer:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Customer with this number already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create customer" },
      { status: 500 }
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "crm",
  featureId: "crm.customers",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "crm",
  featureId: "crm.customers",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
