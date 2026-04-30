/**
 * QHSE Webhook API (by ID)
 * Update, delete, or get a specific webhook
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseWebhookService } from "@/lib/services/qhse/webhooks/qhseWebhookService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// GET - Get webhook by ID
async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const webhook = qhseWebhookService.getWebhook(params.id);

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: "Webhook not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: webhook,
    });
  } catch (error: any) {
    console.error("Error fetching webhook:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch webhook" },
      { status: 500 },
    );
  }
}

// PATCH - Update webhook
async function patchHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const webhook = qhseWebhookService.updateWebhook(params.id, body);

    return NextResponse.json({
      success: true,
      data: webhook,
    });
  } catch (error: any) {
    console.error("Error updating webhook:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update webhook" },
      { status: 500 },
    );
  }
}

// DELETE - Delete webhook
async function deleteHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    qhseWebhookService.deleteWebhook(params.id);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete webhook" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.webhooks",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const PATCH = withAPIGateway(patchHandler, {
  moduleId: "qhse",
  featureId: "qhse.webhooks",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteHandler, {
  moduleId: "qhse",
  featureId: "qhse.webhooks",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
