/**
 * Proposal Tracking API
 * Track opens, views, downloads, clicks, engagement
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { proposalTrackingService } from "@/lib/services/proposals/proposalTrackingService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET - Get tracking data and heatmap
// ============================================================================

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

    const searchParams = request.nextUrl.searchParams;
    const includeHeatmap = searchParams.get("heatmap") === "true";

    const tracking = proposalTrackingService.getTracking(proposalId);

    if (!tracking) {
      return NextResponse.json(
        { success: false, error: "Tracking data not found" },
        { status: 404 },
      );
    }

    const response: any = {
      success: true,
      data: {
        tracking,
      },
    };

    if (includeHeatmap) {
      const heatmap = proposalTrackingService.getHeatmap(proposalId);
      response.data.heatmap = heatmap;

      // Calculate conversion probability
      const conversionProbability =
        proposalTrackingService.calculateConversionProbability(tracking);
      response.data.conversionProbability = conversionProbability;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting tracking data:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get tracking data",
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

// ============================================================================
// POST - Track events (webhook endpoint for tracking pixels/clicks)
// ============================================================================

async function POSTHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const proposalId = nextContext?.params?.id || "";

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { event, recipientEmail, ...data } = body;

    switch (event) {
      case "open":
        await proposalTrackingService.trackOpen(
          proposalId,
          recipientEmail,
          data.deviceInfo,
        );
        break;

      case "view":
        await proposalTrackingService.trackSectionView(
          proposalId,
          recipientEmail,
          data.sectionId,
          data.timeSpent || 0,
        );
        break;

      case "download":
        await proposalTrackingService.trackDownload(proposalId, recipientEmail);
        break;

      case "click":
        await proposalTrackingService.trackLinkClick(
          proposalId,
          recipientEmail,
          data.url,
        );
        break;

      case "sign":
        await proposalTrackingService.trackSignature(
          proposalId,
          recipientEmail,
        );
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid event type" },
          { status: 400 },
        );
    }

    return NextResponse.json({ success: true, message: "Event tracked" });
  } catch (error) {
    console.error("Error tracking event:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to track event",
      },
      { status: 500 },
    );
  }
}
