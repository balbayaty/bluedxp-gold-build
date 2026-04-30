/**
 * CRM Account Detail API
 * GET /api/crm/accounts/[id] - Get account by ID
 * PATCH /api/crm/accounts/[id] - Update account
 * DELETE /api/crm/accounts/[id] - Delete account
 */

import { NextRequest, NextResponse } from "next/server";
import { accountService } from "@/lib/services/crm/accountService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const account = await accountService.getAccountById(params.id);

    if (!account) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch account" },
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
    const account = await accountService.updateAccount(params.id, body);

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update account" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await accountService.deleteAccount(params.id);

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete account" },
      { status: 500 },
    );
  }
}
