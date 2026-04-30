/**
 * WMS Route Calculation Service
 * Advanced pathfinding for warehouse operations using A* algorithm
 * with realistic aisle-based movement constraints
 */

import { PickLocation } from "@/types/picking";
import {
  WarehouseLayout,
  NavigationNode,
  NavigationEdge,
  PathResult,
  RouteOptimizationResult,
  Point2D,
  Point3D,
  Aisle,
  Zone,
  EquipmentType,
  DEFAULT_EQUIPMENT_SPEEDS,
  TURN_TIME_PENALTIES,
  euclideanDistance,
  manhattanDistance,
  isPointInPolygon,
} from "@/types/warehouseLayout";

/**
 * Priority Queue for A* algorithm
 */
class PriorityQueue<T> {
  private items: { element: T; priority: number }[] = [];

  enqueue(element: T, priority: number): void {
    const item = { element, priority };
    let added = false;

    for (let i = 0; i < this.items.length; i++) {
      if (item.priority < this.items[i].priority) {
        this.items.splice(i, 0, item);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(item);
    }
  }

  dequeue(): T | undefined {
    return this.items.shift()?.element;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  has(element: T, compareFn: (a: T, b: T) => boolean): boolean {
    return this.items.some((item) => compareFn(item.element, element));
  }

  updatePriority(
    element: T,
    newPriority: number,
    compareFn: (a: T, b: T) => boolean,
  ): void {
    const index = this.items.findIndex((item) =>
      compareFn(item.element, element),
    );
    if (index !== -1) {
      this.items.splice(index, 1);
      this.enqueue(element, newPriority);
    }
  }
}

/**
 * Warehouse Route Calculator
 * Uses A* pathfinding with warehouse-specific constraints
 */
export class WarehouseRouteCalculator {
  private layout: WarehouseLayout;
  private nodeMap: Map<string, NavigationNode>;
  private edgeMap: Map<string, NavigationEdge[]>;

  constructor(layout: WarehouseLayout) {
    this.layout = layout;
    this.nodeMap = new Map();
    this.edgeMap = new Map();
    this.initializeGraph();
  }

  /**
   * Initialize the navigation graph from layout
   */
  private initializeGraph(): void {
    // Build node map
    this.layout.navigationGraph.nodes.forEach((node) => {
      this.nodeMap.set(node.id, node);
    });

    // Build adjacency list for edges
    this.layout.navigationGraph.edges.forEach((edge) => {
      if (!this.edgeMap.has(edge.fromNodeId)) {
        this.edgeMap.set(edge.fromNodeId, []);
      }
      this.edgeMap.get(edge.fromNodeId)!.push(edge);

      // If bidirectional, add reverse edge
      if (edge.direction === "BOTH") {
        if (!this.edgeMap.has(edge.toNodeId)) {
          this.edgeMap.set(edge.toNodeId, []);
        }
        this.edgeMap.get(edge.toNodeId)!.push({
          ...edge,
          id: `${edge.id}-reverse`,
          fromNodeId: edge.toNodeId,
          toNodeId: edge.fromNodeId,
        });
      }
    });
  }

  /**
   * Find the nearest navigation node to a given location
   */
  private findNearestNode(location: PickLocation): NavigationNode | null {
    let nearestNode: NavigationNode | null = null;
    let minDistance = Infinity;

    this.nodeMap.forEach((node) => {
      const distance = euclideanDistance(
        {
          x: location.coordinates.x,
          y: location.coordinates.y,
          z: location.coordinates.z,
        },
        node.position,
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = node;
      }
    });

    return nearestNode;
  }

  /**
   * Get zone for a node position
   */
  private getNodeZone(node: NavigationNode): Zone | undefined {
    return this.layout.zones.find((zone) =>
      isPointInPolygon(
        { x: node.position.x, y: node.position.y },
        zone.boundaries,
      ),
    );
  }

  /**
   * Check if equipment type is allowed on an edge
   */
  private isEquipmentAllowed(
    edge: NavigationEdge,
    equipmentType: EquipmentType,
  ): boolean {
    return edge.equipmentAllowed.includes(equipmentType);
  }

  /**
   * A* heuristic function - uses Manhattan distance for grid-like warehouses
   */
  private heuristic(from: NavigationNode, to: NavigationNode): number {
    return manhattanDistance(
      { x: from.position.x, y: from.position.y },
      { x: to.position.x, y: to.position.y },
    );
  }

  /**
   * Calculate travel cost between two nodes
   */
  private calculateEdgeCost(
    edge: NavigationEdge,
    equipmentType: EquipmentType = "WALKING",
  ): number {
    const speed = DEFAULT_EQUIPMENT_SPEEDS[equipmentType];
    const baseTravelTime = edge.distance / speed;
    const congestionAdjustedTime = baseTravelTime * edge.congestionFactor;

    return congestionAdjustedTime;
  }

  /**
   * A* Pathfinding Algorithm
   */
  public findPath(
    from: PickLocation,
    to: PickLocation,
    options: {
      equipmentType?: EquipmentType;
      avoidZones?: string[];
      preferCrossAisles?: boolean;
    } = {},
  ): PathResult {
    const equipmentType = options.equipmentType || "WALKING";
    const avoidZones = options.avoidZones || [];

    // Find nearest nodes to start and end
    const startNode = this.findNearestNode(from);
    const endNode = this.findNearestNode(to);

    if (!startNode || !endNode) {
      // Fall back to Euclidean distance if no nodes found
      return this.createFallbackPath(from, to);
    }

    if (startNode.id === endNode.id) {
      return this.createSingleNodePath(from, to, startNode);
    }

    // A* algorithm
    const openSet = new PriorityQueue<string>();
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    const closedSet = new Set<string>();

    gScore.set(startNode.id, 0);
    fScore.set(startNode.id, this.heuristic(startNode, endNode));
    openSet.enqueue(startNode.id, fScore.get(startNode.id)!);

    while (!openSet.isEmpty()) {
      const currentId = openSet.dequeue()!;

      if (currentId === endNode.id) {
        return this.reconstructPath(
          cameFrom,
          currentId,
          from,
          to,
          gScore.get(currentId)!,
          equipmentType,
        );
      }

      closedSet.add(currentId);
      const currentNode = this.nodeMap.get(currentId)!;

      // Get all edges from current node
      const edges = this.edgeMap.get(currentId) || [];

      for (const edge of edges) {
        const neighborId = edge.toNodeId;
        const neighborNode = this.nodeMap.get(neighborId);

        if (!neighborNode || closedSet.has(neighborId)) {
          continue;
        }

        // Check equipment restrictions
        if (!this.isEquipmentAllowed(edge, equipmentType)) {
          continue;
        }

        // Check zone restrictions
        const neighborZone = this.getNodeZone(neighborNode);
        if (neighborZone && avoidZones.includes(neighborZone.id)) {
          continue;
        }

        // Check node equipment restrictions
        if (neighborNode.equipmentRestrictions.includes(equipmentType)) {
          continue;
        }

        const tentativeGScore =
          gScore.get(currentId)! + this.calculateEdgeCost(edge, equipmentType);

        if (
          !gScore.has(neighborId) ||
          tentativeGScore < gScore.get(neighborId)!
        ) {
          cameFrom.set(neighborId, currentId);
          gScore.set(neighborId, tentativeGScore);
          const f = tentativeGScore + this.heuristic(neighborNode, endNode);
          fScore.set(neighborId, f);

          if (!closedSet.has(neighborId)) {
            openSet.enqueue(neighborId, f);
          }
        }
      }
    }

    // No path found - fall back to Euclidean
    return this.createFallbackPath(from, to);
  }

  /**
   * Reconstruct path from A* result
   */
  private reconstructPath(
    cameFrom: Map<string, string>,
    endNodeId: string,
    from: PickLocation,
    to: PickLocation,
    totalTime: number,
    equipmentType: EquipmentType,
  ): PathResult {
    const path: Point3D[] = [];
    const aislesUsed = new Set<string>();
    const zonesTraversed = new Set<string>();
    let turnCount = 0;

    // Reconstruct node path
    const nodePath: string[] = [endNodeId];
    let current = endNodeId;

    while (cameFrom.has(current)) {
      current = cameFrom.get(current)!;
      nodePath.unshift(current);
    }

    // Convert to coordinates and track metrics
    let lastDirection: "H" | "V" | null = null;

    for (let i = 0; i < nodePath.length; i++) {
      const node = this.nodeMap.get(nodePath[i])!;
      path.push(node.position);

      if (node.aisleId) {
        aislesUsed.add(node.aisleId);
      }

      const zone = this.getNodeZone(node);
      if (zone) {
        zonesTraversed.add(zone.id);
      }

      // Count turns
      if (i > 0) {
        const prevNode = this.nodeMap.get(nodePath[i - 1])!;
        const dx = Math.abs(node.position.x - prevNode.position.x);
        const dy = Math.abs(node.position.y - prevNode.position.y);
        const currentDirection: "H" | "V" = dx > dy ? "H" : "V";

        if (lastDirection && currentDirection !== lastDirection) {
          turnCount++;
        }
        lastDirection = currentDirection;
      }
    }

    // Add turn time penalties
    const turnPenalty = turnCount * TURN_TIME_PENALTIES[equipmentType];
    const adjustedTime = totalTime + turnPenalty;

    // Calculate total distance along path
    let totalDistance = 0;
    for (let i = 1; i < path.length; i++) {
      totalDistance += euclideanDistance(path[i - 1], path[i]);
    }

    // Add first and last mile (from location to nearest node)
    totalDistance += euclideanDistance(
      { x: from.coordinates.x, y: from.coordinates.y, z: from.coordinates.z },
      path[0],
    );
    totalDistance += euclideanDistance(path[path.length - 1], {
      x: to.coordinates.x,
      y: to.coordinates.y,
      z: to.coordinates.z,
    });

    // Determine required equipment
    const requiresEquipment: EquipmentType[] = [];
    if (equipmentType !== "WALKING") {
      requiresEquipment.push(equipmentType);
    }

    // Check if vertical movement requires equipment
    const maxZ = Math.max(...path.map((p) => p.z));
    if (maxZ > 2) {
      if (!requiresEquipment.includes("ORDER_PICKER")) {
        requiresEquipment.push("ORDER_PICKER");
      }
    }

    return {
      path,
      totalDistance,
      estimatedTime: adjustedTime,
      turnCount,
      zonesTraversed: Array.from(zonesTraversed),
      aislesUsed: Array.from(aislesUsed),
      requiresEquipment,
      warnings: [],
    };
  }

  /**
   * Create fallback path when A* fails (uses Euclidean)
   */
  private createFallbackPath(from: PickLocation, to: PickLocation): PathResult {
    const distance = euclideanDistance(
      { x: from.coordinates.x, y: from.coordinates.y, z: from.coordinates.z },
      { x: to.coordinates.x, y: to.coordinates.y, z: to.coordinates.z },
    );

    return {
      path: [
        { x: from.coordinates.x, y: from.coordinates.y, z: from.coordinates.z },
        { x: to.coordinates.x, y: to.coordinates.y, z: to.coordinates.z },
      ],
      totalDistance: distance,
      estimatedTime: distance / DEFAULT_EQUIPMENT_SPEEDS.WALKING,
      turnCount: 0,
      zonesTraversed: [],
      aislesUsed: [],
      requiresEquipment: [],
      warnings: [
        "Using fallback Euclidean distance - warehouse layout not configured",
      ],
    };
  }

  /**
   * Create path when start and end are at the same node
   */
  private createSingleNodePath(
    from: PickLocation,
    to: PickLocation,
    node: NavigationNode,
  ): PathResult {
    const distance = euclideanDistance(
      { x: from.coordinates.x, y: from.coordinates.y, z: from.coordinates.z },
      { x: to.coordinates.x, y: to.coordinates.y, z: to.coordinates.z },
    );

    const zone = this.getNodeZone(node);

    return {
      path: [
        { x: from.coordinates.x, y: from.coordinates.y, z: from.coordinates.z },
        node.position,
        { x: to.coordinates.x, y: to.coordinates.y, z: to.coordinates.z },
      ],
      totalDistance: distance,
      estimatedTime: distance / DEFAULT_EQUIPMENT_SPEEDS.WALKING,
      turnCount: 0,
      zonesTraversed: zone ? [zone.id] : [],
      aislesUsed: node.aisleId ? [node.aisleId] : [],
      requiresEquipment: [],
      warnings: [],
    };
  }
}

/**
 * Create a mock warehouse layout for demo purposes
 */
export function createMockWarehouseLayout(): WarehouseLayout {
  const nodes: NavigationNode[] = [];
  const edges: NavigationEdge[] = [];

  // Create a simple grid layout
  const aisleCount = 10;
  const baysPerAisle = 20;
  const bayWidth = 2.5; // meters
  const aisleSpacing = 4.0; // meters

  // Generate nodes along aisles
  for (let aisle = 0; aisle < aisleCount; aisle++) {
    for (let bay = 0; bay <= baysPerAisle; bay++) {
      const nodeId = `A${aisle.toString().padStart(2, "0")}-B${bay.toString().padStart(2, "0")}`;
      nodes.push({
        id: nodeId,
        position: {
          x: aisle * aisleSpacing,
          y: bay * bayWidth,
          z: 0,
        },
        type: "LOCATION",
        connectedNodes: [],
        aisleId: `AISLE-${aisle}`,
        travelTimeMultiplier: 1.0,
        equipmentRestrictions: [],
        isAccessible: true,
      });

      // Connect to previous bay in same aisle
      if (bay > 0) {
        const prevNodeId = `A${aisle.toString().padStart(2, "0")}-B${(bay - 1).toString().padStart(2, "0")}`;
        edges.push({
          id: `edge-${prevNodeId}-${nodeId}`,
          fromNodeId: prevNodeId,
          toNodeId: nodeId,
          distance: bayWidth,
          direction: "BOTH",
          travelTime: bayWidth / DEFAULT_EQUIPMENT_SPEEDS.WALKING,
          equipmentAllowed: [
            "WALKING",
            "PALLET_JACK",
            "ORDER_PICKER",
            "FORKLIFT",
            "REACH_TRUCK",
            "TURRET_TRUCK",
            "AGV",
            "AMR",
            "CONVEYOR",
          ],
          congestionFactor: 1.0,
        });
      }
    }
  }

  // Add cross-aisle connections at every 5th bay
  for (let bay = 0; bay <= baysPerAisle; bay += 5) {
    for (let aisle = 0; aisle < aisleCount - 1; aisle++) {
      const fromNodeId = `A${aisle.toString().padStart(2, "0")}-B${bay.toString().padStart(2, "0")}`;
      const toNodeId = `A${(aisle + 1).toString().padStart(2, "0")}-B${bay.toString().padStart(2, "0")}`;
      edges.push({
        id: `cross-${fromNodeId}-${toNodeId}`,
        fromNodeId,
        toNodeId,
        distance: aisleSpacing,
        direction: "BOTH",
        travelTime: aisleSpacing / DEFAULT_EQUIPMENT_SPEEDS.WALKING,
        equipmentAllowed: [
          "WALKING",
          "PALLET_JACK",
          "ORDER_PICKER",
          "FORKLIFT",
          "REACH_TRUCK",
          "TURRET_TRUCK",
          "AGV",
          "AMR",
          "CONVEYOR",
        ],
        congestionFactor: 1.0,
      });
    }
  }

  return {
    id: "mock-warehouse",
    warehouseId: "WH-001",
    name: "Mock Warehouse Layout",
    version: "1.0.0",
    lastUpdated: new Date().toISOString(),
    dimensions: {
      length: aisleCount * aisleSpacing,
      width: baysPerAisle * bayWidth,
      height: 10,
      floors: 1,
      totalArea: aisleCount * aisleSpacing * baysPerAisle * bayWidth,
      usableArea: aisleCount * aisleSpacing * baysPerAisle * bayWidth * 0.85,
    },
    aisles: Array.from({ length: aisleCount }, (_, i) => ({
      id: `AISLE-${i}`,
      name: `Aisle ${i + 1}`,
      startPoint: { x: i * aisleSpacing, y: 0 },
      endPoint: { x: i * aisleSpacing, y: baysPerAisle * bayWidth },
      width: 3.0,
      direction: "VERTICAL" as const,
      travelDirection: "BIDIRECTIONAL" as const,
      maxHeight: 8,
      floorLoadCapacity: 5000,
      accessible: true,
      congestionFactor: 1.0,
    })),
    crossAisles: [],
    zones: [
      {
        id: "ZONE-PICKING",
        name: "Picking Zone",
        type: "PICKING",
        boundaries: [
          { x: 0, y: 0 },
          { x: aisleCount * aisleSpacing, y: 0 },
          { x: aisleCount * aisleSpacing, y: baysPerAisle * bayWidth },
          { x: 0, y: baysPerAisle * bayWidth },
        ],
        boundingBox: {
          minX: 0,
          maxX: aisleCount * aisleSpacing,
          minY: 0,
          maxY: baysPerAisle * bayWidth,
        },
        floor: 0,
        restrictions: [],
        requiredPPE: ["Safety Vest"],
        equipmentAllowed: [
          "WALKING",
          "PALLET_JACK",
          "ORDER_PICKER",
          "FORKLIFT",
          "REACH_TRUCK",
          "TURRET_TRUCK",
          "AGV",
          "AMR",
          "CONVEYOR",
        ],
        accessLevel: "PUBLIC",
      },
    ],
    obstacles: [],
    accessPoints: [
      {
        id: "ENTRY-1",
        name: "Main Entry",
        type: "BOTH",
        position: { x: 0, y: 0 },
        floor: 0,
        forEquipment: [
          "WALKING",
          "PALLET_JACK",
          "ORDER_PICKER",
          "FORKLIFT",
          "REACH_TRUCK",
          "TURRET_TRUCK",
          "AGV",
          "AMR",
          "CONVEYOR",
        ],
      },
    ],
    navigationGraph: {
      nodes,
      edges,
    },
    equipmentSpeeds: DEFAULT_EQUIPMENT_SPEEDS,
    defaultStartPoint: { x: 0, y: 0, z: 0 },
    defaultEndPoint: { x: 0, y: 0, z: 0 },
    createdBy: "system",
    createdAt: new Date().toISOString(),
    status: "ACTIVE",
  };
}

/**
 * Enhanced route optimizer using A* pathfinding
 */
export function optimizePickingRoute(
  locations: PickLocation[],
  startLocation: PickLocation,
  layout: WarehouseLayout,
  options: {
    algorithm?: "NEAREST_NEIGHBOR" | "GENETIC" | "A_STAR";
    equipmentType?: EquipmentType;
    maxIterations?: number;
  } = {},
): RouteOptimizationResult {
  if (locations.length === 0) {
    return {
      algorithm: "A_STAR",
      optimizedOrder: [],
      pathSegments: [],
      totalWalkingDistance: 0,
      totalTime: 0,
      totalTurns: 0,
      efficiency: 100,
      comparisonWithEuclidean: 0,
      carbonFootprint: 0,
      energyConsumed: 0,
      confidence: 1.0,
    };
  }

  const calculator = new WarehouseRouteCalculator(layout);
  const equipmentType = options.equipmentType || "WALKING";

  // Build distance matrix using A* pathfinding
  const distanceMatrix: number[][] = [];
  const pathCache = new Map<string, PathResult>();
  const allLocations = [startLocation, ...locations];

  // Calculate all pairwise paths
  for (let i = 0; i < allLocations.length; i++) {
    distanceMatrix[i] = [];
    for (let j = 0; j < allLocations.length; j++) {
      if (i === j) {
        distanceMatrix[i][j] = 0;
      } else {
        const path = calculator.findPath(allLocations[i], allLocations[j], {
          equipmentType,
        });
        distanceMatrix[i][j] = path.totalDistance;
        pathCache.set(`${i}-${j}`, path);
      }
    }
  }

  // Use nearest neighbor for now (can be extended to genetic algorithm)
  const optimizedIndices = nearestNeighborTSP(distanceMatrix);

  // Build result
  const optimizedOrder = optimizedIndices
    .slice(1)
    .map((i) => allLocations[i].id);
  const pathSegments: PathResult[] = [];
  let totalDistance = 0;
  let totalTime = 0;
  let totalTurns = 0;

  for (let i = 0; i < optimizedIndices.length - 1; i++) {
    const fromIdx = optimizedIndices[i];
    const toIdx = optimizedIndices[i + 1];
    const path =
      pathCache.get(`${fromIdx}-${toIdx}`) ||
      calculator.findPath(allLocations[fromIdx], allLocations[toIdx], {
        equipmentType,
      });

    pathSegments.push(path);
    totalDistance += path.totalDistance;
    totalTime += path.estimatedTime;
    totalTurns += path.turnCount;
  }

  // Calculate Euclidean comparison
  let euclideanTotal = 0;
  for (let i = 0; i < optimizedIndices.length - 1; i++) {
    const fromLoc = allLocations[optimizedIndices[i]];
    const toLoc = allLocations[optimizedIndices[i + 1]];
    euclideanTotal += euclideanDistance(
      {
        x: fromLoc.coordinates.x,
        y: fromLoc.coordinates.y,
        z: fromLoc.coordinates.z,
      },
      {
        x: toLoc.coordinates.x,
        y: toLoc.coordinates.y,
        z: toLoc.coordinates.z,
      },
    );
  }

  const comparisonWithEuclidean =
    euclideanTotal > 0
      ? ((totalDistance - euclideanTotal) / euclideanTotal) * 100
      : 0;

  // Calculate environmental impact
  const energyConsumed = (totalDistance / 1000) * 0.1; // kWh per km
  const carbonFootprint = (totalDistance / 1000) * 0.21; // kg CO2 per km

  // Calculate efficiency (random order comparison)
  const randomTotal = distanceMatrix[0].slice(1).reduce((sum, d) => sum + d, 0);
  const efficiency =
    randomTotal > 0 ? ((randomTotal - totalDistance) / randomTotal) * 100 : 0;

  return {
    algorithm: "A_STAR",
    optimizedOrder,
    pathSegments,
    totalWalkingDistance: totalDistance,
    totalTime,
    totalTurns,
    efficiency: Math.max(0, efficiency),
    comparisonWithEuclidean,
    carbonFootprint,
    energyConsumed,
    confidence: pathSegments.some((p) => p.warnings.length > 0) ? 0.7 : 0.95,
  };
}

/**
 * Nearest Neighbor TSP solver
 */
function nearestNeighborTSP(distanceMatrix: number[][]): number[] {
  const n = distanceMatrix.length;
  if (n === 0) return [];
  if (n === 1) return [0];

  const visited = new Set<number>([0]);
  const route = [0];
  let current = 0;

  while (visited.size < n) {
    let nearestIdx = -1;
    let nearestDist = Infinity;

    for (let i = 0; i < n; i++) {
      if (!visited.has(i) && distanceMatrix[current][i] < nearestDist) {
        nearestDist = distanceMatrix[current][i];
        nearestIdx = i;
      }
    }

    if (nearestIdx !== -1) {
      visited.add(nearestIdx);
      route.push(nearestIdx);
      current = nearestIdx;
    } else {
      break;
    }
  }

  return route;
}
