/**
 * Accounts Payable Invoice Detail API
 * GET /api/finance/accounts-payable/[id] - Get AP invoice by ID
 * PATCH /api/finance/accounts-payable/[id] - Update AP invoice
 * DELETE /api/finance/accounts-payable/[id] - Delete/void AP invoice
 */

import { NextRequest, NextResponse } from "next/server";

// Mock data store (in production, use database)
const mockInvoices: Record<string, any> = {};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Return mock data for now
    const invoice = mockInvoices[params.id] || {
      id: params.id,
      invoiceNumber: `AP-INV-${params.id.slice(0, 6).toUpperCase()}`,
      vendorId: "vendor-001",
      vendorName: "Saudi Industrial Supplies Co.",
      status: "PENDING",
      invoiceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 125000,
      paidAmount: 0,
      outstandingAmount: 125000,
      currency: "SAR",
      paymentTerms: "Net 30",
      description: "Warehouse equipment and supplies Q4",
      lineItems: [
        {
          id: "1",
          description: "Pallet Racking System",
          quantity: 10,
          unitPrice: 8500,
          total: 85000,
        },
        {
          id: "2",
          description: "Conveyor Belt Parts",
          quantity: 5,
          unitPrice: 6000,
          total: 30000,
        },
        {
          id: "3",
          description: "Safety Equipment",
          quantity: 20,
          unitPrice: 500,
          total: 10000,
        },
      ],
      glEntries: [
        { account: "2000 - Accounts Payable", debit: 0, credit: 125000 },
        { account: "1200 - Inventory", debit: 95000, credit: 0 },
        { account: "6200 - Equipment Expense", debit: 30000, credit: 0 },
      ],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    console.error("Error fetching AP invoice:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch invoice" },
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

    // Update invoice (mock)
    mockInvoices[params.id] = {
      ...mockInvoices[params.id],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: mockInvoices[params.id],
    });
  } catch (error: any) {
    console.error("Error updating AP invoice:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update invoice" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Void/delete invoice (mock)
    delete mockInvoices[params.id];

    return NextResponse.json({
      success: true,
      message: "Invoice voided successfully",
    });
  } catch (error: any) {
    console.error("Error voiding AP invoice:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to void invoice" },
      { status: 500 },
    );
  }
}
