import { NextRequest, NextResponse } from "next/server";
import { invoiceService } from "@/lib/services/marketplace/invoiceService";
import { marketplaceService } from "@/lib/services/marketplace/marketplaceService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get("bookingId");
    const customerId = searchParams.get("customerId");
    const providerId = searchParams.get("providerId");

    if (bookingId) {
      const invoice = await invoiceService.getInvoiceByBooking(bookingId);
      return NextResponse.json({
        success: true,
        data: invoice,
      });
    }

    if (customerId) {
      const invoices = await invoiceService.getInvoicesByCustomer(customerId);
      return NextResponse.json({
        success: true,
        data: invoices,
        count: invoices.length,
      });
    }

    if (providerId) {
      const invoices = await invoiceService.getInvoicesByProvider(providerId);
      return NextResponse.json({
        success: true,
        data: invoices,
        count: invoices.length,
      });
    }

    return NextResponse.json(
      { success: false, error: "Missing required parameter" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Failed to get invoices:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get invoices" },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { bookingId, items, options } = body;

    if (!bookingId || !items) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: bookingId, items" },
        { status: 400 },
      );
    }

    const booking = await marketplaceService.getBooking(bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    const invoice = await invoiceService.generateInvoice(
      booking,
      items,
      options,
    );

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    console.error("Failed to generate invoice:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate invoice" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.invoices",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.invoices",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
