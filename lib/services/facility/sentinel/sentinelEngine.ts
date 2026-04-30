import { v4 as uuidv4 } from "uuid";

export type NodeType =
  | "INFRASTRUCTURE"
  | "ASSET"
  | "ZONE"
  | "SENSOR"
  | "PROCESS";
export type NodeStatus =
  | "OPERATIONAL"
  | "WARNING"
  | "CRITICAL"
  | "FAILED"
  | "OFFLINE";

export interface SentinelNode {
  id: string;
  type: NodeType;
  label: string;
  status: NodeStatus;
  health: number; // 0-100
  degradationRate: number; // Health lost per hour
  criticality: number; // 1-10, how important this node is
  metadata?: Record<string, any>;
}

export interface SentinelEdge {
  id: string;
  source: string;
  target: string;
  type: "DEPENDENCY" | "DATA" | "POWER" | "Thermal";
  weight: number; // 0-1, strength of dependency
}

export interface SimulationResult {
  impactedNodes: string[];
  systemHealth: number;
  cascadingSteps: number;
  logs: string[];
}

export class SentinelEngine {
  private nodes: Map<string, SentinelNode> = new Map();
  private edges: SentinelEdge[] = [];

  constructor() {}

  // --- Graph Management ---

  public addNode(node: SentinelNode): void {
    this.nodes.set(node.id, node);
  }

  public addEdge(edge: SentinelEdge): void {
    this.edges.push(edge);
  }

  public getGraph() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
    };
  }

  public resetGraph(nodes: SentinelNode[], edges: SentinelEdge[]) {
    this.nodes.clear();
    this.edges = [];
    nodes.forEach((n) => this.addNode(n));
    edges.forEach((e) => this.addEdge(e));
  }

  // --- Logic & Simulation ---

  /**
   * Simulates what happens if a specific node fails.
   * Uses BFS to traverse dependencies.
   */
  public simulateFailure(startNodeId: string): SimulationResult {
    const impactedNodes: Set<string> = new Set();
    const logs: string[] = [];
    const queue: string[] = [startNodeId];
    impactedNodes.add(startNodeId);

    logs.push(
      `Fail event initiated at node: ${this.nodes.get(startNodeId)?.label || startNodeId}`,
    );

    let steps = 0;

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (!currentId) continue;
      steps++;

      // Find all nodes that depend on the current node
      // In our graph, if A -> B (A depends on B), then if B fails, A fails.
      // So we look for edges where edge.target === currentId
      // WAIT: Usually edge A->B means A flows to B.
      // Let's define: Source PROVIDES to Target.
      // So if Source Fails, Target is impacted.

      const downstreamEdges = this.edges.filter((e) => e.source === currentId);

      for (const edge of downstreamEdges) {
        if (!impactedNodes.has(edge.target)) {
          const targetNode = this.nodes.get(edge.target);
          if (!targetNode) continue;

          // Logic: Does the target fail completely?
          // For this simulation, we assume cascading failure if weight > 0.5
          // Or we can just say it degrades.

          // "Mind blowing" logic: Probability check or Threshold check
          if (edge.weight > 0.3) {
            impactedNodes.add(edge.target);
            queue.push(edge.target);
            logs.push(
              `FAILURE PROPAGATED: ${this.nodes.get(currentId)?.label} -> ${targetNode.label} (Dependency: ${edge.type})`,
            );
          } else {
            logs.push(
              `Resilience Check: ${targetNode.label} survived failure of ${this.nodes.get(currentId)?.label} (Low Dependency)`,
            );
          }
        }
      }
    }

    // Calculate system health after simulation
    const totalNodes = this.nodes.size;
    const impactCount = impactedNodes.size;
    const systemHealth = Math.max(0, 100 - (impactCount / totalNodes) * 100);

    return {
      impactedNodes: Array.from(impactedNodes),
      systemHealth,
      cascadingSteps: steps,
      logs,
    };
  }

  /**
   * THE ORACLE: Predicts the state of the facility X hours in the future.
   * account for natural degradation and cascading failures.
   */
  public predictState(hours: number): {
    nodes: SentinelNode[];
    logs: string[];
  } {
    const logs: string[] = [];
    logs.push(
      `ORACLE ACTIVATED: Simulating +${hours} hours into the future...`,
    );

    // 1. Clone current state
    const futureNodes = Array.from(this.nodes.values()).map((n) => ({ ...n }));
    const nodeMap = new Map(futureNodes.map((n) => [n.id, n]));
    const failedNodeIds = new Set<string>();

    // 2. Apply degradation
    futureNodes.forEach((node) => {
      if (node.status === "OPERATIONAL" || node.status === "WARNING") {
        const potentialHealth = node.health - node.degradationRate * hours;
        node.health = Math.max(0, potentialHealth);

        if (node.health === 0) {
          node.status = "FAILED";
          failedNodeIds.add(node.id);
          logs.push(
            `PREDICTION: ${node.label} will fail in ${hours}h due to wear/tear.`,
          );
        } else if (node.health < 50) {
          node.status = "WARNING";
        }
      }
    });

    // 3. Run Cascade Simulation for any naturally failed nodes
    if (failedNodeIds.size > 0) {
      // We re-use logic similar to simulateFailure but locally on the cloned set
      const queue = Array.from(failedNodeIds);

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const downstreamEdges = this.edges.filter(
          (e) => e.source === currentId,
        );

        for (const edge of downstreamEdges) {
          const targetNode = nodeMap.get(edge.target);
          if (targetNode && !failedNodeIds.has(targetNode.id)) {
            if (edge.weight > 0.3) {
              targetNode.status = "FAILED";
              targetNode.health = 0;
              failedNodeIds.add(targetNode.id);
              queue.push(targetNode.id);
              logs.push(
                `PREDICTION CASCADE: ${targetNode.label} will fail due to ${nodeMap.get(currentId)?.label}.`,
              );
            }
          }
        }
      }
    }

    return { nodes: futureNodes, logs };
  }

  /**
   * Calculates the current resilience score of the graph.
   * Higher is better. Based on connectivity and redundancy (simplified).
   */
  public calculateResilienceScore(): number {
    if (this.nodes.size === 0) return 0;

    // Simplified: Average health * (1 / connectivity_risk)
    // A fully connected graph without redundancy is risky.

    let totalHealth = 0;
    this.nodes.forEach((n) => (totalHealth += n.health));
    const avgHealth = totalHealth / this.nodes.size;

    return Math.round(avgHealth);
  }
}

export const sentinelEngine = new SentinelEngine();
