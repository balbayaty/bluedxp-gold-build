/**
 * 🚀 API KEY BY ID API ENDPOINT
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { withRowLevelSecurity } from "@/middleware/rowLevelSecurity";
import { apiKeyService } from "@/lib/services/user";
import type { UpdateAPIKeyInput } from "@/lib/services/user";

async function handleGet(req: NextRequest, context: any) {
  try {
    const keyId = context.params?.id;
    if (!keyId) {
      return NextResponse.json(
        { error: "API Key ID required" },
        { status: 400 },
      );
    }

    const apiKey = await apiKeyService.getAPIKey(keyId);
    if (!apiKey) {
      return NextResponse.json({ error: "API Key not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: apiKey });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get API key" },
      { status: 500 },
    );
  }
}

async function handlePut(req: NextRequest, context: any) {
  try {
    const keyId = context.params?.id;
    const body = await req.json();

    if (!keyId) {
      return NextResponse.json(
        { error: "API Key ID required" },
        { status: 400 },
      );
    }

    const input: UpdateAPIKeyInput = body;
    const apiKey = await apiKeyService.updateAPIKey(keyId, input);
    return NextResponse.json({ success: true, data: apiKey });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update API key" },
      { status: 500 },
    );
  }
}

async function handleDelete(req: NextRequest, context: any) {
  try {
    const keyId = context.params?.id;
    if (!keyId) {
      return NextResponse.json(
        { error: "API Key ID required" },
        { status: 400 },
      );
    }

    await apiKeyService.deleteAPIKey(keyId);
    return NextResponse.json({ success: true, message: "API Key deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(
  withRowLevelSecurity(handleGet, { requireAuth: true }),
  { requireAuth: true },
);

export const PUT = withAPIGateway(
  withRowLevelSecurity(handlePut, { requireAuth: true }),
  { requireAuth: true },
);

export const DELETE = withAPIGateway(
  withRowLevelSecurity(handleDelete, { requireAuth: true }),
  { requireAuth: true },
);
