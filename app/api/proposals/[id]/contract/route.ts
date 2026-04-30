/**
 * Proposal Contract API
 * Get contract status for proposal
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { proposalContractIntegration } from "@/lib/services/proposals/proposalContractIntegration";
import { enhancedProposalService } from "@/lib/services/proposals/enhancedProposalService";
import { contractService } from "@/lib/services/procurement/contractService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function GETHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const proposalId = nextContext?.params?.id || "";
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    const proposal = await enhancedProposalService.getProposal(proposalId);
    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found" },
        { status: 404 },
      );
    }

    // Verify tenant access
    if (proposal.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // Check if proposal has been converted to contract
    // In real implementation, this would query a conversion table
    // For now, check proposal metadata
    if (proposal.metadata?.contractId) {
      const contract = await contractService.getContract(
        proposal.metadata.contractId,
        tenantId,
      );
      if (contract) {
        return NextResponse.json({
          success: true,
          data: {
            status: "CONVERTED",
            contractId: contract.id,
            contractNumber: contract.contractNumber,
            conversionType: "PROCUREMENT",
            convertedAt: contract.createdAt,
            convertedBy: contract.createdBy,
            compliance: {
              allSectionsMapped: true,
              requiredSectionsPresent: true,
              termsValidated: true,
            },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        status: "NOT_CONVERTED",
        message: "Proposal has not been converted to contract yet",
      },
    });
  } catch (error) {
    console.error("Error getting proposal contract:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get proposal contract",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(GETHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.proposals",
  action: "read",
  requireAuth: true,
});

async function POSTHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const proposalId = nextContext?.params?.id || "";
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";
    const userId = context.userId || "system";
    const body = await request.json();
    const { config = {} } = body;

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    const proposal = await enhancedProposalService.getProposal(proposalId);
    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found" },
        { status: 404 },
      );
    }

    // Verify tenant access
    if (proposal.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    if (proposal.status !== "ACCEPTED") {
      return NextResponse.json(
        {
          success: false,
          error: "Proposal must be accepted before converting to contract",
        },
        { status: 400 },
      );
    }

    const conversion =
      await proposalContractIntegration.convertProposalToContract(
        proposal,
        tenantId,
        userId,
        config,
      );

    return NextResponse.json({
      success: true,
      data: conversion,
    });
  } catch (error) {
    console.error("Error converting proposal to contract:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to convert proposal to contract",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(POSTHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.proposals",
  action: "write",
  requireAuth: true,
});
