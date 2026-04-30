/**
 * Truth Knowledge Graph Service
 * Builds and maintains a knowledge graph of entities, relationships, and claims
 */

import { TruthEvent, TruthKPI } from "@/types/truth-engine";
import { entityGraphService } from "@/lib/services/graph";

export interface KnowledgeGraphNode {
  id: string;
  type:
    | "entity"
    | "event"
    | "claim"
    | "evidence"
    | "person"
    | "organization"
    | "document";
  label: string;
  properties: Record<string, any>;
  confidence?: number;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
  confidence?: number;
}

export interface KnowledgeGraphQuery {
  entityId?: string;
  entityType?: string;
  relationshipType?: string;
  depth?: number;
  filters?: Record<string, any>;
}

export interface KnowledgeGraphResult {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  paths?: Array<{
    nodes: KnowledgeGraphNode[];
    edges: KnowledgeGraphEdge[];
    confidence: number;
  }>;
}

export class TruthKnowledgeGraphService {
  /**
   * Build knowledge graph from Truth Events
   */
  async buildGraphFromEvents(
    events: TruthEvent[],
  ): Promise<KnowledgeGraphResult> {
    const nodes: KnowledgeGraphNode[] = [];
    const edges: KnowledgeGraphEdge[] = [];

    for (const event of events) {
      // Create event node
      const eventNode: KnowledgeGraphNode = {
        id: `event:${event.id}`,
        type: "event",
        label: event.eventType,
        properties: {
          happenedAt: event.happenedAt,
          recordedAt: event.recordedAt,
          confidenceScore: event.confidenceScore,
          status: event.status,
        },
        confidence: event.confidenceScore,
      };
      nodes.push(eventNode);

      // Create actor node and edge
      if (event.actor) {
        const actorId = `actor:${event.actor.id || event.actor.name}`;
        const actorNode: KnowledgeGraphNode = {
          id: actorId,
          type: event.actor.type === "user" ? "person" : "organization",
          label: event.actor.name || event.actor.id || "Unknown",
          properties: {
            type: event.actor.type,
          },
        };
        nodes.push(actorNode);

        edges.push({
          id: `edge:${event.id}:actor`,
          source: actorId,
          target: eventNode.id,
          type: "performed",
          properties: {},
          confidence: event.confidenceScore,
        });
      }

      // Create entity reference nodes and edges
      if (event.entityRefs) {
        for (const [entityType, entityId] of Object.entries(event.entityRefs)) {
          const entityNodeId = `${entityType}:${entityId}`;
          const entityNode: KnowledgeGraphNode = {
            id: entityNodeId,
            type: "entity",
            label: `${entityType}:${entityId}`,
            properties: {
              entityType,
              entityId,
            },
          };
          nodes.push(entityNode);

          edges.push({
            id: `edge:${event.id}:${entityType}`,
            source: eventNode.id,
            target: entityNodeId,
            type: "references",
            properties: {
              entityType,
            },
            confidence: event.confidenceScore,
          });
        }
      }

      // Create evidence nodes and edges
      if (event.evidenceLinks && event.evidenceLinks.length > 0) {
        for (const evidenceId of event.evidenceLinks) {
          const evidenceNode: KnowledgeGraphNode = {
            id: `evidence:${evidenceId}`,
            type: "evidence",
            label: `Evidence ${evidenceId}`,
            properties: {
              evidenceId,
            },
          };
          nodes.push(evidenceNode);

          edges.push({
            id: `edge:${event.id}:evidence:${evidenceId}`,
            source: eventNode.id,
            target: evidenceNode.id,
            type: "supports",
            properties: {},
            confidence: event.confidenceScore,
          });
        }
      }
    }

    // Deduplicate nodes
    const uniqueNodes = new Map<string, KnowledgeGraphNode>();
    for (const node of nodes) {
      if (!uniqueNodes.has(node.id)) {
        uniqueNodes.set(node.id, node);
      } else {
        // Merge properties
        const existing = uniqueNodes.get(node.id)!;
        existing.properties = { ...existing.properties, ...node.properties };
      }
    }

    return {
      nodes: Array.from(uniqueNodes.values()),
      edges,
    };
  }

  /**
   * Query knowledge graph
   */
  async queryGraph(query: KnowledgeGraphQuery): Promise<KnowledgeGraphResult> {
    // Use existing graph service if available
    if (entityGraphService) {
      try {
        const result = (await (entityGraphService as any).query?.({
          entityId: query.entityId,
          entityType: query.entityType,
          relationshipType: query.relationshipType,
          depth: query.depth || 2,
          filters: query.filters,
        })) || { nodes: [], edges: [] };

        return {
          nodes: result.nodes.map((n: any) => ({
            id: n.id,
            type: n.type as any,
            label: n.label,
            properties: n.properties,
            confidence: n.confidence,
          })),
          edges: result.edges.map((e: any) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            type: e.type,
            properties: e.properties,
            confidence: e.confidence,
          })),
        };
      } catch (error) {
        console.error("Graph service query failed:", error);
      }
    }

    // Fallback: return empty result
    return {
      nodes: [],
      edges: [],
    };
  }

  /**
   * Find paths between entities
   */
  async findPaths(
    sourceId: string,
    targetId: string,
    maxDepth: number = 5,
  ): Promise<
    Array<{
      nodes: KnowledgeGraphNode[];
      edges: KnowledgeGraphEdge[];
      confidence: number;
    }>
  > {
    // Use graph service if available
    if (entityGraphService) {
      try {
        const paths =
          (await (entityGraphService as any).findPaths?.(
            sourceId,
            targetId,
            maxDepth,
          )) || [];
        return paths.map((path: any) => ({
          nodes: path.nodes.map((n: any) => ({
            id: n.id,
            type: n.type as any,
            label: n.label,
            properties: n.properties,
            confidence: n.confidence,
          })),
          edges: path.edges.map((e: any) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            type: e.type,
            properties: e.properties,
            confidence: e.confidence,
          })),
          confidence: path.confidence || 0.5,
        }));
      } catch (error) {
        console.error("Graph service path finding failed:", error);
      }
    }

    return [];
  }

  /**
   * Extract claims from events and add to graph
   */
  async extractClaims(events: TruthEvent[]): Promise<KnowledgeGraphNode[]> {
    const claimNodes: KnowledgeGraphNode[] = [];

    for (const event of events) {
      // Extract claims from event metadata or description
      if (event.metadata?.claims) {
        for (const claim of event.metadata.claims) {
          const claimNode: KnowledgeGraphNode = {
            id: `claim:${claim.id || `${event.id}:${claim.text?.substring(0, 20)}`}`,
            type: "claim",
            label: claim.text || "Unknown claim",
            properties: {
              sourceEventId: event.id,
              confidence: claim.confidence || event.confidenceScore,
              verified: claim.verified || false,
            },
            confidence: claim.confidence || event.confidenceScore,
          };
          claimNodes.push(claimNode);
        }
      }
    }

    return claimNodes;
  }

  /**
   * Detect anomalies in knowledge graph
   */
  async detectAnomalies(graph: KnowledgeGraphResult): Promise<{
    anomalies: Array<{
      type: string;
      description: string;
      nodes: string[];
      confidence: number;
    }>;
  }> {
    const anomalies: Array<{
      type: string;
      description: string;
      nodes: string[];
      confidence: number;
    }> = [];

    // Check for isolated nodes (no connections)
    const connectedNodes = new Set<string>();
    for (const edge of graph.edges) {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    }

    for (const node of graph.nodes) {
      if (!connectedNodes.has(node.id) && node.type !== "evidence") {
        anomalies.push({
          type: "isolated_node",
          description: `Node ${node.label} has no connections`,
          nodes: [node.id],
          confidence: 0.7,
        });
      }
    }

    // Check for low confidence paths
    for (const edge of graph.edges) {
      if (edge.confidence && edge.confidence < 0.5) {
        anomalies.push({
          type: "low_confidence_relationship",
          description: `Low confidence relationship between nodes`,
          nodes: [edge.source, edge.target],
          confidence: edge.confidence,
        });
      }
    }

    return { anomalies };
  }
}

export const truthKnowledgeGraphService = new TruthKnowledgeGraphService();
