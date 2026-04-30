/**
 * Webhooks API Routes
 * Manage webhook subscriptions
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { validateWebhookURL } from "@/lib/services/webhooks";
import { Webhook, WebhookEvent } from "@/types/userManagement";

function randomUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function randomBytes(length: number): Uint8Array {
  if (typeof window !== "undefined" && window.crypto) {
    return window.crypto.getRandomValues(new Uint8Array(length));
  }
  // Node.js fallback
  const crypto = require("crypto");
  return crypto.randomBytes(length);
}

// Mock storage (in production, use database)
const webhooks: Webhook[] = [];

/**
 * GET /api/webhooks - List webhooks
 */
async function listWebhooks(req: NextRequest, context: any) {
  // Filter by tenant/user
  const userWebhooks = webhooks.filter((wh) => wh.userId === context.userId);

  return NextResponse.json({
    webhooks: userWebhooks.map((wh) => ({
      id: wh.id,
      name: wh.name,
      url: wh.url,
      events: wh.events,
      status: wh.status,
      createdAt: wh.createdAt,
      totalDeliveries: wh.totalDeliveries,
      successfulDeliveries: wh.successfulDeliveries,
      failedDeliveries: wh.failedDeliveries,
    })),
  });
}

/**
 * POST /api/webhooks - Create webhook
 */
async function createWebhook(req: NextRequest, context: any) {
  const body = await req.json();
  const { name, url, events } = body;

  // Validate URL
  const urlValidation = validateWebhookURL(url);
  if (!urlValidation.valid) {
    return NextResponse.json(
      { error: "Invalid webhook URL", reason: urlValidation.error },
      { status: 400 },
    );
  }

  // Validate events
  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json(
      { error: "Events array is required and must not be empty" },
      { status: 400 },
    );
  }

  // Create webhook
  const webhook: Webhook = {
    id: randomUUID(),
    userId: context.userId!,
    tenantId: context.tenantId!,
    name,
    url,
    events: events as WebhookEvent[],
    secret: Array.from(randomBytes(32))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
    verifySSL: true,
    status: "ACTIVE",
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 5,
      backoffMultiplier: 2,
    },
    totalDeliveries: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  webhooks.push(webhook);

  return NextResponse.json(
    {
      webhook: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        status: webhook.status,
        secret: webhook.secret, // Only returned on creation
        createdAt: webhook.createdAt,
      },
    },
    { status: 201 },
  );
}

export async function GET(req: NextRequest) {
  return withAPIGateway(listWebhooks, {
    moduleId: "integration",
    action: "read",
    requireAuth: true,
  })(req, {});
}

export async function POST(req: NextRequest) {
  return withAPIGateway(createWebhook, {
    moduleId: "integration",
    action: "write",
    requireAuth: true,
  })(req, {});
}
