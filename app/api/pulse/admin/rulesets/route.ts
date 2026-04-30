/**
 * Pulse Admin - Rulesets API
 * GET /api/pulse/admin/rulesets - Get rulesets
 * POST /api/pulse/admin/rulesets - Create/update ruleset
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request, ["pulse.admin"]);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    const { tenantId } = auth.context;
    const rulesets = await prisma.pulseRuleset.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: rulesets });
  } catch (error) {
    console.error("Get rulesets error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get rulesets" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request, ["pulse.admin"]);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    const { tenantId } = auth.context;
    const body = await request.json();
    const {
      id,
      name,
      roleCluster,
      weightsJson,
      capsJson,
      antiGamingJson,
      evaluationPolicyJson,
      status,
    } = body;

    if (id) {
      // Update
      const updated = await prisma.pulseRuleset.update({
        where: { id },
        data: {
          name,
          roleCluster,
          weightsJson,
          capsJson,
          antiGamingJson,
          evaluationPolicyJson,
          status,
        },
      });
      return NextResponse.json({ success: true, data: updated });
    } else {
      // Create
      const created = await prisma.pulseRuleset.create({
        data: {
          tenantId,
          name,
          roleCluster,
          weightsJson,
          capsJson,
          antiGamingJson,
          evaluationPolicyJson,
          status: status || "ACTIVE",
        },
      });
      return NextResponse.json({ success: true, data: created });
    }
  } catch (error) {
    console.error("Create/update ruleset error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save ruleset" },
      { status: 500 },
    );
  }
}
