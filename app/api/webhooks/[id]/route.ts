/**
 * Webhook Management API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { validateWebhookURL } from "@/lib/services/webhooks";
import { WebhookEvent } from "@/types/userManagement";

// Mock storage (in production, use database)
const webhooks: any[] = [];

/**
 * GET /api/webhooks/[id] - Get webhook
 */
async function getWebhook(req: NextRequest, context: any) {
  const id = context.params?.id || req.nextUrl.pathname.split("/").pop();

  const webhook = webhooks.find(
    (wh) => wh.id === id && wh.userId === context.userId,
  );

  if (!webhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  return NextResponse.json({ webhook });
}

/**
 * PUT /api/webhooks/[id] - Update webhook
 */
async function updateWebhook(req: NextRequest, context: any) {
  const id = context.params?.id || req.nextUrl.pathname.split("/").pop();
  const body = await req.json();

  const webhookIndex = webhooks.findIndex(
    (wh) => wh.id === id && wh.userId === context.userId,
  );

  if (webhookIndex === -1) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  const webhook = webhooks[webhookIndex];

  // Update fields
  if (body.url) {
    const urlValidation = validateWebhookURL(body.url);
    if (!urlValidation.valid) {
      return NextResponse.json(
        { error: "Invalid webhook URL", reason: urlValidation.error },
        { status: 400 },
      );
    }
    webhook.url = body.url;
  }

  if (body.events) {
    webhook.events = body.events;
  }

  if (body.status) {
    webhook.status = body.status;
  }

  if (body.name) {
    webhook.name = body.name;
  }

  webhook.updatedAt = new Date();

  return NextResponse.json({ webhook });
}

/**
 * DELETE /api/webhooks/[id] - Delete webhook
 */
async function deleteWebhook(req: NextRequest, context: any) {
  const id = context.params?.id || req.nextUrl.pathname.split("/").pop();

  const webhookIndex = webhooks.findIndex(
    (wh) => wh.id === id && wh.userId === context.userId,
  );

  if (webhookIndex === -1) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  webhooks.splice(webhookIndex, 1);

  return NextResponse.json({ success: true });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAPIGateway(getWebhook, {
    moduleId: "integration",
    action: "read",
    requireAuth: true,
  })(req, { params });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAPIGateway(updateWebhook, {
    moduleId: "integration",
    action: "write",
    requireAuth: true,
  })(req, { params });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAPIGateway(deleteWebhook, {
    moduleId: "integration",
    action: "delete",
    requireAuth: true,
  })(req, { params });
}
