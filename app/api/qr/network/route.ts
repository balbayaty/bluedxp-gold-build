/**
 * QR Network API
 * Manage QR code networks and relationships
 */

import { NextRequest, NextResponse } from "next/server";
import { qrNetworkIntelligenceService } from "@/lib/services/qr/qrNetworkIntelligenceService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === "create-network") {
      const network = await qrNetworkIntelligenceService.createNetwork(data);
      return NextResponse.json({ success: true, network });
    }

    if (action === "add-relationship") {
      await qrNetworkIntelligenceService.addRelationship(data);
      return NextResponse.json({
        success: true,
        message: "Relationship added",
      });
    }

    if (action === "create-collaborative") {
      const collaborative =
        await qrNetworkIntelligenceService.createCollaborativeQR(
          data.qrId,
          data.ownerId,
        );
      return NextResponse.json({ success: true, collaborative });
    }

    if (action === "add-collaborator") {
      await qrNetworkIntelligenceService.addCollaborator(
        data.qrId,
        data.collaborator,
      );
      return NextResponse.json({
        success: true,
        message: "Collaborator added",
      });
    }

    if (action === "add-comment") {
      await qrNetworkIntelligenceService.addComment(
        data.qrId,
        data.userId,
        data.comment,
        data.parentCommentId,
      );
      return NextResponse.json({ success: true, message: "Comment added" });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error in QR network API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const networkId = searchParams.get("networkId");
    const action = searchParams.get("action");

    if (action === "analyze" && networkId) {
      const analytics =
        await qrNetworkIntelligenceService.analyzeNetwork(networkId);
      return NextResponse.json({ success: true, analytics });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action or missing networkId" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error in QR network API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qr",
  featureId: "qr.network",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withAPIGateway(getHandler, {
  moduleId: "qr",
  featureId: "qr.network",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
