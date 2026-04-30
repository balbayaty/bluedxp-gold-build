/**
 * 🚀 API KEYS API ENDPOINT
 *
 * RESTful API for API key management
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { withRowLevelSecurity } from "@/middleware/rowLevelSecurity";
import { apiKeyService } from "@/lib/services/user";
import type { CreateAPIKeyInput } from "@/lib/services/user";

// GET /api/api-keys - List API keys
async function handleGet(req: NextRequest, context: any) {
  try {
    const userId = context.security?.userId || req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const apiKeys = await apiKeyService.listAPIKeys(userId);

    return NextResponse.json({
      success: true,
      data: apiKeys,
      count: apiKeys.length,
    });
  } catch (error) {
    console.error("[API Keys API] Error getting API keys:", error);
    return NextResponse.json(
      { error: "Failed to get API keys" },
      { status: 500 },
    );
  }
}

// POST /api/api-keys - Create API key
async function handlePost(req: NextRequest, context: any) {
  try {
    const body = await req.json();
    const userId = context.security?.userId || body.userId;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const input: CreateAPIKeyInput = {
      ...body,
      userId,
      createdBy: context.security?.userId || userId,
    };

    const result = await apiKeyService.createAPIKey(userId, input);

    // Return key only on creation (never again)
    return NextResponse.json(
      {
        success: true,
        data: {
          key: result.key, // Only returned once
          apiKey: result.apiKey,
        },
        warning: "Store this key securely. It will not be shown again.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[API Keys API] Error creating API key:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(
  withRowLevelSecurity(handleGet, { requireAuth: true }),
  { requireAuth: true },
);

export const POST = withAPIGateway(
  withRowLevelSecurity(handlePost, { requireAuth: true }),
  { requireAuth: true },
);
