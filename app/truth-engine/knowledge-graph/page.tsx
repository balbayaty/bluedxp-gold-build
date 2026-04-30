/**
 * Knowledge Graph Page
 * Interactive knowledge graph visualization for Truth Engine
 */

"use client";

import { KnowledgeGraphVisualization } from "@/components/truth-engine/KnowledgeGraphVisualization";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

export default function KnowledgeGraphPage() {
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId") || undefined;
  const entityType = searchParams.get("entityType") || undefined;
  const tenantId = searchParams.get("tenantId") || "default";

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Knowledge Graph</h1>
        <p className="text-muted-foreground mt-2">
          Explore entity relationships, events, and claims in an interactive
          graph
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Graph Explorer</CardTitle>
          <CardDescription>
            Search for entities and visualize their relationships, events, and
            evidence connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KnowledgeGraphVisualization
            tenantId={tenantId}
            initialEntityId={entityId}
            initialEntityType={entityType}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Search by Entity ID:</strong> Enter a specific entity ID
            (e.g., shipment ID, order ID) to see all related entities and
            events.
          </p>
          <p>
            <strong>Search by Entity Type:</strong> Enter an entity type (e.g.,
            "shipment", "order") to see all entities of that type and their
            relationships.
          </p>
          <p>
            <strong>Depth Control:</strong> Adjust the depth to control how many
            relationship levels to explore (1-5).
          </p>
          <p>
            <strong>Node Types:</strong> The graph shows entities, events,
            claims, evidence, people, organizations, and documents.
          </p>
          <p>
            <strong>Edge Types:</strong> Relationships include "performed",
            "references", and "supports" connections.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
