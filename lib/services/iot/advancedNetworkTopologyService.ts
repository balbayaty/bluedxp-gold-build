/**
 * 🌐 ADVANCED NETWORK TOPOLOGY SERVICE
 * Comprehensive network topology visualization and analysis
 * Deep layer architecture with full functionality
 * Source: Enhanced from chemcheck-analysis/lib/iot/advanced-iot-manager.ts
 *
 * Features:
 * - Multi-protocol network topology (WiFi, LoRa, Zigbee, 5G, Satellite)
 * - Visual network graph generation
 * - Network health analysis
 * - Path optimization
 * - Gateway load balancing
 * - Mesh network analysis
 * - Network performance metrics
 */

import { eventBus } from "@/lib/services/event-store";
import type { IoTDevice, IoTConnectivityProtocol } from "@/types/iot";

// ============================================================================
// NETWORK TOPOLOGY TYPES
// ============================================================================

export interface NetworkTopologyNode {
  id: string;
  type: "GATEWAY" | "DEVICE" | "SENSOR" | "ACTUATOR" | "EDGE_COMPUTE" | "HUB";
  name: string;
  deviceId?: string;
  status: "ONLINE" | "OFFLINE" | "DEGRADED" | "MAINTENANCE";
  position: { x: number; y: number; z?: number };
  connections: string[]; // Connected node IDs
  protocol: IoTConnectivityProtocol;
  metadata: {
    signalStrength?: number;
    latency?: number;
    bandwidth?: number;
    packetLoss?: number;
    lastSeen?: Date;
    health?: number;
    [key: string]: any;
  };
}

export interface NetworkTopologyEdge {
  id: string;
  source: string;
  target: string;
  type: "WIRED" | "WIRELESS" | "MESH" | "SATELLITE" | "CELLULAR";
  protocol: IoTConnectivityProtocol;
  strength: number; // 0-100
  latency: number; // ms
  bandwidth: number; // Mbps
  reliability: number; // 0-1
  cost?: number;
  metadata?: Record<string, any>;
}

export interface NetworkTopology {
  id: string;
  name: string;
  tenantId?: string;
  nodes: NetworkTopologyNode[];
  edges: NetworkTopologyEdge[];
  metrics: {
    totalNodes: number;
    totalEdges: number;
    onlineNodes: number;
    offlineNodes: number;
    averageLatency: number;
    averageReliability: number;
    networkHealth: number; // 0-100
    coverage: number; // percentage
    efficiency: number; // percentage
  };
  gateways: NetworkTopologyNode[];
  criticalPaths: NetworkPath[];
  bottlenecks: NetworkBottleneck[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NetworkPath {
  id: string;
  source: string;
  target: string;
  nodes: string[];
  edges: string[];
  totalLatency: number;
  totalCost: number;
  reliability: number;
  hops: number;
  isOptimal: boolean;
}

export interface NetworkBottleneck {
  id: string;
  nodeId: string;
  type: "CONGESTION" | "LATENCY" | "RELIABILITY" | "BANDWIDTH";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  impact: number; // percentage
  recommendations: string[];
  affectedDevices: string[];
}

export interface NetworkOptimization {
  type:
    | "ROUTING"
    | "LOAD_BALANCING"
    | "PROTOCOL_SWITCH"
    | "GATEWAY_PLACEMENT"
    | "MESH_OPTIMIZATION";
  description: string;
  expectedImprovement: number; // percentage
  affectedNodes: string[];
  implementationCost?: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// ============================================================================
// NETWORK TOPOLOGY SERVICE
// ============================================================================

export class AdvancedNetworkTopologyService {
  private topologies: Map<string, NetworkTopology> = new Map();

  /**
   * Generate comprehensive network topology from IoT devices
   */
  async generateTopology(
    devices: IoTDevice[],
    options: {
      tenantId?: string;
      includeOffline?: boolean;
      optimizeLayout?: boolean;
      analyzePaths?: boolean;
    } = {},
  ): Promise<NetworkTopology> {
    const {
      tenantId,
      includeOffline = false,
      optimizeLayout = true,
      analyzePaths = true,
    } = options;

    console.log(
      `🌐 Generating network topology for ${devices.length} devices...`,
    );

    // Filter devices
    const activeDevices = includeOffline
      ? devices
      : devices.filter((d) => d.status.operational === "online");

    // Identify gateways
    const gateways = activeDevices.filter((d) => d.type === "gateway");
    const nonGatewayDevices = activeDevices.filter((d) => d.type !== "gateway");

    // Create nodes
    const nodes: NetworkTopologyNode[] = [];

    // Add gateway nodes
    gateways.forEach((gateway, index) => {
      nodes.push({
        id: `gateway-${gateway.id}`,
        type: "GATEWAY",
        name: gateway.name,
        deviceId: gateway.id,
        status: gateway.status.operational === "online" ? "ONLINE" : "OFFLINE",
        position: optimizeLayout
          ? this.calculateOptimalPosition(gateway, index, gateways.length)
          : { x: index * 200, y: 0 },
        connections: [],
        protocol: gateway.connectivity.protocol,
        metadata: {
          signalStrength: gateway.connectivity.signalStrength,
          latency: gateway.connectivity.latency,
          bandwidth: gateway.connectivity.bandwidth,
          lastSeen: gateway.status.lastSeen,
          health: gateway.status.health,
        },
      });
    });

    // Add device nodes
    nonGatewayDevices.forEach((device, index) => {
      const gateway = this.findClosestGateway(device, gateways);
      const position = optimizeLayout
        ? this.calculateDevicePosition(device, gateway, nodes, index)
        : { x: (index % 10) * 150, y: Math.floor(index / 10) * 150 };

      nodes.push({
        id: `device-${device.id}`,
        type: this.mapDeviceTypeToNodeType(device.type),
        name: device.name,
        deviceId: device.id,
        status: device.status.operational === "online" ? "ONLINE" : "OFFLINE",
        position,
        connections: gateway ? [`gateway-${gateway.id}`] : [],
        protocol: device.connectivity.protocol,
        metadata: {
          signalStrength: device.connectivity.signalStrength,
          latency: device.connectivity.latency,
          bandwidth: device.connectivity.bandwidth,
          lastSeen: device.status.lastSeen,
          health: device.status.health,
          category: device.category,
          location: device.location,
        },
      });

      // Connect to gateway
      if (gateway) {
        const gatewayNode = nodes.find((n) => n.id === `gateway-${gateway.id}`);
        if (gatewayNode) {
          gatewayNode.connections.push(`device-${device.id}`);
        }
      }
    });

    // Create edges
    const edges: NetworkTopologyEdge[] = [];
    nodes.forEach((node) => {
      node.connections.forEach((targetId) => {
        const targetNode = nodes.find((n) => n.id === targetId);
        if (targetNode) {
          edges.push({
            id: `edge-${node.id}-${targetId}`,
            source: node.id,
            target: targetId,
            type: this.determineEdgeType(node.protocol, targetNode.protocol),
            protocol: node.protocol,
            strength: this.calculateConnectionStrength(node, targetNode),
            latency: this.calculateConnectionLatency(node, targetNode),
            bandwidth: Math.min(
              node.metadata.bandwidth || 0,
              targetNode.metadata.bandwidth || 0,
            ),
            reliability: this.calculateConnectionReliability(node, targetNode),
          });
        }
      });
    });

    // Analyze paths if requested
    const criticalPaths = analyzePaths
      ? this.analyzeCriticalPaths(nodes, edges)
      : [];

    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(nodes, edges);

    // Calculate metrics
    const metrics = this.calculateNetworkMetrics(nodes, edges);

    const topology: NetworkTopology = {
      id: `topology-${Date.now()}`,
      name: `Network Topology - ${new Date().toLocaleDateString()}`,
      tenantId,
      nodes,
      edges,
      metrics,
      gateways: nodes.filter((n) => n.type === "GATEWAY"),
      criticalPaths,
      bottlenecks,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.topologies.set(topology.id, topology);

    // Publish event
    eventBus.publish({
      type: "iot.network.topology.generated",
      aggregateType: "NETWORK_TOPOLOGY",
      aggregateId: topology.id,
      tenantId,
      payload: {
        topologyId: topology.id,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        networkHealth: metrics.networkHealth,
      },
      metadata: {
        timestamp: new Date(),
        source: "AdvancedNetworkTopologyService",
      },
    });

    console.log(
      `✅ Network topology generated: ${nodes.length} nodes, ${edges.length} edges`,
    );

    return topology;
  }

  /**
   * Get network topology by ID
   */
  getTopology(topologyId: string): NetworkTopology | null {
    return this.topologies.get(topologyId) || null;
  }

  /**
   * Analyze network and generate optimization recommendations
   */
  async analyzeNetworkOptimization(
    topology: NetworkTopology,
  ): Promise<NetworkOptimization[]> {
    const optimizations: NetworkOptimization[] = [];

    // Analyze routing
    const routingOptimizations = this.analyzeRoutingOptimization(topology);
    optimizations.push(...routingOptimizations);

    // Analyze load balancing
    const loadBalancingOptimizations = this.analyzeLoadBalancing(topology);
    optimizations.push(...loadBalancingOptimizations);

    // Analyze protocol efficiency
    const protocolOptimizations = this.analyzeProtocolEfficiency(topology);
    optimizations.push(...protocolOptimizations);

    // Analyze gateway placement
    const gatewayOptimizations = this.analyzeGatewayPlacement(topology);
    optimizations.push(...gatewayOptimizations);

    // Analyze mesh network
    const meshOptimizations = this.analyzeMeshNetwork(topology);
    optimizations.push(...meshOptimizations);

    return optimizations.sort((a, b) => {
      const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Visualize network topology as graph data
   */
  getTopologyGraphData(topology: NetworkTopology): {
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      status: string;
      x: number;
      y: number;
      size: number;
      color: string;
      metadata: any;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      type: string;
      strength: number;
      latency: number;
      color: string;
      width: number;
    }>;
  } {
    const nodeColors: Record<string, string> = {
      GATEWAY: "#4364D8",
      DEVICE: "#43A6DD",
      SENSOR: "#FFB11F",
      ACTUATOR: "#FF6B45",
      EDGE_COMPUTE: "#9B59B6",
      HUB: "#2ECC71",
    };

    const statusColors: Record<string, string> = {
      ONLINE: "#2ECC71",
      OFFLINE: "#E74C3C",
      DEGRADED: "#F39C12",
      MAINTENANCE: "#95A5A6",
    };

    return {
      nodes: topology.nodes.map((node) => ({
        id: node.id,
        label: node.name,
        type: node.type,
        status: node.status,
        x: node.position.x,
        y: node.position.y,
        size: node.type === "GATEWAY" ? 30 : 20,
        color: statusColors[node.status] || nodeColors[node.type] || "#95A5A6",
        metadata: node.metadata,
      })),
      edges: topology.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        strength: edge.strength,
        latency: edge.latency,
        color: this.getEdgeColor(edge),
        width: Math.max(1, edge.strength / 10),
      })),
    };
  }

  // Private helper methods

  private mapDeviceTypeToNodeType(
    deviceType: IoTDevice["type"],
  ): NetworkTopologyNode["type"] {
    const mapping: Record<IoTDevice["type"], NetworkTopologyNode["type"]> = {
      sensor: "SENSOR",
      camera: "DEVICE",
      actuator: "ACTUATOR",
      gateway: "GATEWAY",
      edge_compute: "EDGE_COMPUTE",
    };
    return mapping[deviceType] || "DEVICE";
  }

  private findClosestGateway(
    device: IoTDevice,
    gateways: IoTDevice[],
  ): IoTDevice | null {
    if (gateways.length === 0) return null;

    // Find gateway with best signal strength
    return gateways.reduce(
      (best, gateway) => {
        if (!best) return gateway;

        // Prefer same protocol
        if (gateway.connectivity.protocol === device.connectivity.protocol) {
          return gateway;
        }

        // Otherwise prefer better signal
        return gateway.connectivity.signalStrength >
          best.connectivity.signalStrength
          ? gateway
          : best;
      },
      null as IoTDevice | null,
    );
  }

  private calculateOptimalPosition(
    gateway: IoTDevice,
    index: number,
    total: number,
  ): { x: number; y: number } {
    // Arrange gateways in a circle or grid
    if (total <= 4) {
      // Grid layout
      const cols = Math.ceil(Math.sqrt(total));
      const row = Math.floor(index / cols);
      const col = index % cols;
      return { x: col * 300, y: row * 300 };
    } else {
      // Circular layout
      const angle = (index / total) * 2 * Math.PI;
      const radius = 400;
      return {
        x: 500 + radius * Math.cos(angle),
        y: 500 + radius * Math.sin(angle),
      };
    }
  }

  private calculateDevicePosition(
    device: IoTDevice,
    gateway: IoTDevice | null,
    existingNodes: NetworkTopologyNode[],
    index: number,
  ): { x: number; y: number } {
    if (!gateway) {
      // Random position if no gateway
      return { x: (index % 10) * 150, y: Math.floor(index / 10) * 150 };
    }

    const gatewayNode = existingNodes.find((n) => n.deviceId === gateway.id);
    if (!gatewayNode) {
      return { x: (index % 10) * 150, y: Math.floor(index / 10) * 150 };
    }

    // Position devices around their gateway
    const angle = (index % 8) * (Math.PI / 4); // 8 devices per gateway
    const radius = 150 + Math.floor(index / 8) * 50;
    return {
      x: gatewayNode.position.x + radius * Math.cos(angle),
      y: gatewayNode.position.y + radius * Math.sin(angle),
    };
  }

  private determineEdgeType(
    sourceProtocol: IoTConnectivityProtocol,
    targetProtocol: IoTConnectivityProtocol,
  ): NetworkTopologyEdge["type"] {
    if (sourceProtocol === "ethernet" || targetProtocol === "ethernet") {
      return "WIRED";
    }
    if (sourceProtocol === "satellite" || targetProtocol === "satellite") {
      return "SATELLITE";
    }
    if (sourceProtocol === "5g" || targetProtocol === "5g") {
      return "CELLULAR";
    }
    if (sourceProtocol === "lora" || sourceProtocol === "zigbee") {
      return "MESH";
    }
    return "WIRELESS";
  }

  private calculateConnectionStrength(
    source: NetworkTopologyNode,
    target: NetworkTopologyNode,
  ): number {
    const sourceStrength = source.metadata.signalStrength || -100;
    const targetStrength = target.metadata.signalStrength || -100;
    const avgStrength = (sourceStrength + targetStrength) / 2;

    // Convert dBm to 0-100 scale
    // -30 to -100 dBm range
    return Math.max(0, Math.min(100, ((avgStrength + 100) / 70) * 100));
  }

  private calculateConnectionLatency(
    source: NetworkTopologyNode,
    target: NetworkTopologyNode,
  ): number {
    const sourceLatency = source.metadata.latency || 0;
    const targetLatency = target.metadata.latency || 0;
    return (sourceLatency + targetLatency) / 2;
  }

  private calculateConnectionReliability(
    source: NetworkTopologyNode,
    target: NetworkTopologyNode,
  ): number {
    const sourceHealth = source.metadata.health || 0;
    const targetHealth = target.metadata.health || 0;
    const avgHealth = (sourceHealth + targetHealth) / 2;

    const sourceStatus = source.status === "ONLINE" ? 1 : 0;
    const targetStatus = target.status === "ONLINE" ? 1 : 0;

    return (avgHealth / 100) * sourceStatus * targetStatus;
  }

  private analyzeCriticalPaths(
    nodes: NetworkTopologyNode[],
    edges: NetworkTopologyEdge[],
  ): NetworkPath[] {
    const paths: NetworkPath[] = [];
    const gateways = nodes.filter((n) => n.type === "GATEWAY");
    const devices = nodes.filter((n) => n.type !== "GATEWAY");

    // Find paths from each device to its gateway
    devices.forEach((device) => {
      const deviceEdges = edges.filter(
        (e) => e.source === device.id || e.target === device.id,
      );
      const gatewayEdge = deviceEdges.find(
        (e) => nodes.find((n) => n.id === e.target)?.type === "GATEWAY",
      );

      if (gatewayEdge) {
        const gateway = nodes.find((n) => n.id === gatewayEdge.target);
        if (gateway) {
          paths.push({
            id: `path-${device.id}-${gateway.id}`,
            source: device.id,
            target: gateway.id,
            nodes: [device.id, gateway.id],
            edges: [gatewayEdge.id],
            totalLatency: gatewayEdge.latency,
            totalCost: 1,
            reliability: gatewayEdge.reliability,
            hops: 1,
            isOptimal: true,
          });
        }
      }
    });

    return paths;
  }

  private identifyBottlenecks(
    nodes: NetworkTopologyNode[],
    edges: NetworkTopologyEdge[],
  ): NetworkBottleneck[] {
    const bottlenecks: NetworkBottleneck[] = [];

    // Find congested gateways
    const gatewayConnections = new Map<string, number>();
    edges.forEach((edge) => {
      const gatewayNode = nodes.find(
        (n) => n.id === edge.target && n.type === "GATEWAY",
      );
      if (gatewayNode) {
        gatewayConnections.set(
          gatewayNode.id,
          (gatewayConnections.get(gatewayNode.id) || 0) + 1,
        );
      }
    });

    gatewayConnections.forEach((count, gatewayId) => {
      if (count > 20) {
        // More than 20 devices per gateway
        const gateway = nodes.find((n) => n.id === gatewayId);
        if (gateway) {
          bottlenecks.push({
            id: `bottleneck-${gatewayId}`,
            nodeId: gatewayId,
            type: "CONGESTION",
            severity: count > 50 ? "CRITICAL" : count > 30 ? "HIGH" : "MEDIUM",
            description: `Gateway ${gateway.name} has ${count} connected devices`,
            impact: Math.min(100, (count / 50) * 100),
            recommendations: [
              "Add additional gateway",
              "Redistribute devices to other gateways",
              "Upgrade gateway capacity",
            ],
            affectedDevices: edges
              .filter((e) => e.target === gatewayId)
              .map((e) => e.source),
          });
        }
      }
    });

    // Find high latency connections
    edges.forEach((edge) => {
      if (edge.latency > 100) {
        bottlenecks.push({
          id: `bottleneck-latency-${edge.id}`,
          nodeId: edge.source,
          type: "LATENCY",
          severity: edge.latency > 200 ? "HIGH" : "MEDIUM",
          description: `High latency connection: ${edge.latency}ms`,
          impact: Math.min(100, (edge.latency / 200) * 100),
          recommendations: [
            "Optimize routing",
            "Switch to lower latency protocol",
            "Relocate device closer to gateway",
          ],
          affectedDevices: [edge.source, edge.target],
        });
      }
    });

    return bottlenecks;
  }

  private calculateNetworkMetrics(
    nodes: NetworkTopologyNode[],
    edges: NetworkTopologyEdge[],
  ): NetworkTopology["metrics"] {
    const onlineNodes = nodes.filter((n) => n.status === "ONLINE").length;
    const offlineNodes = nodes.filter((n) => n.status === "OFFLINE").length;
    const avgLatency =
      edges.length > 0
        ? edges.reduce((sum, e) => sum + e.latency, 0) / edges.length
        : 0;
    const avgReliability =
      edges.length > 0
        ? edges.reduce((sum, e) => sum + e.reliability, 0) / edges.length
        : 0;

    const networkHealth = Math.round(
      (onlineNodes / nodes.length) * 100 * avgReliability,
    );

    // Calculate coverage (percentage of area covered)
    const coverage = this.calculateCoverage(nodes);

    // Calculate efficiency (data throughput / total capacity)
    const efficiency = this.calculateEfficiency(nodes, edges);

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      onlineNodes,
      offlineNodes,
      averageLatency: Math.round(avgLatency),
      averageReliability: Math.round(avgReliability * 100) / 100,
      networkHealth,
      coverage,
      efficiency,
    };
  }

  private calculateCoverage(nodes: NetworkTopologyNode[]): number {
    // Simplified coverage calculation
    // In production, would calculate actual geographic coverage
    const onlineNodes = nodes.filter((n) => n.status === "ONLINE").length;
    return nodes.length > 0
      ? Math.round((onlineNodes / nodes.length) * 100)
      : 0;
  }

  private calculateEfficiency(
    nodes: NetworkTopologyNode[],
    edges: NetworkTopologyEdge[],
  ): number {
    // Calculate network efficiency based on bandwidth utilization
    const totalBandwidth = edges.reduce((sum, e) => sum + e.bandwidth, 0);
    const utilizedBandwidth = edges.reduce(
      (sum, e) => sum + e.bandwidth * e.reliability,
      0,
    );
    return totalBandwidth > 0
      ? Math.round((utilizedBandwidth / totalBandwidth) * 100)
      : 0;
  }

  private analyzeRoutingOptimization(
    topology: NetworkTopology,
  ): NetworkOptimization[] {
    const optimizations: NetworkOptimization[] = [];

    // Find paths with high latency
    const highLatencyPaths = topology.criticalPaths.filter(
      (p) => p.totalLatency > 100,
    );
    if (highLatencyPaths.length > 0) {
      optimizations.push({
        type: "ROUTING",
        description: `Optimize ${highLatencyPaths.length} high-latency paths`,
        expectedImprovement: 25,
        affectedNodes: highLatencyPaths.flatMap((p) => p.nodes),
        priority: "HIGH",
      });
    }

    return optimizations;
  }

  private analyzeLoadBalancing(
    topology: NetworkTopology,
  ): NetworkOptimization[] {
    const optimizations: NetworkOptimization[] = [];

    // Analyze gateway load
    const gatewayLoads = new Map<string, number>();
    topology.edges.forEach((edge) => {
      const gateway = topology.nodes.find(
        (n) => n.id === edge.target && n.type === "GATEWAY",
      );
      if (gateway) {
        gatewayLoads.set(gateway.id, (gatewayLoads.get(gateway.id) || 0) + 1);
      }
    });

    const avgLoad =
      Array.from(gatewayLoads.values()).reduce((a, b) => a + b, 0) /
      gatewayLoads.size;
    const overloadedGateways = Array.from(gatewayLoads.entries()).filter(
      ([, load]) => load > avgLoad * 1.5,
    );

    if (overloadedGateways.length > 0) {
      optimizations.push({
        type: "LOAD_BALANCING",
        description: `Rebalance load across ${overloadedGateways.length} overloaded gateways`,
        expectedImprovement: 30,
        affectedNodes: overloadedGateways.map(([id]) => id),
        priority: "MEDIUM",
      });
    }

    return optimizations;
  }

  private analyzeProtocolEfficiency(
    topology: NetworkTopology,
  ): NetworkOptimization[] {
    const optimizations: NetworkOptimization[] = [];

    // Find devices using inefficient protocols
    const inefficientDevices = topology.nodes.filter(
      (node) =>
        node.protocol === "wifi" &&
        node.metadata.signalStrength &&
        node.metadata.signalStrength < -80,
    );

    if (inefficientDevices.length > 0) {
      optimizations.push({
        type: "PROTOCOL_SWITCH",
        description: `Switch ${inefficientDevices.length} devices to more efficient protocols (LoRa/Zigbee)`,
        expectedImprovement: 20,
        affectedNodes: inefficientDevices.map((n) => n.id),
        priority: "MEDIUM",
      });
    }

    return optimizations;
  }

  private analyzeGatewayPlacement(
    topology: NetworkTopology,
  ): NetworkOptimization[] {
    const optimizations: NetworkOptimization[] = [];

    // Find areas with poor coverage
    const devicesWithoutGateway = topology.nodes.filter(
      (n) => n.type !== "GATEWAY" && n.connections.length === 0,
    );

    if (devicesWithoutGateway.length > 5) {
      optimizations.push({
        type: "GATEWAY_PLACEMENT",
        description: `Add gateway to cover ${devicesWithoutGateway.length} unconnected devices`,
        expectedImprovement: 40,
        affectedNodes: devicesWithoutGateway.map((n) => n.id),
        priority: "HIGH",
      });
    }

    return optimizations;
  }

  private analyzeMeshNetwork(topology: NetworkTopology): NetworkOptimization[] {
    const optimizations: NetworkOptimization[] = [];

    // Analyze mesh network efficiency
    const meshEdges = topology.edges.filter((e) => e.type === "MESH");
    if (meshEdges.length > 0) {
      const avgMeshReliability =
        meshEdges.reduce((sum, e) => sum + e.reliability, 0) / meshEdges.length;

      if (avgMeshReliability < 0.7) {
        optimizations.push({
          type: "MESH_OPTIMIZATION",
          description: "Optimize mesh network routing for better reliability",
          expectedImprovement: 15,
          affectedNodes: meshEdges.flatMap((e) => [e.source, e.target]),
          priority: "MEDIUM",
        });
      }
    }

    return optimizations;
  }

  private getEdgeColor(edge: NetworkTopologyEdge): string {
    if (edge.reliability > 0.9) return "#2ECC71"; // Green
    if (edge.reliability > 0.7) return "#F39C12"; // Orange
    return "#E74C3C"; // Red
  }
}

export const advancedNetworkTopologyService =
  new AdvancedNetworkTopologyService();
