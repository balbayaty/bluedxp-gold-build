/**
 * Create Customer Approval Request API
 */

import { NextRequest, NextResponse } from "next/server";
import { customerApprovalService } from "@/lib/services/msds-sku-linking/customerApprovalService";
import { ApprovalChannel } from "@/types/msdsSkuLinking";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (
      !body.linkIds ||
      !Array.isArray(body.linkIds) ||
      body.linkIds.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one link ID is required",
        },
        { status: 400 },
      );
    }

    if (!body.customerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer ID is required",
        },
        { status: 400 },
      );
    }

    const approvalRequest = await customerApprovalService.createApprovalRequest(
      body.linkIds,
      body.customerId,
      {
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        channels: body.channels as ApprovalChannel[],
        expiresInHours: body.expiresInHours,
        requestedBy: body.requestedBy,
      },
    );

    return NextResponse.json(
      {
        success: true,
        data: approvalRequest,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating approval request:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create approval request",
      },
      { status: 500 },
    );
  }
}
