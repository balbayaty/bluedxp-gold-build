/**
 * Accounts Receivable Invoice Detail API
 * GET /api/finance/accounts-receivable/[id] - Get AR invoice by ID
 * PATCH /api/finance/accounts-receivable/[id] - Update AR invoice
 * DELETE /api/finance/accounts-receivable/[id] - Delete/write-off AR invoice
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
      invoiceNumber: `AR-INV-${params.id.slice(0, 6).toUpperCase()}`,
      customerId: "customer-001",
      customerName: "Arabian Gulf Trading Co.",
      status: "PENDING",
      invoiceDate: new Date(
        Date.now() - 10 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 250000,
      receivedAmount: 100000,
      outstandingAmount: 150000,
      currency: "SAR",
      paymentTerms: "Net 30",
      description: "Warehousing and logistics services - November 2024",
      lineItems: [
        {
          id: "1",
          description: "Warehousing Services",
          quantity: 1,
          unitPrice: 150000,
          total: 150000,
        },
        {
          id: "2",
          description: "Transportation Services",
          quantity: 1,
          unitPrice: 75000,
          total: 75000,
        },
        {
          id: "3",
          description: "Value Added Services",
          quantity: 1,
          unitPrice: 25000,
          total: 25000,
        },
      ],
      payments: [
        {
          id: "1",
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 100000,
          method: "BANK_TRANSFER",
          reference: "TRF-12345",
        },
      ],
      glEntries: [
        { account: "1100 - Accounts Receivable", debit: 250000, credit: 0 },
        { account: "4000 - Revenue - Services", debit: 0, credit: 250000 },
      ],
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    console.error("Error fetching AR invoice:", error);
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
    console.error("Error updating AR invoice:", error);
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
    delete mockInvoices[params.id];

    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting AR invoice:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete invoice" },
      { status: 500 },
    );
  }
}
