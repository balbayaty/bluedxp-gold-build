/**
 * Network Graph Visualization Service
 * Creates interactive network graphs for entity relationships, evidence flow, and event dependencies
 */

import { TruthEvent, TruthEvidenceItem } from "@/types/truth-engine";

export interface NetworkNode {
  id: string;
  label: string;
  type: "event" | "evidence" | "entity" | "module" | "persona";
  size: number;
  color: string;
  metadata?: Record<string, any>;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: "evidence_link" | "entity_ref" | "derived_from" | "related_to";
  weight: number;
  metadata?: Record<string, any>;
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  layout: "force" | "hierarchical" | "circular" | "grid";
}

export class NetworkGraphService {
  /**
   * Create network graph from events
   */
  createEventNetworkGraph(events: TruthEvent[]): NetworkGraph {
    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];
    const nodeMap = new Map<string, NetworkNode>();

    events.forEach((event) => {
      // Add event node
      if (!nodeMap.has(event.id)) {
        nodes.push({
          id: event.id,
          label: event.eventType,
          type: "event",
          size: 10 + event.confidenceScore * 20,
          color: this.getConfidenceColor(event.confidenceScore),
          metadata: {
            eventType: event.eventType,
            confidenceScore: event.confidenceScore,
            happenedAt: event.happenedAt,
          },
        });
        nodeMap.set(event.id, nodes[nodes.length - 1]);
      }

      // Add evidence nodes and edges
      event.evidenceLinks.forEach((evidenceId, index) => {
        const evidenceNodeId = `evidence-${evidenceId}`;
        if (!nodeMap.has(evidenceNodeId)) {
          nodes.push({
            id: evidenceNodeId,
            label: `Evidence ${evidenceId.substring(0, 8)}`,
            type: "evidence",
            size: 8,
            color: "#10b981",
            metadata: {
              evidenceId,
            },
          });
          nodeMap.set(evidenceNodeId, nodes[nodes.length - 1]);
        }

        edges.push({
          id: `edge-${event.id}-${evidenceId}`,
          source: event.id,
          target: evidenceNodeId,
          type: "evidence_link",
          weight: 1,
        });
      });

      // Add entity nodes and edges
      Object.entries(event.entityRefs).forEach(([entityType, entityId]) => {
        const entityNodeId = `entity-${entityType}-${entityId}`;
        if (!nodeMap.has(entityNodeId)) {
          nodes.push({
            id: entityNodeId,
            label: `${entityType}: ${entityId.substring(0, 8)}`,
            type: "entity",
            size: 12,
            color: "#3b82f6",
            metadata: {
              entityType,
              entityId,
            },
          });
          nodeMap.set(entityNodeId, nodes[nodes.length - 1]);
        }

        edges.push({
          id: `edge-${event.id}-${entityNodeId}`,
          source: event.id,
          target: entityNodeId,
          type: "entity_ref",
          weight: 1,
        });
      });
    });

    return {
      nodes,
      edges,
      layout: "force",
    };
  }

  /**
   * Create evidence flow diagram
   */
  createEvidenceFlowGraph(
    events: TruthEvent[],
    evidence: TruthEvidenceItem[],
  ): NetworkGraph {
    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];
    const nodeMap = new Map<string, NetworkNode>();

    // Add evidence nodes
    evidence.forEach((ev) => {
      nodes.push({
        id: ev.id,
        label: ev.title || ev.type,
        type: "evidence",
        size: 10,
        color: this.getEvidenceTypeColor(ev.type),
        metadata: {
          evidenceType: ev.type,
          sourceSystem: ev.sourceSystem,
        },
      });
      nodeMap.set(ev.id, nodes[nodes.length - 1]);
    });

    // Add event nodes and flow edges
    events.forEach((event) => {
      if (!nodeMap.has(event.id)) {
        nodes.push({
          id: event.id,
          label: event.eventType,
          type: "event",
          size: 12,
          color: "#3b82f6",
        });
        nodeMap.set(event.id, nodes[nodes.length - 1]);
      }

      event.evidenceLinks.forEach((evidenceId) => {
        if (nodeMap.has(evidenceId)) {
          edges.push({
            id: `flow-${evidenceId}-${event.id}`,
            source: evidenceId,
            target: event.id,
            type: "evidence_link",
            weight: 1,
          });
        }
      });
    });

    return {
      nodes,
      edges,
      layout: "hierarchical",
    };
  }

  /**
   * Create entity relationship network
   */
  createEntityRelationshipGraph(events: TruthEvent[]): NetworkGraph {
    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];
    const entityMap = new Map<string, NetworkNode>();
    const relationships = new Map<string, Set<string>>();

    // Extract entities and relationships
    events.forEach((event) => {
      const entities = Object.entries(event.entityRefs);

      entities.forEach(([type, id]) => {
        const nodeId = `${type}-${id}`;
        if (!entityMap.has(nodeId)) {
          nodes.push({
            id: nodeId,
            label: `${type}: ${id.substring(0, 8)}`,
            type: "entity",
            size: 15,
            color: this.getEntityTypeColor(type),
            metadata: {
              entityType: type,
              entityId: id,
            },
          });
          entityMap.set(nodeId, nodes[nodes.length - 1]);
        }
      });

      // Create relationships between entities in same event
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const node1 = `${entities[i][0]}-${entities[i][1]}`;
          const node2 = `${entities[j][0]}-${entities[j][1]}`;
          const key = [node1, node2].sort().join("-");

          if (!relationships.has(key)) {
            relationships.set(key, new Set());
            edges.push({
              id: `rel-${key}`,
              source: node1,
              target: node2,
              type: "related_to",
              weight: 1,
            });
          } else {
            // Increase weight for multiple relationships
            const edge = edges.find((e) => e.id === `rel-${key}`);
            if (edge) {
              edge.weight += 1;
            }
          }
        }
      }
    });

    return {
      nodes,
      edges,
      layout: "force",
    };
  }

  /**
   * Get color based on confidence score
   */
  private getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return "#10b981"; // Green
    if (confidence >= 0.6) return "#f59e0b"; // Yellow
    return "#ef4444"; // Red
  }

  /**
   * Get color based on evidence type
   */
  private getEvidenceTypeColor(type: string): string {
    const colors: Record<string, string> = {
      document: "#3b82f6",
      image: "#8b5cf6",
      video: "#ec4899",
      audio: "#f59e0b",
      sensor: "#10b981",
      log: "#6b7280",
    };
    return colors[type] || "#6b7280";
  }

  /**
   * Get color based on entity type
   */
  private getEntityTypeColor(type: string): string {
    const colors: Record<string, string> = {
      shipment: "#3b82f6",
      order: "#8b5cf6",
      customer: "#ec4899",
      warehouse: "#10b981",
      container: "#f59e0b",
    };
    return colors[type] || "#6b7280";
  }
}

export const networkGraphService = new NetworkGraphService();
