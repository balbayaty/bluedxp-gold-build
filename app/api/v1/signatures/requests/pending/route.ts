/**
 * Pending Requests API - Get pending signature requests for user
 * GET /api/v1/signatures/requests/pending
 */

import { NextRequest, NextResponse } from "next/server";
import { workflowService } from "@/lib/services/digital-signature";
import {
  withSignatureAPI,
  SignatureAPIContext,
} from "@/lib/services/digital-signature/apiMiddleware";

export const GET = withSignatureAPI(
  async (request: NextRequest, context: SignatureAPIContext) => {
    const { searchParams } = new URL(request.url);
    const userId =
      searchParams.get("userId") || context.userId || "current-user";

    const pendingRequests = workflowService.getPendingRequests(userId);

    return NextResponse.json({
      success: true,
      data: pendingRequests,
      count: pendingRequests.length,
    });
  },
  {
    requireAuth: true,
    rateLimit: true,
  },
);
