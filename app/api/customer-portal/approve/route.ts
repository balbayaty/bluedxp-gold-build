/**
 * Customer Portal Approval API
 * Handles customer approval via secure token
 */

import { NextRequest, NextResponse } from "next/server";
import { customerApprovalService } from "@/lib/services/msds-sku-linking/customerApprovalService";

// ============================================================================
// GET /api/customer-portal/approve - Get approval request by token
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Approval token is required",
        },
        { status: 400 },
      );
    }

    const approvalRequest =
      await customerApprovalService.getApprovalRequestByToken(token);

    if (!approvalRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired approval token",
        },
        { status: 404 },
      );
    }

    // Check if expired
    if (new Date(approvalRequest.expiresAt) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "Approval request has expired",
          data: approvalRequest,
        },
        { status: 410 }, // Gone
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: approvalRequest,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error getting approval request:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get approval request",
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST /api/customer-portal/approve - Process approval response
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.token || !body.action) {
      return NextResponse.json(
        {
          success: false,
          error: "Token and action are required",
        },
        { status: 400 },
      );
    }

    if (!["APPROVE", "REJECT", "CONDITIONAL"].includes(body.action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Must be APPROVE, REJECT, or CONDITIONAL",
        },
        { status: 400 },
      );
    }

    const result = await customerApprovalService.processApprovalResponse({
      requestId: body.requestId || "",
      token: body.token,
      action: body.action,
      links: body.links || [],
      notes: body.notes,
      approvedBy: body.approvedBy || "customer",
      approvedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error processing approval:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process approval",
      },
      { status: 500 },
    );
  }
}
