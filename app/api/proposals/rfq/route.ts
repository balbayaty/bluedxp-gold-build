/**
 * RFQ API Routes
 * Handles RFQ CRUD operations
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { rfqService } from "@/lib/services/proposals/RFQService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET - List RFQs
// ============================================================================

async function GETHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const customerId = searchParams.get("customerId");

    const rfqs = await rfqService.listRFQs({
      status: status as any,
      priority: priority as any,
      customerId: customerId || undefined,
    });

    // Calculate statistics
    const allRFQs = await rfqService.listRFQs();
    const stats = {
      total: allRFQs.length,
      byStatus: {
        DRAFT: allRFQs.filter((r) => r.status === "DRAFT").length,
        SUBMITTED: allRFQs.filter((r) => r.status === "SUBMITTED").length,
        UNDER_REVIEW: allRFQs.filter((r) => r.status === "UNDER_REVIEW").length,
        PRICING: allRFQs.filter((r) => r.status === "PRICING").length,
        APPROVED: allRFQs.filter((r) => r.status === "APPROVED").length,
        SENT: allRFQs.filter((r) => r.status === "SENT").length,
        ACCEPTED: allRFQs.filter((r) => r.status === "ACCEPTED").length,
        REJECTED: allRFQs.filter((r) => r.status === "REJECTED").length,
      },
      totalValue: allRFQs.reduce((sum, r) => sum + (r.estimatedValue || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: rfqs,
      stats,
      pagination: {
        total: rfqs.length,
        page: 1,
        pageSize: 20,
      },
    });
  } catch (error) {
    console.error("Error listing RFQs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch RFQs" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(GETHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.rfq",
  action: "read",
  requireAuth: true,
});

// ============================================================================
// POST - Create RFQ
// ============================================================================

async function POSTHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";
    const userId = context.userId || "system";
    const body = await request.json();

    // Validate required fields
    if (!body.customer?.companyName) {
      return NextResponse.json(
        { success: false, error: "Company name is required" },
        { status: 400 },
      );
    }
    if (!body.customer?.contactName) {
      return NextResponse.json(
        { success: false, error: "Contact name is required" },
        { status: 400 },
      );
    }
    if (!body.customer?.email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 },
      );
    }
    if (!body.selectedServices || body.selectedServices.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one service must be selected" },
        { status: 400 },
      );
    }
    if (!body.responseDeadline) {
      return NextResponse.json(
        { success: false, error: "Response deadline is required" },
        { status: 400 },
      );
    }

    // Create RFQ using service
    const rfq = await rfqService.createRFQ({
      customer: {
        id: `customer-${Date.now()}`,
        companyName: body.customer.companyName,
        contactPerson: body.customer.contactName,
        email: body.customer.email,
        phone: body.customer.phone || "N/A",
        address: {
          street: body.customer.address || body.origin?.address || "",
          city: body.origin?.city || "",
          state: body.origin?.state || "",
          country: body.origin?.country || "SA",
          postalCode: body.origin?.postalCode || "",
        },
        industry: body.customer.industry,
        existingCustomer: false,
      },
      serviceRequirements: body.selectedServices.map(
        (serviceId: string, index: number) => ({
          id: `req-${Date.now()}-${index}`,
          category: serviceId as any,
          subCategory: "FULL_SERVICE" as any,
          description: `${serviceId.replace(/_/g, " ")} service`,
          quantity: body.quantities?.[serviceId] || 1,
          unit: "shipments",
          priority: (body.urgency || "MEDIUM") as any,
        }),
      ),
      priority: body.urgency || "MEDIUM",
      timeline: {
        requestDate: new Date().toISOString().split("T")[0],
        responseDeadline: body.responseDeadline,
        urgency: body.urgency || "MEDIUM",
      },
      title:
        body.title ||
        `${body.selectedServices.map((s: string) => s.replace(/_/g, " ")).join(", ")} Services`,
      source: "DIRECT",
      tenantId,
      createdBy: userId,
    });

    return NextResponse.json(
      {
        success: true,
        data: rfq,
        message: "RFQ created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating RFQ:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create RFQ";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack, body });
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(POSTHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.rfq",
  action: "write",
  requireAuth: true,
});
