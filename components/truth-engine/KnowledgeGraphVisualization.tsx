/**
 * Knowledge Graph Visualization Component
 * Visualizes entity relationships and claims in an interactive graph
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Network, Search, ZoomIn, ZoomOut } from "lucide-react";
import type {
  KnowledgeGraphNode,
  KnowledgeGraphEdge,
} from "@/lib/services/truth-engine";

interface KnowledgeGraphVisualizationProps {
  tenantId: string;
  initialEntityId?: string;
  initialEntityType?: string;
}

export function KnowledgeGraphVisualization({
  tenantId,
  initialEntityId,
  initialEntityType,
}: KnowledgeGraphVisualizationProps) {
  const [nodes, setNodes] = useState<KnowledgeGraphNode[]>([]);
  const [edges, setEdges] = useState<KnowledgeGraphEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entityId, setEntityId] = useState(initialEntityId || "");
  const [entityType, setEntityType] = useState(initialEntityType || "");
  const [depth, setDepth] = useState(2);

  const fetchGraph = async () => {
    if (!entityId && !entityType) {
      setError("Please provide entityId or entityType");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tenantId,
        depth: depth.toString(),
      });
      if (entityId) params.append("entityId", entityId);
      if (entityType) params.append("entityType", entityType);

      const response = await fetch(
        `/api/truth-engine/knowledge-graph?${params}`,
      );
      if (!response.ok) throw new Error("Failed to fetch graph");

      const data = await response.json();
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } catch (err: any) {
      setError(err.message || "Failed to load graph");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialEntityId || initialEntityType) {
      fetchGraph();
    }
  }, []);

  const nodeTypes = Array.from(new Set(nodes.map((n) => n.type)));
  const edgeTypes = Array.from(new Set(edges.map((e) => e.type)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Knowledge Graph
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Entity ID"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
          />
          <Input
            placeholder="Entity Type"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          />
          <Select
            value={depth.toString()}
            onValueChange={(v) => setDepth(parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Depth 1</SelectItem>
              <SelectItem value="2">Depth 2</SelectItem>
              <SelectItem value="3">Depth 3</SelectItem>
              <SelectItem value="4">Depth 4</SelectItem>
              <SelectItem value="5">Depth 5</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchGraph} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">
            {error}
          </div>
        )}

        {/* Graph Visualization */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : nodes.length > 0 ? (
          <div className="space-y-4">
            {/* Graph Stats */}
            <div className="flex gap-4 flex-wrap">
              <Badge variant="outline">{nodes.length} Nodes</Badge>
              <Badge variant="outline">{edges.length} Edges</Badge>
              <Badge variant="outline">{nodeTypes.length} Node Types</Badge>
              <Badge variant="outline">{edgeTypes.length} Edge Types</Badge>
            </div>

            {/* Node Types Legend */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Node Types:</h4>
              <div className="flex gap-2 flex-wrap">
                {nodeTypes.map((type) => (
                  <Badge key={type} variant="secondary">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Simple Graph Visualization (in production, use D3.js or vis.js) */}
            <div className="border rounded-lg p-4 bg-muted/50 min-h-[400px] overflow-auto">
              <div className="space-y-2">
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="p-3 bg-background border rounded-md hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{node.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {node.type}
                        </div>
                      </div>
                      {node.confidence !== undefined && (
                        <Badge
                          variant={
                            node.confidence > 0.7 ? "default" : "secondary"
                          }
                        >
                          {Math.round(node.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Edges List */}
            {edges.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Relationships:</h4>
                <div className="space-y-1">
                  {edges.slice(0, 10).map((edge) => {
                    const sourceNode = nodes.find((n) => n.id === edge.source);
                    const targetNode = nodes.find((n) => n.id === edge.target);
                    return (
                      <div
                        key={edge.id}
                        className="text-sm p-2 bg-muted rounded"
                      >
                        <span className="font-semibold">
                          {sourceNode?.label || edge.source}
                        </span>
                        <span className="mx-2 text-muted-foreground">→</span>
                        <span className="font-semibold">
                          {targetNode?.label || edge.target}
                        </span>
                        <Badge variant="outline" className="ml-2">
                          {edge.type}
                        </Badge>
                      </div>
                    );
                  })}
                  {edges.length > 10 && (
                    <div className="text-sm text-muted-foreground">
                      ... and {edges.length - 10} more relationships
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No graph data. Enter entity ID or type and click Search.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
