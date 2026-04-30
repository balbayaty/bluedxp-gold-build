/**
 * Warehouse Layout Types
 * Comprehensive type definitions for warehouse physical layout,
 * navigation, and route calculation
 */

/**
 * Aisle travel direction
 */
export type AisleTravelDirection = 
  | 'BIDIRECTIONAL'
  | 'NORTH_ONLY'
  | 'SOUTH_ONLY'
  | 'EAST_ONLY'
  | 'WEST_ONLY'

/**
 * Zone types for warehouse areas
 */
export type ZoneType = 
  | 'PICKING'
  | 'BULK_STORAGE'
  | 'COLD_STORAGE'
  | 'FROZEN'
  | 'HAZMAT'
  | 'HIGH_VALUE'
  | 'RETURNS'
  | 'STAGING'
  | 'RECEIVING_DOCK'
  | 'SHIPPING_DOCK'
  | 'CROSS_DOCK'
  | 'QUALITY_CONTROL'
  | 'PACKING'
  | 'KITTING'
  | 'VAS'  // Value Added Services

/**
 * Equipment types that can traverse the warehouse
 */
export type EquipmentType = 
  | 'WALKING'
  | 'PALLET_JACK'
  | 'FORKLIFT'
  | 'ORDER_PICKER'
  | 'REACH_TRUCK'
  | 'TURRET_TRUCK'
  | 'AGV'           // Automated Guided Vehicle
  | 'AMR'           // Autonomous Mobile Robot
  | 'CONVEYOR'

/**
 * Node types in the navigation graph
 */
export type NavigationNodeType = 
  | 'INTERSECTION'
  | 'LOCATION'
  | 'ENTRY'
  | 'EXIT'
  | 'JUNCTION'
  | 'ELEVATOR'
  | 'STAGING'
  | 'DOCK_DOOR'

/**
 * 2D Point coordinate
 */
export interface Point2D {
  x: number
  y: number
}

/**
 * 3D Point coordinate
 */
export interface Point3D {
  x: number
  y: number
  z: number
}

/**
 * Bounding box for zones
 */
export interface BoundingBox {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * Aisle definition
 */
export interface Aisle {
  id: string
  name: string
  startPoint: Point2D
  endPoint: Point2D
  width: number              // meters
  direction: 'HORIZONTAL' | 'VERTICAL'
  travelDirection: AisleTravelDirection
  maxHeight: number          // meters - equipment clearance
  floorLoadCapacity: number  // kg per sqm
  accessible: boolean
  equipmentRestrictions?: EquipmentType[]  // Equipment NOT allowed
  speedLimit?: number        // m/s max travel speed
  congestionFactor: number   // 1.0 = normal, >1 = typically congested
}

/**
 * Cross-aisle connection
 */
export interface CrossAisle {
  id: string
  connectsAisles: [string, string]
  connectionPoint: Point2D
  width: number
  bidirectional: boolean
}

/**
 * Warehouse zone definition
 */
export interface Zone {
  id: string
  name: string
  type: ZoneType
  boundaries: Point2D[]      // Polygon vertices
  boundingBox: BoundingBox
  floor: number              // Floor level (0 = ground)
  restrictions: string[]
  requiredPPE: string[]
  temperatureRange?: {
    min: number
    max: number
    unit: 'CELSIUS' | 'FAHRENHEIT'
  }
  humidityRange?: {
    min: number
    max: number
  }
  equipmentAllowed: EquipmentType[]
  speedLimit?: number        // m/s
  accessLevel: 'PUBLIC' | 'RESTRICTED' | 'SECURED' | 'HAZMAT_CERTIFIED'
}

/**
 * Obstacle in the warehouse
 */
export interface Obstacle {
  id: string
  name: string
  type: 'PILLAR' | 'WALL' | 'EQUIPMENT' | 'TEMPORARY' | 'SAFETY_ZONE'
  boundaries: Point2D[]
  permanent: boolean
  height?: number
}

/**
 * Entry/Exit point
 */
export interface AccessPoint {
  id: string
  name: string
  type: 'ENTRY' | 'EXIT' | 'BOTH'
  position: Point2D
  floor: number
  forEquipment: EquipmentType[]
  dockDoorNumber?: string
  operatingHours?: {
    open: string   // HH:MM
    close: string  // HH:MM
  }
}

/**
 * Navigation node for pathfinding
 */
export interface NavigationNode {
  id: string
  position: Point3D
  type: NavigationNodeType
  connectedNodes: string[]
  aisleId?: string
  zoneId?: string
  travelTimeMultiplier: number  // 1.0 = normal, >1 = slower
  equipmentRestrictions: EquipmentType[]
  isAccessible: boolean
}

/**
 * Edge in the navigation graph
 */
export interface NavigationEdge {
  id: string
  fromNodeId: string
  toNodeId: string
  distance: number           // meters
  direction: 'FORWARD' | 'BACKWARD' | 'BOTH'
  travelTime: number         // seconds at normal speed
  equipmentAllowed: EquipmentType[]
  congestionFactor: number
}

/**
 * Complete warehouse layout
 */
export interface WarehouseLayout {
  id: string
  warehouseId: string
  name: string
  version: string
  lastUpdated: string
  
  // Physical dimensions
  dimensions: {
    length: number   // meters
    width: number    // meters
    height: number   // meters
    floors: number
    totalArea: number  // sqm
    usableArea: number // sqm (excluding obstacles)
  }
  
  // Layout elements
  aisles: Aisle[]
  crossAisles: CrossAisle[]
  zones: Zone[]
  obstacles: Obstacle[]
  accessPoints: AccessPoint[]
  
  // Navigation data
  navigationGraph: {
    nodes: NavigationNode[]
    edges: NavigationEdge[]
  }
  
  // Equipment configuration
  equipmentSpeeds: Record<EquipmentType, number>  // m/s
  
  // Default settings
  defaultStartPoint: Point3D
  defaultEndPoint: Point3D
  
  // Metadata
  createdBy: string
  createdAt: string
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
}

/**
 * Path result from route calculation
 */
export interface PathResult {
  path: Point3D[]
  totalDistance: number      // meters
  estimatedTime: number      // seconds
  turnCount: number
  zonesTraversed: string[]
  aislesUsed: string[]
  requiresEquipment: EquipmentType[]
  warnings: string[]
}

/**
 * Route optimization result
 */
export interface RouteOptimizationResult {
  algorithm: 'NEAREST_NEIGHBOR' | 'GENETIC' | 'ANT_COLONY' | 'A_STAR' | 'HYBRID'
  optimizedOrder: string[]   // Location IDs in optimized order
  pathSegments: PathResult[]
  totalWalkingDistance: number
  totalTime: number
  totalTurns: number
  efficiency: number         // % improvement over random
  comparisonWithEuclidean: number  // % difference from straight-line
  carbonFootprint: number    // kg CO2
  energyConsumed: number     // kWh
  confidence: number         // 0-1
}

/**
 * Travel speed configuration
 */
export const DEFAULT_EQUIPMENT_SPEEDS: Record<EquipmentType, number> = {
  WALKING: 1.2,           // m/s - average walking speed
  PALLET_JACK: 1.8,       // m/s
  FORKLIFT: 2.5,          // m/s
  ORDER_PICKER: 1.5,      // m/s
  REACH_TRUCK: 2.0,       // m/s
  TURRET_TRUCK: 1.5,      // m/s
  AGV: 1.0,               // m/s - slower for safety
  AMR: 1.5,               // m/s
  CONVEYOR: 0.5           // m/s - fixed speed
}

/**
 * Turn time penalties (seconds)
 */
export const TURN_TIME_PENALTIES = {
  WALKING: 0.5,
  PALLET_JACK: 2.0,
  FORKLIFT: 3.0,
  ORDER_PICKER: 2.0,
  REACH_TRUCK: 2.5,
  TURRET_TRUCK: 4.0,
  AGV: 1.5,
  AMR: 1.0,
  CONVEYOR: 0
}

/**
 * Check if a point is inside a polygon (zone)
 */
export function isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y
    
    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside
}

/**
 * Calculate Euclidean distance between two points
 */
export function euclideanDistance(a: Point2D | Point3D, b: Point2D | Point3D): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const dz = ('z' in a && 'z' in b) ? (b.z - a.z) : 0
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * Calculate Manhattan distance between two points
 */
export function manhattanDistance(a: Point2D, b: Point2D): number {
  return Math.abs(b.x - a.x) + Math.abs(b.y - a.y)
}

