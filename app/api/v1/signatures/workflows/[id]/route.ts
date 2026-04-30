/**
 * Workflow Details API
 * GET /api/v1/signatures/workflows/[id] - Get workflow details
 * POST /api/v1/signatures/workflows/[id]/send - Send workflow for signing
 * POST /api/v1/signatures/workflows/[id]/remind - Send reminders
 * DELETE /api/v1/signatures/workflows/[id] - Cancel workflow
 */

import { NextRequest, NextResponse } from "next/server";
import { workflowService } from "@/lib/services/digital-signature";
import {
  withSignatureAPIWithParams,
  SignatureAPIContext,
} from "@/lib/services/digital-signature/apiMiddleware";
import { NotFoundError } from "@/lib/services/digital-signature/errorHandler";

export const GET = withSignatureAPIWithParams(
  async (
    request: NextRequest,
    context: SignatureAPIContext,
    { params }: { params: { id: string } },
  ) => {
    const workflowId = params.id;

    const workflow = workflowService.getWorkflow(workflowId);
    if (!workflow) {
      throw new NotFoundError("Workflow", workflowId);
    }

    return NextResponse.json({
      success: true,
      data: workflow,
    });
  },
  {
    requireAuth: true,
    rateLimit: true,
  },
);

export const POST = withSignatureAPIWithParams(
  async (
    request: NextRequest,
    context: SignatureAPIContext,
    { params }: { params: { id: string } },
  ) => {
    const workflowId = params.id;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action"); // 'send' or 'remind'

    const workflow = workflowService.getWorkflow(workflowId);
    if (!workflow) {
      throw new NotFoundError("Workflow", workflowId);
    }

    if (action === "send") {
      await workflowService.sendForSigning(workflowId);
      return NextResponse.json({
        success: true,
        message: "Workflow sent for signing",
      });
    }

    if (action === "remind") {
      await workflowService.sendReminders(workflowId);
      return NextResponse.json({
        success: true,
        message: "Reminders sent",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action. Use ?action=send or ?action=remind",
      },
      { status: 400 },
    );
  },
  {
    requireAuth: true,
    rateLimit: true,
  },
);

export const DELETE = withSignatureAPIWithParams(
  async (
    request: NextRequest,
    context: SignatureAPIContext,
    { params }: { params: { id: string } },
  ) => {
    const workflowId = params.id;

    const workflow = workflowService.getWorkflow(workflowId);
    if (!workflow) {
      throw new NotFoundError("Workflow", workflowId);
    }

    // Update workflow status to cancelled
    workflow.status = "cancelled";

    return NextResponse.json({
      success: true,
      message: "Workflow cancelled",
    });
  },
  {
    requireAuth: true,
    rateLimit: true,
  },
);
