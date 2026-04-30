/**
 * QHSE Webhooks API
 * Manage webhook registrations for QHSE events
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseWebhookService } from "@/lib/services/qhse/webhooks/qhseWebhookService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "register") {
      const { name, url, events, secret, tenantId, headers, retryConfig } =
        body;
      if (!name || !url || !events || !tenantId) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required fields: name, url, events, tenantId",
          },
          { status: 400 },
        );
      }

      const webhook = await qhseWebhookService.registerWebhook({
        name,
        url,
        events,
        secret,
        enabled: true,
        tenantId,
        headers,
        retryConfig,
      });

      return NextResponse.json(
        { success: true, data: webhook },
        { status: 201 },
      );
    }

    if (action === "test") {
      const { webhookId } = body;
      if (!webhookId) {
        return NextResponse.json(
          { success: false, error: "Missing webhookId" },
          { status: 400 },
        );
      }

      const result = await qhseWebhookService.testWebhook(webhookId);
      return NextResponse.json({
        success: result.success,
        error: result.error,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "register" or "test"' },
      { status: 400 },
    );
  } catch (error: unknown) {
    logger.error("Error in webhook API", {
      error: error instanceof Error ? error.message : String(error),
      action: "POST",
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "qhse-webhooks", action: "post" },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Webhook operation failed",
      },
      { status: 500 },
    );
  }
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const webhookId = searchParams.get("webhookId");
    const tenantId = searchParams.get("tenantId");

    if (webhookId) {
      const webhook = qhseWebhookService.getWebhook(webhookId);
      if (!webhook) {
        return NextResponse.json(
          { success: false, error: "Webhook not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, data: webhook });
    }

    if (tenantId) {
      const webhooks = qhseWebhookService.getWebhooksForTenant(tenantId);
      return NextResponse.json({
        success: true,
        data: webhooks,
        count: webhooks.length,
      });
    }

    return NextResponse.json(
      { success: false, error: "Missing webhookId or tenantId" },
      { status: 400 },
    );
  } catch (error: unknown) {
    logger.error("Error fetching webhooks", {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "qhse-webhooks", action: "fetch", tenantId },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch webhooks",
      },
      { status: 500 },
    );
  }
}

async function putHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { webhookId, updates } = body;

    if (!webhookId || !updates) {
      return NextResponse.json(
        { success: false, error: "Missing webhookId or updates" },
        { status: 400 },
      );
    }

    const webhook = await qhseWebhookService.updateWebhook(webhookId, updates);
    return NextResponse.json({ success: true, data: webhook });
  } catch (error: unknown) {
    logger.error("Error updating webhook", {
      error: error instanceof Error ? error.message : String(error),
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "qhse-webhooks", action: "update" },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update webhook",
      },
      { status: 500 },
    );
  }
}

async function deleteHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const webhookId = searchParams.get("webhookId");

    if (!webhookId) {
      return NextResponse.json(
        { success: false, error: "Missing webhookId" },
        { status: 400 },
      );
    }

    await qhseWebhookService.deleteWebhook(webhookId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error("Error deleting webhook", {
      error: error instanceof Error ? error.message : String(error),
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "qhse-webhooks", action: "delete" },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete webhook",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.webhooks",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.webhooks",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const PUT = withAPIGateway(putHandler, {
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
