/**
 * Knowledge Graph API
 * GET /api/truth-engine/knowledge-graph?entityId=...&entityType=...&depth=...
 * POST /api/truth-engine/knowledge-graph (build from events)
 */

import { NextRequest, NextResponse } from "next/server";
import { truthKnowledgeGraphService } from "@/lib/services/truth-engine";
import { truthEngineService } from "@/lib/services/truth-engine";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityId = searchParams.get("entityId");
    const entityType = searchParams.get("entityType");
    const relationshipType = searchParams.get("relationshipType");
    const depth = searchParams.get("depth")
      ? parseInt(searchParams.get("depth")!)
      : 2;
    const tenantId = searchParams.get("tenantId") || "default";

    if (!entityId && !entityType) {
      return NextResponse.json(
        { error: "entityId or entityType is required" },
        { status: 400 },
      );
    }

    const query = {
      entityId: entityId || undefined,
      entityType: entityType || undefined,
      relationshipType: relationshipType || undefined,
      depth,
      filters: {
        tenantId,
      },
    };

    const result = await truthKnowledgeGraphService.queryGraph(query);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Knowledge graph query error:", error);
    return NextResponse.json(
      { error: error.message || "Query failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, entityId, targetId, maxDepth } = body;

    // Build graph from events
    if (events) {
      const result =
        await truthKnowledgeGraphService.buildGraphFromEvents(events);
      return NextResponse.json(result);
    }

    // Find paths between entities
    if (entityId && targetId) {
      const paths = await truthKnowledgeGraphService.findPaths(
        entityId,
        targetId,
        maxDepth || 5,
      );
      return NextResponse.json({ paths });
    }

    return NextResponse.json(
      { error: "events or (entityId and targetId) is required" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Knowledge graph error:", error);
    return NextResponse.json(
      { error: error.message || "Operation failed" },
      { status: 500 },
    );
  }
}
