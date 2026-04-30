/**
 * Proposals API
 *
 * Generate and manage transportation proposals and reports
 */

import { NextRequest, NextResponse } from "next/server";
import { ProposalGenerator } from "@/lib/services/proposals/ProposalGenerator";
import type { ProposalGenerationConfig, ExportFormat } from "@/types/proposals";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import { evidenceService } from "@/lib/services/evidence";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";

const proposalGenerator = new ProposalGenerator();

async function getHandler(
  request: NextRequest,
  context: { tenantId?: string },
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const quoteId = searchParams.get("quoteId");
    const shipmentId = searchParams.get("shipmentId");

    let filtered = [
      ...(await transportationDatabaseAdapterInstance.listProposals({
        tenantId,
        limit: 500,
        offset: 0,
      })),
    ];

    if (type) {
      filtered = filtered.filter((p) => p.type === type);
    }

    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }

    if (quoteId) {
      filtered = filtered.filter((p) => p.quoteId === quoteId);
    }

    if (shipmentId) {
      filtered = filtered.filter((p) => p.shipmentId === shipmentId);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 },
    );
  }
}

async function postHandler(
  request: NextRequest,
  context: { tenantId?: string; userId?: string },
) {
  try {
    const tenantId = context.tenantId;
    const userId = context.userId || "api-user";
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body = await request.json();

    // Generate proposal
    const config: ProposalGenerationConfig = {
      proposalType: body.proposalType || "QUOTE_PROPOSAL",
      sourceData: {
        quote: body.quote,
        shipment: body.shipment,
        carrier: body.carrier,
        customs: body.customs,
        analytics: body.analytics,
      },
      templateId: body.templateId,
      customSections: body.customSections,
      branding: body.branding,
      recipients: body.recipients,
      exportFormats: body.exportFormats || ["PDF"],
      autoSend: body.autoSend || false,
    };

    const proposal = await proposalGenerator.generateProposal(config);
    await transportationDatabaseAdapterInstance.storeProposal(
      {
        ...(proposal as any),
        id: (proposal as any).id || `proposal-${Date.now()}`,
      },
      { tenantId, createdBy: userId },
    );

    const evidence = await evidenceService.create({
      tenantId,
      type: "event",
      category: "operational",
      title: `Proposal created: ${(proposal as any).id || "unknown"}`,
      description: "Transportation proposal created",
      content: JSON.stringify(
        { proposalId: (proposal as any).id, proposalType: config.proposalType },
        null,
        2,
      ),
      createdBy: userId,
      metadata: {
        source: "transportation-api",
        capturedAt: new Date().toISOString(),
        capturedMethod: "api",
      },
      relatedEntities: [
        {
          entityId: String((proposal as any).id || ""),
          entityType: "proposal",
          relationship: "subject",
          addedAt: new Date().toISOString(),
        },
      ],
      tags: ["tms", "transportation", "proposal"],
    } as any);

    await eventBus.publish(
      createEvent(
        "transportation.proposal.created",
        String((proposal as any).id || ""),
        "Proposal",
        {
          proposalId: (proposal as any).id,
          proposalType: config.proposalType,
          evidenceId: evidence.id,
        },
        1,
        { tenantId, userId },
      ),
    );

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json(
      { error: "Failed to create proposal" },
      { status: 500 },
    );
  }
}

export const GET = withTransportationAPI(getHandler, {
  featureId: "proposals",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
export const POST = withTransportationAPI(postHandler, {
  featureId: "proposals",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
