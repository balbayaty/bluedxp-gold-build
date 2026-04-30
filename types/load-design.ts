/**
 * Advanced Load Design Types
 * Comprehensive type definitions for advanced load design capabilities
 * 4IR & 5IR Aligned - Multimodal, Compliance-Integrated, AI-Powered
 */

// ============================================================================
// LOAD DESIGN CORE TYPES
// ============================================================================

export type LoadDesignMode = 
  | 'STANDALONE'        // Standalone load planning
  | 'MULTIMODAL'        // Multimodal transportation
  | 'CONSOLIDATION'      // Load consolidation
  | 'OPTIMIZATION'      // AI-powered optimization

export type TransportMode = 
  | 'AIR'
  | 'SEA'
  | 'LAND'
  | 'RAIL'
  | 'MULTIMODAL'
  | 'EXPRESS'
  | 'COURIER'

export type ContainerType = 
  | '20FT_STANDARD'
  | '40FT_STANDARD'
  | '40FT_HIGH_CUBE'
  | '45FT_HIGH_CUBE'
  | '20FT_REEFER'
  | '40FT_REEFER'
  | '20FT_OPEN_TOP'
  | '40FT_OPEN_TOP'
  | '20FT_FLAT_RACK'
  | '40FT_FLAT_RACK'
  | 'TANK_CONTAINER'
  | 'BULK_CONTAINER'

export type AirCargoULDType = 
  | 'PALLET_88X108'      // Standard pallet
  | 'PALLET_96X125'      // Wide pallet
  | 'PALLET_96X238'      // Long pallet
  | 'CONTAINER_LD1'      // Lower deck container
  | 'CONTAINER_LD3'      // Lower deck container
  | 'CONTAINER_LD7'      // Lower deck container
  | 'CONTAINER_LD9'      // Lower deck container
  | 'CONTAINER_M1'       // Main deck container
  | 'CONTAINER_M2'       // Main deck container

export type RailCarType = 
  | 'BOX_CAR'
  | 'FLAT_CAR'
  | 'HOPPER_CAR'
  | 'TANK_CAR'
  | 'REEFER_CAR'
  | 'AUTO_RACK'
  | 'GONDOLA'

export type VehicleType = 
  | 'TRUCK'
  | 'VAN'
  | 'LARGE_TRUCK'
  | 'FLATBED'
  | 'REEFER'
  | 'TANKER'
  | 'LOWBOY'
  | 'DOUBLE_TRAILER'
  | 'CONTAINER_CHASSIS'

export type LoadItemType = 
  | 'PALLET'
  | 'CARTON'
  | 'DRUM'
  | 'BULK'
  | 'MACHINERY'
  | 'VEHICLE'
  | 'CONTAINER'
  | 'CUSTOM'

export type ComplianceStatus = 
  | 'COMPLIANT'
  | 'NON_COMPLIANT'
  | 'PENDING_VALIDATION'
  | 'REQUIRES_REVIEW'
  | 'EXEMPT'

export type OptimizationStrategy = 
  | 'MAXIMIZE_UTILIZATION'
  | 'MINIMIZE_COST'
  | 'MINIMIZE_TIME'
  | 'BALANCED'
  | 'COMPLIANCE_FIRST'
  | 'CUSTOM'

// ============================================================================
// LOAD ITEM
// ============================================================================

export interface LoadItem {
  id: string
  sku?: string
  description: string
  type: LoadItemType
  
  // Physical Properties
  dimensions: {
    length: number  // cm
    width: number   // cm
    height: number  // cm
  }
  weight: number    // kg
  volume: number    // m³
  quantity: number
  
  // Constraints
  canRotate?: boolean
  canStack?: boolean
  maxStackHeight?: number
  fragile?: boolean
  requiresTemperatureControl?: boolean
  minTemperature?: number  // Celsius
  maxTemperature?: number  // Celsius
  
  // Hazardous Material
  isHazmat?: boolean
  unNumber?: string
  hazardClass?: string
  packingGroup?: string
  segregationGroup?: string
  
  // Location
  origin?: {
    address: string
    city: string
    country: string
    coordinates?: { lat: number; lng: number }
  }
  destination: {
    address: string
    city: string
    country: string
    coordinates?: { lat: number; lng: number }
  }
  
  // Priority & Dates
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  requiredDeliveryDate?: Date | string
  pickupDate?: Date | string
  
  // Compliance
  hsCode?: string
  countryOfOrigin?: string
  customsValue?: number
  requiresCustomsDocumentation?: boolean
  
  // Special Requirements
  specialHandling?: string[]
  specialInstructions?: string
  
  // Metadata
  metadata?: Record<string, any>
}

// ============================================================================
// VEHICLE/CONTAINER SPECIFICATIONS
// ============================================================================

export interface VehicleSpecification {
  id: string
  type: VehicleType | ContainerType | AirCargoULDType | RailCarType
  name: string
  description?: string
  
  // Dimensions (internal)
  dimensions: {
    length: number  // cm
    width: number   // cm
    height: number  // cm
  }
  
  // Capacity
  maxWeight: number      // kg
  maxVolume: number      // m³
  tareWeight?: number    // kg (empty weight)
  
  // Constraints
  maxAxleWeight?: number  // kg
  maxGrossWeight?: number // kg (including vehicle)
  maxStackHeight?: number // cm
  
  // Special Features
  hasTemperatureControl?: boolean
  temperatureRange?: {
    min: number  // Celsius
    max: number  // Celsius
  }
  hasVentilation?: boolean
  hasRefrigeration?: boolean
  
  // Compliance
  compliantCountries?: string[]
  requiresSpecialLicense?: boolean
  requiresPermits?: string[]
  
  // Cost
  baseCost?: number
  costPerKm?: number
  costPerHour?: number
  currency?: string
  
  // Metadata
  metadata?: Record<string, any>
}

// ============================================================================
// LOAD PLAN
// ============================================================================

export interface LoadPlan {
  id: string
  loadNumber: string
  planType: 'SINGLE' | 'MULTIMODAL' | 'CONSOLIDATED'
  
  // Vehicle/Container
  vehicleSpec: VehicleSpecification
  vehicleId?: string
  vehicleNumber?: string
  
  // Items
  items: LoadItem[]
  itemPlacements: ItemPlacement[]
  
  // Utilization
  utilization: {
    weightPercent: number
    volumePercent: number
    cubePercent: number
    spaceEfficiency: number  // 0-100
  }
  
  // Route
  route?: {
    origin: {
      address: string
      city: string
      country: string
      coordinates?: { lat: number; lng: number }
    }
    destination: {
      address: string
      city: string
      country: string
      coordinates?: { lat: number; lng: number }
    }
    waypoints?: Array<{
      address: string
      city: string
      coordinates?: { lat: number; lng: number }
    }>
    totalDistance?: number  // km
    estimatedTime?: number  // minutes
    optimized: boolean
  }
  
  // Cost
  cost?: {
    base: number
    fuel: number
    labor: number
    tolls?: number
    permits?: number
    total: number
    currency: string
  }
  
  // Compliance
  compliance: {
    status: ComplianceStatus
    checks: ComplianceCheck[]
    warnings: ComplianceWarning[]
    errors: ComplianceError[]
    validatedBy?: string
    validatedAt?: Date | string
  }
  
  // Optimization
  optimization?: {
    strategy: OptimizationStrategy
    score: number  // 0-100
    improvements?: string[]
    aiRecommendations?: string[]
  }
  
  // Status
  status: 'DRAFT' | 'PLANNED' | 'LOADING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
  
  // Dates
  plannedDate?: Date | string
  loadingDate?: Date | string
  estimatedDelivery?: Date | string
  actualDelivery?: Date | string
  
  // Metadata
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
  updatedBy?: string
  
  // Integration
  integrationSource?: string
  externalId?: string
}

// ============================================================================
// ITEM PLACEMENT (3D Positioning)
// ============================================================================

export interface ItemPlacement {
  itemId: string
  position: {
    x: number  // cm from front-left-bottom corner
    y: number  // cm from front-left-bottom corner
    z: number  // cm from front-left-bottom corner
  }
  rotation?: {
    x: number  // degrees
    y: number  // degrees
    z: number  // degrees
  }
  dimensions: {
    length: number
    width: number
    height: number
  }
  weight: number
  stackLevel?: number
  isRotated?: boolean
}

// ============================================================================
// COMPLIANCE
// ============================================================================

export interface ComplianceCheck {
  id: string
  category: 'WEIGHT' | 'DIMENSIONS' | 'HAZMAT' | 'CUSTOMS' | 'TRANSPORT' | 'REGULATORY'
  authority?: string  // e.g., 'MOT', 'TGA', 'CUSTOMS'
  country?: string
  checkType: 'AUTOMATED' | 'MANUAL' | 'REQUIRED_DOCUMENT'
  status: 'PASS' | 'FAIL' | 'WARNING' | 'PENDING'
  message: string
  requirement?: string
  validatedAt?: Date | string
  validatedBy?: string
}

export interface ComplianceWarning {
  id: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  category: string
  message: string
  recommendation?: string
  relatedCheckId?: string
}

export interface ComplianceError {
  id: string
  category: string
  message: string
  blocking: boolean
  resolution?: string
  relatedCheckId?: string
}

// ============================================================================
// MULTIMODAL LOAD PLAN
// ============================================================================

export interface MultimodalLoadPlan {
  id: string
  loadNumber: string
  
  // Journey
  origin: {
    address: string
    city: string
    country: string
    coordinates?: { lat: number; lng: number }
  }
  destination: {
    address: string
    city: string
    country: string
    coordinates?: { lat: number; lng: number }
  }
  
  // Legs
  legs: MultimodalLeg[]
  
  // Items (distributed across legs)
  items: LoadItem[]
  
  // Overall Metrics
  totalTransitTime: number  // hours
  totalCost: number
  currency: string
  
  // Compliance
  compliance: {
    status: ComplianceStatus
    checks: ComplianceCheck[]
    warnings: ComplianceWarning[]
    errors: ComplianceError[]
  }
  
  // Status
  status: 'DRAFT' | 'PLANNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
  
  // Dates
  plannedDate?: Date | string
  estimatedDelivery?: Date | string
  actualDelivery?: Date | string
}

export interface MultimodalLeg {
  id: string
  sequence: number
  mode: TransportMode
  origin: {
    address: string
    city: string
    country: string
    coordinates?: { lat: number; lng: number }
  }
  destination: {
    address: string
    city: string
    country: string
    coordinates?: { lat: number; lng: number }
  }
  
  // Vehicle/Container
  vehicleSpec: VehicleSpecification
  vehicleId?: string
  
  // Items for this leg
  itemIds: string[]
  itemPlacements: ItemPlacement[]
  
  // Carrier
  carrierId?: string
  carrierName?: string
  bookingNumber?: string
  
  // Route
  distance?: number  // km
  estimatedDuration?: number  // hours
  actualDuration?: number  // hours
  
  // Cost
  cost?: {
    base: number
    fuel?: number
    labor?: number
    total: number
    currency: string
  }
  
  // Compliance
  compliance: {
    status: ComplianceStatus
    checks: ComplianceCheck[]
  }
  
  // Status
  status: 'PLANNED' | 'IN_TRANSIT' | 'COMPLETED' | 'DELAYED'
  
  // Dates
  plannedDate?: Date | string
  estimatedArrival?: Date | string
  actualArrival?: Date | string
}

// ============================================================================
// OPTIMIZATION REQUEST & RESULT
// ============================================================================

export interface LoadOptimizationRequest {
  items: LoadItem[]
  constraints?: {
    vehicleTypes?: (VehicleType | ContainerType | AirCargoULDType | RailCarType)[]
    maxVehicles?: number
    maxCost?: number
    maxTime?: number  // hours
    requiredDeliveryDate?: Date | string
    preferredModes?: TransportMode[]
  }
  strategy: OptimizationStrategy
  complianceRequired?: boolean
  multimodal?: boolean
  useAI?: boolean
}

export interface LoadOptimizationResult {
  loadPlans: LoadPlan[]
  multimodalPlan?: MultimodalLoadPlan
  optimization: {
    strategy: OptimizationStrategy
    score: number  // 0-100
    totalCost: number
    totalTime: number  // hours
    totalUtilization: number  // average
    improvements: string[]
    aiRecommendations?: string[]
    mlPredictions?: {
      predictedUtilization: {
        weightPercent: number
        volumePercent: number
        spaceEfficiency: number
      }
      predictedCost: number
      predictedTransitTime: number
      confidence: number
      factors: Array<{
        name: string
        impact: number
        description: string
      }>
    }
    optimizationRecommendations?: Array<{
      type: 'VEHICLE_SELECTION' | 'ITEM_ARRANGEMENT' | 'ROUTE_OPTIMIZATION' | 'CONSOLIDATION' | 'SPLIT_LOAD'
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      title: string
      description: string
      expectedImprovement: {
        utilization?: number
        costReduction?: number
        timeReduction?: number
      }
      confidence: number
    }>
  }
  compliance: {
    status: ComplianceStatus
    summary: string
    warnings: number
    errors: number
  }
  alternatives?: LoadPlan[]  // Alternative plans
}

// ============================================================================
// KNOWLEDGE BASE INTEGRATION
// ============================================================================

export interface LoadDesignKnowledge {
  id: string
  category: 'BEST_PRACTICE' | 'REGULATION' | 'STANDARD' | 'PATTERN' | 'CASE_STUDY'
  title: string
  description: string
  content: string
  applicableTo?: {
    countries?: string[]
    industries?: string[]
    itemTypes?: LoadItemType[]
    vehicleTypes?: string[]
  }
  source: string
  confidence: number  // 0-100
  lastUpdated: Date | string
  metadata?: Record<string, any>
}

// ============================================================================
// REGULATORY FRAMEWORK
// ============================================================================

export interface LoadRegulation {
  id: string
  authority: string  // e.g., 'MOT', 'TGA', 'CUSTOMS'
  country: string
  region?: string
  
  // Regulation Details
  title: string
  description: string
  category: 'WEIGHT' | 'DIMENSIONS' | 'HAZMAT' | 'DOCUMENTATION' | 'LICENSING' | 'ROUTE'
  
  // Requirements
  requirements: {
    maxWeight?: number  // kg
    maxDimensions?: {
      length?: number  // cm
      width?: number   // cm
      height?: number  // cm
    }
    maxAxleWeight?: number  // kg
    requiresPermit?: boolean
    requiresLicense?: boolean
    requiresDocumentation?: string[]
    restrictedRoutes?: string[]
    restrictedTimes?: string[]
  }
  
  // Applicability
  applicableTo?: {
    vehicleTypes?: string[]
    itemTypes?: LoadItemType[]
    routes?: string[]
    countries?: string[]
  }
  
  // Validity
  effectiveDate: Date | string
  expiryDate?: Date | string
  
  // Enforcement
  enforcement: {
    penalty?: {
      amount: number
      currency: string
      description: string
    }
    blocking: boolean
  }
  
  // Metadata
  source: string
  lastUpdated: Date | string
}

