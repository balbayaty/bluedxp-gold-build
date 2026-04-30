/**
 * 🚀 API KEY ROTATION API
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { withRowLevelSecurity } from "@/middleware/rowLevelSecurity";
import { apiKeyService } from "@/lib/services/user";

async function handlePost(req: NextRequest, context: any) {
  try {
    const keyId = context.params?.id;
    if (!keyId) {
      return NextResponse.json(
        { error: "API Key ID required" },
        { status: 400 },
      );
    }

    const result = await apiKeyService.rotateAPIKey(keyId);
    return NextResponse.json({
      success: true,
      data: {
        key: result.key, // Only returned once
        apiKey: result.apiKey,
      },
      warning: "Store this key securely. It will not be shown again.",
    });
  } catch (error) {
    console.error("[API Keys API] Error rotating key:", error);
    return NextResponse.json(
      { error: "Failed to rotate key" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(
  withRowLevelSecurity(handlePost, { requireAuth: true }),
  { requireAuth: true },
);
