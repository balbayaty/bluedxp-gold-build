/**
 * Proposal Interactive Features API
 * Calculators, forms, dynamic pricing
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { proposalInteractiveService } from "@/lib/services/proposals/proposalInteractiveService";
import { enhancedProposalService } from "@/lib/services/proposals/enhancedProposalService";
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
    const searchParams = request.nextUrl.searchParams;
    const sectionId = searchParams.get("sectionId");
    const type = searchParams.get("type"); // 'calculator' | 'form' | 'pricing'

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    // Verify tenant access
    const proposal = await enhancedProposalService.getProposal(proposalId);
    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found" },
        { status: 404 },
      );
    }

    if (proposal.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    const data: any = {};

    if (!type || type === "calculator") {
      data.calculators = proposalInteractiveService.getCalculators(
        proposalId,
        sectionId || undefined,
      );
    }

    if (!type || type === "form") {
      data.forms = proposalInteractiveService.getForms(
        proposalId,
        sectionId || undefined,
      );
    }

    if (!type || type === "pricing") {
      data.dynamicPricing = proposalInteractiveService.getDynamicPricing(
        proposalId,
        sectionId || undefined,
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error getting interactive features:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get interactive features",
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
    const body = await request.json();
    const { action, ...data } = body;

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    // Verify tenant access
    const proposal = await enhancedProposalService.getProposal(proposalId);
    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found" },
        { status: 404 },
      );
    }

    if (proposal.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    switch (action) {
      case "add-calculator":
        const calculator = await proposalInteractiveService.addCalculator({
          ...data,
          proposalId,
        });
        return NextResponse.json(
          { success: true, data: calculator },
          { status: 201 },
        );

      case "calculate":
        const { calculatorId, inputs } = data;
        const results = proposalInteractiveService.calculate(
          calculatorId,
          proposalId,
          inputs,
        );
        return NextResponse.json({ success: true, data: results });

      case "add-form":
        const form = await proposalInteractiveService.addForm({
          ...data,
          proposalId,
        });
        return NextResponse.json(
          { success: true, data: form },
          { status: 201 },
        );

      case "submit-form":
        const { formId, formData } = data;
        const submitResult = await proposalInteractiveService.submitForm(
          formId,
          proposalId,
          formData,
        );
        return NextResponse.json({ success: true, data: submitResult });

      case "add-dynamic-pricing":
        const pricing = await proposalInteractiveService.addDynamicPricing({
          ...data,
          proposalId,
        });
        return NextResponse.json(
          { success: true, data: pricing },
          { status: 201 },
        );

      case "calculate-price":
        const { pricingId, factors } = data;
        const price = proposalInteractiveService.calculateDynamicPrice(
          pricingId,
          proposalId,
          factors,
        );
        return NextResponse.json({ success: true, data: { price } });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error in interactive action:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to perform action",
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
