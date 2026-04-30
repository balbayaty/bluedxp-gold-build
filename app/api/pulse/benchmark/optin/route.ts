/**
 * Pulse Benchmark Opt-in API
 * POST /api/pulse/benchmark/optin - Update opt-in settings
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    const { tenantId } = auth.context;
    const body = await request.json();
    const { publicLeague } = body;

    // Update latest submission
    const submission = await prisma.pulseTenantBenchmarkSubmission.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    if (submission) {
      await prisma.pulseTenantBenchmarkSubmission.update({
        where: { id: submission.id },
        data: { optInPublicLeague: publicLeague || false },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Opt-in settings updated",
    });
  } catch (error) {
    console.error("Update opt-in error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update opt-in settings" },
      { status: 500 },
    );
  }
}
