/**
 * QR Network Intelligence Service
 * Revolutionary QR Code Network & Relationship System
 * Future-Ready (2024-2040)
 *
 * Features:
 * - QR Code Networks (Connected QR codes)
 * - Network Effects (Value increases with usage)
 * - QR Code Relationships (Parent-child, sibling, dependency)
 * - Network Analytics (Graph-based intelligence)
 * - Collaborative QR Codes (Multi-user QR codes)
 * - QR Code Communities (Shared QR spaces)
 */

import { eventBus } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { qrDatabaseAdapter } from "./database/qrDatabaseAdapter";

export interface QRNetwork {
  id: string;
  name: string;
  description: string;
  qrCodes: string[]; // QR IDs in network
  relationships: QRRelationship[];
  networkType: "hierarchical" | "mesh" | "star" | "ring" | "custom";
  metadata: {
    createdBy: string;
    createdAt: Date;
    lastUpdated: Date;
    visibility: "private" | "shared" | "public";
    tags: string[];
  };
}

export interface QRRelationship {
  from: string; // QR ID
  to: string; // QR ID
  type:
    | "parent"
    | "child"
    | "sibling"
    | "dependency"
    | "related"
    | "alternative"
    | "version";
  strength: number; // 0-1
  bidirectional: boolean;
  metadata: {
    description?: string;
    createdBy?: string;
    createdAt?: Date;
  };
}

export interface QRNetworkAnalytics {
  networkId: string;
  totalNodes: number;
  totalEdges: number;
  networkDensity: number; // 0-1
  centralNodes: Array<{
    qrId: string;
    centrality: number;
    influence: number;
  }>;
  communities: Array<{
    id: string;
    qrCodes: string[];
    cohesion: number;
  }>;
  paths: Array<{
    from: string;
    to: string;
    path: string[];
    distance: number;
  }>;
  insights: string[];
}

export interface CollaborativeQR {
  qrId: string;
  collaborators: Array<{
    userId: string;
    role: "owner" | "editor" | "viewer" | "contributor";
    permissions: string[];
  }>;
  sharedWith: Array<{
    tenantId?: string;
    teamId?: string;
    userId?: string;
  }>;
  versionHistory: Array<{
    version: number;
    changedBy: string;
    changes: string[];
    timestamp: Date;
  }>;
  comments: Array<{
    id: string;
    userId: string;
    comment: string;
    timestamp: Date;
    replies?: Array<{
      id: string;
      userId: string;
      comment: string;
      timestamp: Date;
    }>;
  }>;
}

export class QRNetworkIntelligenceService {
  // Database adapter handles storage with automatic in-memory fallback
  private dbAdapter = qrDatabaseAdapter;
  private networkModel: QRNetworkModel | null = null;

  private async getModel(): Promise<QRNetworkModel | null> {
    if (this.networkModel) return this.networkModel;

    try {
      const db = getDatabaseClient();
      await db.connect();
      this.networkModel = new QRNetworkModel(db);
      return this.networkModel;
    } catch (error) {
      console.warn("Database not available, using in-memory storage:", error);
      return null;
    }
  }

  /**
   * Create QR network
   */
  async createNetwork(network: Omit<QRNetwork, "id">): Promise<QRNetwork> {
    try {
      const model = await this.getModel();
      if (model) {
        // Use database
        const dbNetwork = await model.create({
          name: network.name,
          description: network.description,
          networkType: network.networkType,
          visibility: network.metadata.visibility || "private",
          metadata: network.metadata,
        });

        // Add QR codes to network
        for (const qrId of network.qrCodes) {
          await model.addQRToNetwork(dbNetwork.id, qrId);
        }

        // Store relationships
        for (const rel of network.relationships) {
          await model.createRelationship({
            from: rel.from,
            to: rel.to,
            type: rel.type,
            strength: rel.strength,
            bidirectional: rel.bidirectional,
            metadata: rel.metadata,
          });
        }

        // Convert to interface format
        const qrCodes = await model.getNetworkQRCodes(dbNetwork.id);
        const relationships = await Promise.all(
          qrCodes.map(async (qrId) => {
            const rels = await model.getRelationships(qrId);
            return rels
              .filter((r) => r.from_qr_id === qrId)
              .map((r) => ({
                from: r.from_qr_id,
                to: r.to_qr_id,
                type: r.relationship_type as any,
                strength: r.strength,
                bidirectional: r.bidirectional,
                metadata:
                  typeof r.metadata === "string"
                    ? JSON.parse(r.metadata)
                    : r.metadata,
              }));
          }),
        ).then((arr) => arr.flat());

        const fullNetwork: QRNetwork = {
          id: dbNetwork.id,
          name: dbNetwork.name,
          description: dbNetwork.description || "",
          qrCodes,
          relationships,
          networkType: dbNetwork.network_type as any,
          metadata: {
            createdBy:
              typeof dbNetwork.metadata === "string"
                ? JSON.parse(dbNetwork.metadata).createdBy
                : dbNetwork.metadata?.createdBy || "system",
            createdAt: dbNetwork.created_at,
            lastUpdated: dbNetwork.updated_at,
            visibility: dbNetwork.visibility as any,
            tags:
              typeof dbNetwork.metadata === "string"
                ? JSON.parse(dbNetwork.metadata).tags || []
                : dbNetwork.metadata?.tags || [],
          },
        };

        // Publish event
        await eventBus.publish({
          id: `event-${Date.now()}`,
          type: "qr.network.created",
          aggregateId: dbNetwork.id,
          aggregateType: "QRNetwork",
          version: 1,
          timestamp: new Date(),
          data: { networkId: dbNetwork.id },
          metadata: {},
        });

        return fullNetwork;
      }
    } catch (error) {
      console.error("Error creating network in database:", error);
    }

    // Fallback to in-memory
    const id = `network-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const fullNetwork: QRNetwork = {
      id,
      ...network,
      metadata: {
        ...network.metadata,
        createdAt: new Date(),
        lastUpdated: new Date(),
      },
    };

    this.networks.set(id, fullNetwork);

    // Store relationships
    network.relationships.forEach((rel) => {
      this.addRelationship(rel);
    });

    // Publish event
    await eventBus.publish({
      id: `event-${Date.now()}`,
      type: "qr.network.created",
      aggregateId: id,
      aggregateType: "QRNetwork",
      version: 1,
      timestamp: new Date(),
      data: { networkId: id },
      metadata: {},
    });

    return fullNetwork;
  }

  /**
   * Add relationship between QR codes
   */
  async addRelationship(relationship: QRRelationship): Promise<void> {
    const key = `${relationship.from}-${relationship.to}`;
    const existing = this.relationships.get(relationship.from) || [];

    if (
      !existing.find(
        (r) => r.to === relationship.to && r.type === relationship.type,
      )
    ) {
      existing.push(relationship);
      this.relationships.set(relationship.from, existing);
    }

    // If bidirectional, add reverse
    if (relationship.bidirectional) {
      const reverse: QRRelationship = {
        from: relationship.to,
        to: relationship.from,
        type: relationship.type,
        strength: relationship.strength,
        bidirectional: true,
        metadata: relationship.metadata,
      };
      const reverseExisting = this.relationships.get(relationship.to) || [];
      if (
        !reverseExisting.find(
          (r) => r.to === relationship.from && r.type === relationship.type,
        )
      ) {
        reverseExisting.push(reverse);
        this.relationships.set(relationship.to, reverseExisting);
      }
    }
  }

  /**
   * Analyze network
   */
  async analyzeNetwork(networkId: string): Promise<QRNetworkAnalytics> {
    let network: QRNetwork | null = null;

    try {
      const model = await this.getModel();
      if (model) {
        // Load from database
        const dbNetwork = await model.getById(networkId);
        if (dbNetwork) {
          const qrCodes = await model.getNetworkQRCodes(networkId);
          const relationships = await Promise.all(
            qrCodes.map(async (qrId) => {
              const rels = await model.getRelationships(qrId);
              return rels
                .filter((r) => r.from_qr_id === qrId)
                .map((r) => ({
                  from: r.from_qr_id,
                  to: r.to_qr_id,
                  type: r.relationship_type as any,
                  strength: r.strength,
                  bidirectional: r.bidirectional,
                  metadata:
                    typeof r.metadata === "string"
                      ? JSON.parse(r.metadata)
                      : r.metadata,
                }));
            }),
          ).then((arr) => arr.flat());

          network = {
            id: dbNetwork.id,
            name: dbNetwork.name,
            description: dbNetwork.description || "",
            qrCodes,
            relationships,
            networkType: dbNetwork.network_type as any,
            metadata: {
              createdBy:
                typeof dbNetwork.metadata === "string"
                  ? JSON.parse(dbNetwork.metadata).createdBy
                  : dbNetwork.metadata?.createdBy || "system",
              createdAt: dbNetwork.created_at,
              lastUpdated: dbNetwork.updated_at,
              visibility: dbNetwork.visibility as any,
              tags:
                typeof dbNetwork.metadata === "string"
                  ? JSON.parse(dbNetwork.metadata).tags || []
                  : dbNetwork.metadata?.tags || [],
            },
          };
        }
      }
    } catch (error) {
      console.error("Error loading network from database:", error);
    }

    // Fallback to in-memory
    if (!network) {
      network = this.networks.get(networkId) || null;
    }

    if (!network) {
      throw new Error(`Network ${networkId} not found`);
    }

    // Calculate network metrics
    const totalNodes = network.qrCodes.length;
    const totalEdges = network.relationships.length;

    // Calculate density (actual edges / possible edges)
    const possibleEdges = (totalNodes * (totalNodes - 1)) / 2;
    const networkDensity = possibleEdges > 0 ? totalEdges / possibleEdges : 0;

    // Find central nodes (nodes with most connections)
    const centralNodes = network.qrCodes
      .map((qrId) => {
        const connections = network.relationships.filter(
          (r) => r.from === qrId || r.to === qrId,
        ).length;
        return {
          qrId,
          centrality: connections / totalNodes,
          influence: connections * networkDensity,
        };
      })
      .sort((a, b) => b.centrality - a.centrality)
      .slice(0, 10);

    // Detect communities (simplified - in production, use graph algorithms)
    const communities = this.detectCommunities(network);

    // Find paths between nodes
    const paths = this.findPaths(network);

    // Generate insights
    const insights = await this.generateNetworkInsights(network, {
      totalNodes,
      totalEdges,
      networkDensity,
      centralNodes,
      communities,
      paths,
    });

    return {
      networkId,
      totalNodes,
      totalEdges,
      networkDensity,
      centralNodes,
      communities,
      paths,
      insights,
    };
  }

  /**
   * Create collaborative QR code
   */
  async createCollaborativeQR(
    qrId: string,
    ownerId: string,
  ): Promise<CollaborativeQR> {
    const collaborative: CollaborativeQR = {
      qrId,
      collaborators: [
        {
          userId: ownerId,
          role: "owner",
          permissions: ["read", "write", "delete", "share", "manage"],
        },
      ],
      sharedWith: [],
      versionHistory: [
        {
          version: 1,
          changedBy: ownerId,
          changes: ["Initial creation"],
          timestamp: new Date(),
        },
      ],
      comments: [],
    };

    this.collaborativeQRs.set(qrId, collaborative);
    return collaborative;
  }

  /**
   * Add collaborator to QR code
   */
  async addCollaborator(
    qrId: string,
    collaborator: {
      userId: string;
      role: "owner" | "editor" | "viewer" | "contributor";
      permissions: string[];
    },
  ): Promise<void> {
    try {
      const model = await this.getModel();
      if (model) {
        // Use database
        const dbCollab = await model.getCollaborativeQR(qrId);
        if (!dbCollab) {
          throw new Error(`Collaborative QR ${qrId} not found`);
        }

        await model.addCollaborator(
          dbCollab.id,
          collaborator.userId,
          collaborator.role,
          collaborator.permissions,
        );
        return;
      }
    } catch (error) {
      console.error("Error adding collaborator to database:", error);
    }

    // Fallback to in-memory
    const collaborative = this.collaborativeQRs.get(qrId);
    if (!collaborative) {
      throw new Error(`Collaborative QR ${qrId} not found`);
    }

    if (
      !collaborative.collaborators.find((c) => c.userId === collaborator.userId)
    ) {
      collaborative.collaborators.push(collaborator);
      this.collaborativeQRs.set(qrId, collaborative);
    }
  }

  /**
   * Add comment to QR code
   */
  async addComment(
    qrId: string,
    userId: string,
    comment: string,
    parentCommentId?: string,
  ): Promise<void> {
    try {
      const model = await this.getModel();
      if (model) {
        // Use database
        const dbCollab = await model.getCollaborativeQR(qrId);
        if (!dbCollab) {
          throw new Error(`Collaborative QR ${qrId} not found`);
        }

        await model.addComment(dbCollab.id, userId, comment, parentCommentId);
        return;
      }
    } catch (error) {
      console.error("Error adding comment to database:", error);
    }

    // Fallback to in-memory
    const collaborative = this.collaborativeQRs.get(qrId);
    if (!collaborative) {
      throw new Error(`Collaborative QR ${qrId} not found`);
    }

    const newComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      userId,
      comment,
      timestamp: new Date(),
    };

    if (parentCommentId) {
      // Add as reply
      const parent = collaborative.comments.find(
        (c) => c.id === parentCommentId,
      );
      if (parent) {
        if (!parent.replies) parent.replies = [];
        parent.replies.push(newComment);
      }
    } else {
      // Add as top-level comment
      collaborative.comments.push(newComment);
    }

    this.collaborativeQRs.set(qrId, collaborative);
  }

  // Helper methods
  private detectCommunities(
    network: QRNetwork,
  ): Array<{ id: string; qrCodes: string[]; cohesion: number }> {
    // Simplified community detection (in production, use graph algorithms like Louvain)
    const communities: Array<{
      id: string;
      qrCodes: string[];
      cohesion: number;
    }> = [];

    // Group by relationship type
    const byType = new Map<string, string[]>();
    network.relationships.forEach((rel) => {
      if (!byType.has(rel.type)) {
        byType.set(rel.type, []);
      }
      byType.get(rel.type)!.push(rel.from, rel.to);
    });

    byType.forEach((codes, type) => {
      const uniqueCodes = Array.from(new Set(codes));
      communities.push({
        id: `community-${type}`,
        qrCodes: uniqueCodes,
        cohesion: uniqueCodes.length / network.qrCodes.length,
      });
    });

    return communities;
  }

  private findPaths(
    network: QRNetwork,
  ): Array<{ from: string; to: string; path: string[]; distance: number }> {
    // Simplified path finding (in production, use BFS/DFS)
    const paths: Array<{
      from: string;
      to: string;
      path: string[];
      distance: number;
    }> = [];

    // Find shortest paths between all pairs (simplified)
    for (let i = 0; i < network.qrCodes.length; i++) {
      for (let j = i + 1; j < network.qrCodes.length; j++) {
        const from = network.qrCodes[i];
        const to = network.qrCodes[j];
        const path = this.findShortestPath(network, from, to);
        if (path.length > 0) {
          paths.push({
            from,
            to,
            path,
            distance: path.length - 1,
          });
        }
      }
    }

    return paths.slice(0, 20); // Limit to top 20
  }

  private findShortestPath(
    network: QRNetwork,
    from: string,
    to: string,
  ): string[] {
    // BFS to find shortest path
    const queue: Array<{ node: string; path: string[] }> = [
      { node: from, path: [from] },
    ];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { node, path } = queue.shift()!;

      if (node === to) {
        return path;
      }

      if (visited.has(node)) continue;
      visited.add(node);

      // Get neighbors
      const neighbors = network.relationships
        .filter((r) => r.from === node)
        .map((r) => r.to);

      neighbors.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          queue.push({ node: neighbor, path: [...path, neighbor] });
        }
      });
    }

    return [];
  }

  private async generateNetworkInsights(
    network: QRNetwork,
    analytics: any,
  ): Promise<string[]> {
    const insights: string[] = [];

    if (analytics.networkDensity > 0.7) {
      insights.push("High network density - QR codes are well-connected");
    }

    if (analytics.centralNodes.length > 0) {
      const topNode = analytics.centralNodes[0];
      insights.push(
        `QR code ${topNode.qrId} is the most central node with ${topNode.centrality.toFixed(2)} centrality`,
      );
    }

    if (analytics.communities.length > 1) {
      insights.push(
        `Network contains ${analytics.communities.length} distinct communities`,
      );
    }

    // Use knowledge base for semantic insights
    try {
      const kbResults = await knowledgeBaseService.semanticSearch(
        `QR code network patterns and optimization strategies`,
        { limit: 3 },
      );
      if (kbResults.length > 0) {
        insights.push(
          `Knowledge base suggests: ${kbResults[0].entry.summary || "Consider network optimization"}`,
        );
      }
    } catch (error) {
      // Ignore KB errors
    }

    return insights;
  }
}

export const qrNetworkIntelligenceService = new QRNetworkIntelligenceService();
