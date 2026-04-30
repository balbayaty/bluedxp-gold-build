/**
 * Transport Platform & Aggregator Adapter Interface
 * 
 * Unified interface for integrating with:
 * - Transport platforms (UberFreight, Convoy, etc.)
 * - Freight aggregators (Freightos, Flexport, etc.)
 * - TMS platforms (Project44, FourKites, etc.)
 * - Marketplaces (Loadsmart, uShip, etc.)
 * 
 * 4IR & 5IR Aligned - API-First Integration Architecture
 */

import type { Location, Shipment, Quote, Booking, TrackingEvent, TransportMode } from '@/types/tms'
import type { IntelligentRoutePlan } from '@/lib/services/transportation/intelligentRoutePlanningService'
import type { EnhancedTransitTimeCalculation } from '@/lib/services/transportation/enhancedTransitTimeCalculator'

// ============================================================================
// TYPES
// ============================================================================

export type TransportPlatformType =
  | 'UBERFREIGHT'
  | 'CONVOY'
  | 'FREIGHTOS'
  | 'FLEXPORT'
  | 'PROJECT44'
  | 'FOURKITES'
  | 'LOADSMART'
  | 'USHIP'
  | 'CARGOWISE'
  | 'KUEHNE_NAGEL'
  | 'DHL_GLOBAL'
  | 'FEDEX_LOGISTICS'
  | 'CUSTOM'

export interface TransportPlatformAdapter {
  // Identification
  readonly id: string
  readonly name: string
  readonly type: TransportPlatformType
  readonly version: string
  
  // Connection
  isConnected(): Promise<boolean>
  testConnection(): Promise<{ success: boolean; message: string }>
  connect(config: PlatformConfig): Promise<void>
  disconnect(): Promise<void>
  
  // Route Planning & Intelligence
  planRoute?(request: PlatformRouteRequest): Promise<IntelligentRoutePlan>
  calculateTransitTime?(request: PlatformTransitTimeRequest): Promise<EnhancedTransitTimeCalculation>
  getRouteConstraints?(origin: Location, destination: Location): Promise<RouteConstraint[]>
  
  // Quotes & Pricing
  getQuote(request: PlatformQuoteRequest): Promise<PlatformQuote>
  getQuotes(requests: PlatformQuoteRequest[]): Promise<PlatformQuote[]>
  getMarketRates?(request: PlatformMarketRateRequest): Promise<PlatformMarketRate[]>
  
  // Booking & Shipments
  createBooking(request: PlatformBookingRequest): Promise<PlatformBooking>
  updateBooking(bookingId: string, updates: Partial<PlatformBooking>): Promise<PlatformBooking>
  cancelBooking(bookingId: string, reason?: string): Promise<void>
  
  // Tracking & Visibility
  trackShipment(trackingNumber: string): Promise<TrackingEvent[]>
  getRealTimeLocation?(trackingNumber: string): Promise<RealTimeLocation>
  getShipmentStatus?(shipmentId: string): Promise<ShipmentStatus>
  
  // Capacity & Availability
  checkCapacity?(request: PlatformCapacityRequest): Promise<PlatformCapacity>
  searchAvailableCarriers?(request: PlatformCarrierSearchRequest): Promise<PlatformCarrier[]>
  
  // Documents & Compliance
  uploadDocument?(shipmentId: string, document: PlatformDocument): Promise<PlatformDocument>
  getRequiredDocuments?(request: PlatformDocumentRequest): Promise<RequiredDocument[]>
  validateCompliance?(shipmentId: string): Promise<ComplianceValidation>
  
  // Analytics & Reporting
  getAnalytics?(request: PlatformAnalyticsRequest): Promise<PlatformAnalytics>
  getPerformanceMetrics?(request: PlatformMetricsRequest): Promise<PlatformMetrics>
  
  // Webhooks & Events
  subscribeToEvents?(events: string[], webhookUrl: string): Promise<WebhookSubscription>
  unsubscribeFromEvents?(subscriptionId: string): Promise<void>
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface PlatformConfig {
  apiKey: string
  apiSecret?: string
  apiUrl: string
  organizationId?: string
  environment?: 'PRODUCTION' | 'SANDBOX' | 'STAGING'
  webhookUrl?: string
  [key: string]: any
}

export interface PlatformRouteRequest {
  origin: Location
  destination: Location
  waypoints?: Location[]
  mode: TransportMode
  cargo: {
    weight: number
    volume: number
    type?: string
    hazmat?: boolean
    temperatureControlled?: boolean
  }
  preferences?: {
    avoidTruckBans?: boolean
    prioritizeFastest?: boolean
    minimizeCost?: boolean
  }
  compliancePrograms?: string[]
}

export interface PlatformTransitTimeRequest {
  origin: Location
  destination: Location
  mode: TransportMode
  departureTime?: Date
  cargo?: {
    weight?: number
    volume?: number
  }
  compliancePrograms?: string[]
}

export interface RouteConstraint {
  id: string
  type: string
  description: string
  location: {
    coordinates: { lat: number; lng: number }
    radius?: number
  }
  impact: {
    additionalHours: number
    delayProbability: number
  }
}

export interface PlatformQuoteRequest {
  origin: Location
  destination: Location
  mode: TransportMode
  cargo: {
    weight: number
    volume: number
    value?: number
    type?: string
  }
  pickupDate?: Date
  deliveryDate?: Date
  specialRequirements?: {
    temperatureControl?: boolean
    hazmat?: boolean
    insurance?: boolean
  }
}

export interface PlatformQuote {
  id: string
  quoteNumber: string
  carrierId?: string
  carrierName?: string
  mode: TransportMode
  pricing: {
    baseRate: number
    fuelSurcharge?: number
    accessorialCharges?: number
    totalCost: number
    currency: string
  }
  transitTime: {
    estimated: number
    min?: number
    max?: number
  }
  validFrom: Date
  validTo: Date
  terms?: string
}

export interface PlatformMarketRateRequest {
  origin: Location
  destination: Location
  mode: TransportMode
  cargoType?: string
  dateRange?: { from: Date; to: Date }
}

export interface PlatformMarketRate {
  rate: number
  currency: string
  mode: TransportMode
  lane: string
  trend: 'UP' | 'DOWN' | 'STABLE'
  change?: number
  lastUpdated: Date
}

export interface PlatformBookingRequest {
  quoteId: string
  shipmentDetails: {
    referenceNumber?: string
    specialInstructions?: string
    pickupWindow?: { start: Date; end: Date }
    deliveryWindow?: { start: Date; end: Date }
  }
  shipper: {
    name: string
    contact: {
      phone: string
      email: string
    }
    address: Location
  }
  consignee: {
    name: string
    contact: {
      phone: string
      email: string
    }
    address: Location
  }
}

export interface PlatformBooking {
  id: string
  bookingNumber: string
  quoteId: string
  status: 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
  carrierId: string
  carrierName: string
  trackingNumber?: string
  pickupDate?: Date
  deliveryDate?: Date
  documents?: PlatformDocument[]
  createdAt: Date
}

export interface RealTimeLocation {
  coordinates: { lat: number; lng: number }
  address: string
  timestamp: Date
  accuracy?: number
  speed?: number
  heading?: number
}

export interface ShipmentStatus {
  status: string
  currentLocation?: RealTimeLocation
  estimatedArrival?: Date
  lastUpdate: Date
  events: TrackingEvent[]
}

export interface PlatformCapacityRequest {
  origin: Location
  destination: Location
  mode: TransportMode
  date: Date
  cargo: {
    weight?: number
    volume?: number
  }
}

export interface PlatformCapacity {
  available: boolean
  capacity: number // percentage
  availableSlots?: number
  earliestAvailableDate?: Date
  carriers?: PlatformCarrier[]
}

export interface PlatformCarrierSearchRequest {
  origin: Location
  destination: Location
  mode: TransportMode
  date?: Date
  criteria?: {
    minRating?: number
    maxPrice?: number
    specialCapabilities?: string[]
  }
}

export interface PlatformCarrier {
  id: string
  name: string
  rating: number
  onTimeRate: number
  pricing: {
    baseRate: number
    currency: string
  }
  capabilities: string[]
  coverage: {
    origin: boolean
    destination: boolean
  }
}

export interface PlatformDocument {
  id: string
  type: string
  name: string
  fileUrl: string
  mimeType: string
  uploadedAt: Date
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export interface PlatformDocumentRequest {
  origin: Location
  destination: Location
  mode: TransportMode
  cargoType?: string
}

export interface RequiredDocument {
  type: string
  name: string
  description: string
  required: boolean
  authority?: string
}

export interface ComplianceValidation {
  compliant: boolean
  violations: ComplianceViolation[]
  recommendations: string[]
  requiredActions: string[]
}

export interface ComplianceViolation {
  type: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  resolution?: string
}

export interface PlatformAnalyticsRequest {
  dateRange: { from: Date; to: Date }
  filters?: {
    mode?: TransportMode
    origin?: Location
    destination?: Location
    carrierId?: string
  }
  metrics?: string[]
}

export interface PlatformAnalytics {
  totalShipments: number
  totalRevenue: number
  averageTransitTime: number
  onTimeRate: number
  costPerShipment: number
  trends: {
    metric: string
    values: { date: Date; value: number }[]
  }[]
}

export interface PlatformMetricsRequest {
  period: 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'
  date: Date
  metrics?: string[]
}

export interface PlatformMetrics {
  period: string
  date: Date
  metrics: {
    name: string
    value: number
    target?: number
    unit?: string
    trend?: 'UP' | 'DOWN' | 'STABLE'
  }[]
}

export interface WebhookSubscription {
  id: string
  events: string[]
  webhookUrl: string
  secret?: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: Date
}

// ============================================================================
// BASE IMPLEMENTATION
// ============================================================================

export abstract class BaseTransportPlatformAdapter implements TransportPlatformAdapter {
  abstract readonly id: string
  abstract readonly name: string
  abstract readonly type: TransportPlatformType
  abstract readonly version: string

  protected config?: PlatformConfig
  protected connected: boolean = false

  abstract isConnected(): Promise<boolean>
  abstract testConnection(): Promise<{ success: boolean; message: string }>
  abstract connect(config: PlatformConfig): Promise<void>
  abstract disconnect(): Promise<void>

  // Default implementations (can be overridden)
  async planRoute?(request: PlatformRouteRequest): Promise<IntelligentRoutePlan> {
    throw new Error('Route planning not implemented')
  }

  async calculateTransitTime?(request: PlatformTransitTimeRequest): Promise<EnhancedTransitTimeCalculation> {
    throw new Error('Transit time calculation not implemented')
  }

  async getRouteConstraints?(origin: Location, destination: Location): Promise<RouteConstraint[]> {
    throw new Error('Route constraints not implemented')
  }

  abstract getQuote(request: PlatformQuoteRequest): Promise<PlatformQuote>
  abstract getQuotes(requests: PlatformQuoteRequest[]): Promise<PlatformQuote[]>

  async getMarketRates?(request: PlatformMarketRateRequest): Promise<PlatformMarketRate[]> {
    throw new Error('Market rates not implemented')
  }

  abstract createBooking(request: PlatformBookingRequest): Promise<PlatformBooking>
  abstract updateBooking(bookingId: string, updates: Partial<PlatformBooking>): Promise<PlatformBooking>
  abstract cancelBooking(bookingId: string, reason?: string): Promise<void>

  abstract trackShipment(trackingNumber: string): Promise<TrackingEvent[]>

  async getRealTimeLocation?(trackingNumber: string): Promise<RealTimeLocation> {
    throw new Error('Real-time location not implemented')
  }

  async getShipmentStatus?(shipmentId: string): Promise<ShipmentStatus> {
    throw new Error('Shipment status not implemented')
  }

  async checkCapacity?(request: PlatformCapacityRequest): Promise<PlatformCapacity> {
    throw new Error('Capacity check not implemented')
  }

  async searchAvailableCarriers?(request: PlatformCarrierSearchRequest): Promise<PlatformCarrier[]> {
    throw new Error('Carrier search not implemented')
  }

  async uploadDocument?(shipmentId: string, document: PlatformDocument): Promise<PlatformDocument> {
    throw new Error('Document upload not implemented')
  }

  async getRequiredDocuments?(request: PlatformDocumentRequest): Promise<RequiredDocument[]> {
    throw new Error('Required documents not implemented')
  }

  async validateCompliance?(shipmentId: string): Promise<ComplianceValidation> {
    throw new Error('Compliance validation not implemented')
  }

  async getAnalytics?(request: PlatformAnalyticsRequest): Promise<PlatformAnalytics> {
    throw new Error('Analytics not implemented')
  }

  async getPerformanceMetrics?(request: PlatformMetricsRequest): Promise<PlatformMetrics> {
    throw new Error('Performance metrics not implemented')
  }

  async subscribeToEvents?(events: string[], webhookUrl: string): Promise<WebhookSubscription> {
    throw new Error('Webhook subscription not implemented')
  }

  async unsubscribeFromEvents?(subscriptionId: string): Promise<void> {
    throw new Error('Webhook unsubscription not implemented')
  }
}



