/**
 * WMS Sales Order Detail API
 * GET /api/wms/sales-orders/[id] - Get SO by ID
 * PATCH /api/wms/sales-orders/[id] - Update SO
 * DELETE /api/wms/sales-orders/[id] - Cancel SO
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Return mock data for now
    const order = {
      id: params.id,
      orderNumber: `SO-${params.id.slice(0, 8).toUpperCase()}`,
      customerId: "customer-001",
      customerName: "Arabian Gulf Trading Co.",
      status: "PICKING",
      orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      requestedDeliveryDate: new Date(
        Date.now() + 5 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      currency: "SAR",
      subtotal: 85000,
      discountAmount: 4250,
      taxAmount: 12112.5,
      shippingAmount: 500,
      totalAmount: 93362.5,
      lines: [
        {
          id: "1",
          lineNumber: 1,
          skuCode: "SKU-10001",
          description: "Premium Warehouse Shelving Unit",
          quantity: 25,
          unit: "EA",
          unitPrice: 2000,
          discount: 5,
          totalPrice: 47500,
          pickedQuantity: 25,
          shippedQuantity: 0,
          status: "PICKED",
        },
        {
          id: "2",
          lineNumber: 2,
          skuCode: "SKU-10002",
          description: "Industrial Storage Bins - Large",
          quantity: 100,
          unit: "EA",
          unitPrice: 250,
          discount: 5,
          totalPrice: 23750,
          pickedQuantity: 80,
          shippedQuantity: 0,
          status: "PARTIAL",
        },
        {
          id: "3",
          lineNumber: 3,
          skuCode: "SKU-10003",
          description: "Safety Equipment Kit",
          quantity: 55,
          unit: "SET",
          unitPrice: 250,
          discount: 0,
          totalPrice: 13750,
          pickedQuantity: 0,
          shippedQuantity: 0,
          status: "OPEN",
        },
      ],
      shippingAddress: "King Fahd Road, Al Olaya District, Riyadh 12211",
      billingAddress: "P.O. Box 12345, Riyadh 11411",
      paymentTerms: "Net 30",
      shippingMethod: "Express Delivery",
      notes: "Priority customer - expedite processing",
      createdBy: "sales@company.com",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error("Error fetching sales order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch order" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();

    return NextResponse.json({
      success: true,
      data: { id: params.id, ...body, updatedAt: new Date().toISOString() },
    });
  } catch (error: any) {
    console.error("Error updating sales order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update order" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    return NextResponse.json({
      success: true,
      message: "Sales order cancelled successfully",
    });
  } catch (error: any) {
    console.error("Error cancelling sales order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel order" },
      { status: 500 },
    );
  }
}
