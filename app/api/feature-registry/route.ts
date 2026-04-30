/**
 * Feature Registry API
 * Manages feature registration and querying
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getFeatureRegistry,
  registerFeature,
  getAllFeatures,
  getFeaturesByDomain,
  getDomainCompleteness,
} from "@/lib/feature-registry";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

export async function GET(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }
    const user = auth.context;

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let features;

    if (domain) {
      features = getFeaturesByDomain(domain as any);
    } else if (status) {
      const registry = getFeatureRegistry();
      features = registry.getFeaturesByStatus(status as any);
    } else if (search) {
      const registry = getFeatureRegistry();
      features = registry.searchFeatures(search);
    } else {
      features = getAllFeatures();
    }

    // Get completeness stats
    const completeness = getDomainCompleteness();

    return NextResponse.json({
      features,
      completeness,
      total: features.length,
    });
  } catch (error: any) {
    console.error("Feature registry API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }
    const user = auth.context;

    // Check admin role
    if (!user.roles?.includes("admin") && !user.roles?.includes("developer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    registerFeature(body);

    return NextResponse.json({ success: true, message: "Feature registered" });
  } catch (error: any) {
    console.error("Feature registry registration error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
