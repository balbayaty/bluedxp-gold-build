/**
 * Direct Proposal Lookup API
 * Simple endpoint to fetch proposals directly from database
 * This is the fallback that should always work for proposals created via simple-create
 */

import { NextRequest, NextResponse } from "next/server";
import { proposalDatabaseService } from "@/lib/services/proposals/proposalDatabaseService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    // Handle both Next.js 14 (async params) and older versions
    const resolvedParams = await Promise.resolve(params);
    const proposalId = resolvedParams.id;

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    console.log("[Direct Proposal API] Fetching proposal:", proposalId);

    // Direct database lookup - this should always work
    const proposal = await proposalDatabaseService.getProposal(proposalId);

    if (!proposal) {
      console.warn("[Direct Proposal API] Proposal not found:", proposalId);
      return NextResponse.json(
        { success: false, error: "Proposal not found" },
        { status: 404 },
      );
    }

    console.log("[Direct Proposal API] ✅ Proposal found:", proposal.id);

    // Convert to expected format
    const responseData = {
      success: true,
      data: {
        id: proposal.id,
        proposalNumber: proposal.proposalNumber,
        title: proposal.title,
        description: proposal.description || undefined,
        executiveSummary: proposal.executiveSummary || undefined,
        type: proposal.proposalType,
        status: proposal.status,
        customerId: proposal.customerId || undefined,
        customerName: proposal.customerName || undefined,
        customerEmail: proposal.customerEmail || undefined,
        sections: proposal.sections as any,
        pricing: proposal.pricing as any,
        totalAmount: proposal.totalAmount
          ? parseFloat(proposal.totalAmount.toString())
          : undefined,
        currency: proposal.currency,
        branding: proposal.branding as any,
        validUntil: proposal.validUntil?.toISOString(),
        sentAt: proposal.sentAt?.toISOString(),
        acceptedAt: proposal.acceptedAt?.toISOString(),
        rejectedAt: proposal.rejectedAt?.toISOString(),
        recipients: proposal.recipients as any,
        metadata: proposal.metadata as any,
        tags: proposal.tags || [],
        createdAt: proposal.createdAt.toISOString(),
        updatedAt: proposal.updatedAt.toISOString(),
        version: 1,
        createdBy: proposal.createdBy,
      },
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("[Direct Proposal API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch proposal",
        details:
          process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 },
    );
  }
}
