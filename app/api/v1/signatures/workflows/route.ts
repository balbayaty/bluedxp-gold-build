/**
 * Workflows API - Create and manage signing workflows
 * POST /api/v1/signatures/workflows - Create workflow
 * GET /api/v1/signatures/workflows - List workflows
 */

import { NextRequest, NextResponse } from "next/server";
import { workflowService } from "@/lib/services/digital-signature";
import { CreateWorkflowRequest } from "@/types/digital-signature";
import {
  validateWorkflowType,
  validateEmail,
  validatePhone,
  sanitizeInput,
} from "@/lib/services/digital-signature/validation";
import {
  withSignatureAPI,
  SignatureAPIContext,
} from "@/lib/services/digital-signature/apiMiddleware";

export const POST = withSignatureAPI(
  async (request: NextRequest, context: SignatureAPIContext) => {
    const body: CreateWorkflowRequest = await request.json();

    // Validate required fields
    if (
      !body.documentId ||
      !body.workflowName ||
      !body.signers ||
      body.signers.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "documentId, workflowName, and signers are required",
        },
        { status: 400 },
      );
    }

    // Validate and sanitize
    if (!validateWorkflowType(body.workflowType)) {
      return NextResponse.json(
        { success: false, error: "Invalid workflow type" },
        { status: 400 },
      );
    }

    // Validate signers
    for (const signer of body.signers) {
      if (signer.email && !validateEmail(signer.email)) {
        return NextResponse.json(
          { success: false, error: `Invalid email: ${signer.email}` },
          { status: 400 },
        );
      }
      if (signer.phone && !validatePhone(signer.phone)) {
        return NextResponse.json(
          { success: false, error: `Invalid phone: ${signer.phone}` },
          { status: 400 },
        );
      }
    }

    const sanitizedBody: CreateWorkflowRequest = {
      ...body,
      workflowName: sanitizeInput(body.workflowName),
      description: body.description
        ? sanitizeInput(body.description)
        : undefined,
      signers: body.signers.map((s) => ({
        ...s,
        name: sanitizeInput(s.name),
        email: s.email ? sanitizeInput(s.email) : undefined,
        phone: s.phone ? sanitizeInput(s.phone) : undefined,
      })),
    };

    const workflow = await workflowService.createWorkflow(
      sanitizedBody,
      context.userId,
    );

    return NextResponse.json({
      success: true,
      data: workflow,
    });
  },
  {
    requireAuth: true,
    rateLimit: true,
    maxRequests: 30,
  },
);

export const GET = withSignatureAPI(
  async (request: NextRequest, context: SignatureAPIContext) => {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("id");

    if (workflowId) {
      const workflow = workflowService.getWorkflow(workflowId);
      if (!workflow) {
        return NextResponse.json(
          { success: false, error: "Workflow not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({
        success: true,
        data: workflow,
      });
    }

    // List workflows (simplified - in production add filtering)
    return NextResponse.json({
      success: true,
      data: [],
      message: "Workflow listing not yet implemented",
    });
  },
  {
    requireAuth: true,
    rateLimit: true,
  },
);
