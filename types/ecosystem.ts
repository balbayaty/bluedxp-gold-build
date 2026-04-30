// AI-T ECOSYSTEM - Universal Transportation Intelligence Platform
// Comprehensive TypeScript Definitions
// Source: Adapted from chemcheck-analysis/types/ecosystemTypes.ts

export interface Location {
  lat: number
  lng: number
  address?: string
  city?: string
  country?: string
  timezone?: string
}

export interface Geofence {
  center: Location
  radius: number // in meters
  type: 'circular' | 'polygon'
  coordinates?: Location[]
}

export interface TimeWindow {
  start: Date
  end: Date
  timezone: string
}

export type Currency = {
  amount: number
  currency: string // ISO 4217 currency codes
}

export type TransportMode = 'road' | 'rail' | 'maritime' | 'aviation' | 'pipeline' | 'multimodal'
export type CargoType = 'general' | 'chemical' | 'hazardous' | 'perishable' | 'oversized' | 'liquid' | 'bulk'
export type ShipmentStatus = 'planning' | 'booked' | 'in_transit' | 'customs' | 'delivered' | 'completed'

// ==================== BASE SUPPORTING TYPES ====================

export interface Dimensions {
  length: number
  width: number
  height: number
  unit: 'cm' | 'm' | 'in' | 'ft'
}

export interface TemperatureRange {
  min: number
  max: number
  unit: 'celsius' | 'fahrenheit'
}

export interface ContactInfo {
  email: string
  phone: string
  address: string
  website?: string
}

export interface OperatingSchedule {
  day: string
  openTime: string
  closeTime: string
  timezone: string
  exceptions: ScheduleException[]
}

export interface ScheduleException {
  date: Date
  type: 'closed' | 'modified_hours'
  openTime?: string
  closeTime?: string
  reason?: string
}

export interface PricingStructure {
  type: 'fixed' | 'variable' | 'tiered' | 'distance_based' | 'weight_based'
  baseRate: Currency
  additionalCharges: AdditionalCharge[]
  discounts: Discount[]
  surcharges: Surcharge[]
}

export interface AdditionalCharge {
  name: string
  amount: Currency
  type: 'fixed' | 'percentage'
  description: string
  optional: boolean
}

export interface Discount {
  name: string
  amount: Currency
  type: 'fixed' | 'percentage'
  conditions: string[]
  validUntil?: Date
}

export interface Surcharge {
  name: string
  amount: Currency
  type: 'fixed' | 'percentage'
  trigger: string
  mandatory: boolean
}

export interface APIEndpoint {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  authentication: AuthenticationMethod
  rateLimit?: RateLimit
  documentation?: string
}

export interface AuthenticationMethod {
  type: 'api_key' | 'oauth2' | 'basic_auth' | 'bearer_token'
  parameters: Record<string, string>
}

export interface RateLimit {
  requests: number
  period: number // in seconds
  burst?: number
}

export interface BookingAPI {
  endpoint: APIEndpoint
  realTimeAvailability: boolean
  confirmationMethod: 'immediate' | 'delayed' | 'manual'
  cancellationPolicy: CancellationPolicy
  paymentRequired: boolean
}

export interface TrackingAPI {
  endpoint: APIEndpoint
  realTimeUpdates: boolean
  updateFrequency: number // in seconds
  dataPoints: TrackingDataPoint[]
}

export interface TrackingDataPoint {
  name: string
  type: 'location' | 'status' | 'eta' | 'temperature' | 'fuel' | 'documents'
  required: boolean
}

export interface CancellationPolicy {
  freeUntil: number // hours before departure
  charges: CancellationCharge[]
  refundPolicy: string
}

export interface CancellationCharge {
  timeframe: string
  charge: Currency
  type: 'fixed' | 'percentage'
}

// ==================== UNIVERSAL TRANSPORT ECOSYSTEM ====================

export interface UniversalTransportProvider {
  id: string
  name: string
  type: TransportMode
  region: string[]
  services: TransportService[]
  apiEndpoint?: string
  credentials?: APICredentials
  capabilities: ProviderCapabilities
  ratings: ProviderRatings
  compliance: ComplianceRating[]
}

export interface TransportService {
  id: string
  name: string
  type: 'freight' | 'passenger' | 'equipment' | 'storage' | 'handling'
  mode: TransportMode
  coverage: ServiceCoverage
  pricing: PricingStructure
  bookingAPI: BookingAPI
  trackingAPI: TrackingAPI
}

export interface ServiceCoverage {
  routes: Route[]
  terminals: Terminal[]
  operatingHours: OperatingSchedule[]
  restrictions: ServiceRestriction[]
}

export interface Terminal {
  id: string
  name: string
  type: 'port' | 'airport' | 'rail_station' | 'truck_terminal' | 'warehouse'
  location: Location
  operator: string
  facilities: TerminalFacility[]
  services: string[]
  operatingHours: OperatingSchedule[]
}

export interface TerminalFacility {
  name: string
  type: string
  capacity: number
  availability: boolean
  hourlyRate?: Currency
}

export interface ServiceRestriction {
  type: 'cargo' | 'weight' | 'dimensions' | 'hazmat' | 'time' | 'route'
  description: string
  conditions: string[]
  exceptions?: string[]
}

export interface Route {
  id: string
  origin: Location
  destination: Location
  waypoints: Location[]
  distance: number // in kilometers
  estimatedTime: number // in minutes
  modes: TransportMode[]
  restrictions: RouteRestriction[]
}

export interface RouteRestriction {
  type: 'weight' | 'height' | 'hazmat' | 'time' | 'seasonal'
  value?: number
  description: string
  applies: string[]
}

// ==================== MULTI-MODAL BOOKING ENGINE ====================

export interface CustomerProfile {
  id: string
  name: string
  type: 'individual' | 'business' | 'enterprise'
  contactInfo: ContactInfo
  preferences: CustomerPreferences
  creditRating?: CreditRating
  paymentMethods: PaymentMethod[]
}

export interface CustomerPreferences {
  preferredModes: TransportMode[]
  priorityFactors: PriorityFactor[]
  sustainabilityPreference: 'low' | 'medium' | 'high'
  priceRange?: PriceRange
}

export interface PriorityFactor {
  factor: 'cost' | 'time' | 'reliability' | 'sustainability' | 'comfort'
  weight: number // 0-1
}

export interface CreditRating {
  score: number
  agency: string
  lastUpdated: Date
}

export interface PaymentMethod {
  id: string
  type: 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet' | 'crypto'
  details: PaymentMethodDetails
  isDefault: boolean
}

export interface PaymentMethodDetails {
  provider: string
  lastFour?: string
  expiryDate?: Date
  verified: boolean
}

export interface BookingRequest {
  id: string
  type: 'transport' | 'accommodation' | 'fuel' | 'services' | 'multimodal'
  requester: CustomerProfile
  cargo?: CargoDetails
  route: RouteRequest
  requirements: BookingRequirements
  preferences: BookingPreferences
  timeConstraints: TimeConstraints
  budget?: BudgetConstraints
}

export interface BookingRequirements {
  insurance: boolean
  tracking: boolean
  documentation: string[]
  specialHandling: string[]
  compliance: string[]
}

export interface BookingPreferences {
  providerPreferences: string[]
  serviceLevel: 'economy' | 'standard' | 'premium'
  flexibilityOptions: FlexibilityOption[]
  notificationPreferences: NotificationPreference[]
}

export interface FlexibilityOption {
  type: 'time' | 'route' | 'provider' | 'price'
  tolerance: number // percentage or absolute value
}

export interface NotificationPreference {
  channel: 'email' | 'sms' | 'app' | 'webhook'
  events: string[]
  enabled: boolean
}

export interface TimeConstraints {
  earliestDeparture?: Date
  latestDeparture?: Date
  earliestArrival?: Date
  latestArrival?: Date
  flexibility: number // hours
}

export interface BudgetConstraints {
  maxBudget: Currency
  targetBudget?: Currency
  includesInsurance: boolean
  includesFees: boolean
}

export interface CargoDetails {
  type: CargoType
  weight: number // in kg
  volume: number // in cubic meters
  dimensions: Dimensions
  value: Currency
  specialRequirements: SpecialRequirement[]
  hazmatClass?: string
  temperatureRange?: TemperatureRange
}

export interface SpecialRequirement {
  type: 'temperature_controlled' | 'fragile' | 'oversized' | 'hazardous' | 'time_sensitive'
  description: string
  instructions: string[]
  additionalCost?: Currency
}

export interface RouteRequest {
  origin: Location
  destination: Location
  preferredModes: TransportMode[]
  departureTime: Date
  arrivalTime?: Date
  stops?: Location[]
  avoidances?: RouteAvoidance[]
}

export interface RouteAvoidance {
  type: 'location' | 'route' | 'provider' | 'time_period'
  details: string
  reason: string
}

export interface BookingResponse {
  options: BookingOption[]
  comparisons: BookingComparison
  recommendations: BookingRecommendation[]
  totalResults: number
  searchTime: number
}

export interface BookingOption {
  id: string
  provider: UniversalTransportProvider
  services: TransportService[]
  route: OptimizedRoute
  pricing: PricingBreakdown
  timeline: Timeline
  availability: AvailabilityInfo
  sustainability: SustainabilityMetrics
  reliability: ReliabilityScore
  bookingDetails: BookingDetails
}

export interface OptimizedRoute {
  segments: RouteSegment[]
  totalDistance: number
  totalTime: number
  waypoints: Location[]
  optimization: OptimizationSummary
}

export interface RouteSegment {
  id: string
  mode: TransportMode
  provider: string
  origin: Location
  destination: Location
  distance: number
  estimatedTime: number
  cost: Currency
}

export interface OptimizationSummary {
  criteria: string[]
  score: number
  improvements: Improvement[]
}

export interface Improvement {
  aspect: string
  value: number
  unit: string
}

export interface PricingBreakdown {
  basePrice: Currency
  taxes: Currency
  fees: Currency
  surcharges: Currency
  discounts: Currency
  totalPrice: Currency
  breakdown: PriceLineItem[]
}

export interface PriceLineItem {
  name: string
  amount: Currency
  type: 'base' | 'tax' | 'fee' | 'surcharge' | 'discount'
  description: string
}

export interface Timeline {
  departure: Date
  arrival: Date
  milestones: TimelineMilestone[]
  bufferTime: number // in minutes
}

export interface TimelineMilestone {
  name: string
  estimatedTime: Date
  type: 'pickup' | 'delivery' | 'checkpoint' | 'border' | 'transfer'
  location: Location
}

export interface AvailabilityInfo {
  available: boolean
  capacity: number
  remainingCapacity: number
  nextAvailable?: Date
  restrictions: string[]
}

export interface SustainabilityMetrics {
  carbonFootprint: number // kg CO2
  energyEfficiency: number
  renewableEnergyUse: number // percentage
  sustainabilityScore: number // 0-100
  certifications: string[]
}

export interface ReliabilityScore {
  overall: number // 0-100
  onTimePerformance: number
  damageRate: number
  customerSatisfaction: number
  historicalData: HistoricalReliability[]
}

export interface HistoricalReliability {
  period: string
  metric: string
  value: number
}

export interface BookingDetails {
  bookingMethod: 'instant' | 'quote' | 'manual_review'
  confirmationTime: number // minutes
  paymentRequired: 'immediate' | 'on_delivery' | 'net_terms'
  cancellationPolicy: CancellationPolicy
  insurance: InsuranceOption[]
}

export interface InsuranceOption {
  type: 'basic' | 'comprehensive' | 'custom'
  coverage: Currency
  premium: Currency
  deductible: Currency
  provider: string
}

export interface BookingComparison {
  cheapest: string // booking option id
  fastest: string
  mostReliable: string
  mostSustainable: string
  recommended: string
  criteriaAnalysis: CriteriaAnalysis[]
}

export interface CriteriaAnalysis {
  criterion: string
  options: OptionScore[]
  bestValue: string
}

export interface OptionScore {
  optionId: string
  score: number
  rank: number
  details: string
}

export interface BookingRecommendation {
  optionId: string
  reason: string
  benefits: string[]
  considerations: string[]
  confidence: number // 0-100
}

// ==================== REAL-TIME DATA ECOSYSTEM ====================

export interface LiveDataStream {
  source: DataSource
  category: DataCategory
  lastUpdated: Date
  frequency: number // updates per minute
  reliability: number // 0-1 score
  data: LiveDataPoint[]
}

export type DataCategory =
  | 'vehicle_tracking'
  | 'fuel_prices'
  | 'border_status'
  | 'weather'
  | 'traffic'
  | 'terminal_capacity'
  | 'accommodation_availability'
  | 'market_rates'
  | 'currency_exchange'

export interface DataSource {
  id: string
  name: string
  type: 'api' | 'sensor' | 'manual' | 'calculated'
  credibility: number // 0-1 score
  updateFrequency: number // in seconds
  coverage: GeographicCoverage
}

export interface GeographicCoverage {
  regions: string[]
  countries: string[]
  coordinates?: Geofence[]
  global: boolean
}

export interface LiveDataPoint {
  timestamp: Date
  location?: Location
  value: any
  metadata: Record<string, any>
  confidence: number // 0-1 score
}

// ==================== PRICE INDEX & MARKET INTELLIGENCE ====================

export interface PriceIndex {
  id: string
  category: 'transport' | 'fuel' | 'accommodation' | 'terminal' | 'services'
  region: string
  timeframe: TimeFrame
  baseIndex: number
  currentIndex: number
  trend: PriceTrend
  components: PriceComponent[]
  lastUpdated: Date
  reliability: number
}

export interface MarketIntelligence {
  id: string
  market: MarketSegment
  currentConditions: MarketConditions
  forecasts: MarketForecast[]
  opportunities: MarketOpportunity[]
  risks: MarketRisk[]
  competitors: CompetitorAnalysis[]
  insights: MarketInsight[]
}

export interface MarketSegment {
  name: string
  type: 'regional' | 'mode' | 'cargo' | 'service'
  size: Currency
  growth: number // percentage
  participants: number
}

export interface MarketConditions {
  supply: number
  demand: number
  utilization: number // percentage
  pricing: PriceLevel
  volatility: number
}

export type PriceLevel = 'very_low' | 'low' | 'normal' | 'high' | 'very_high'

export interface MarketOpportunity {
  title: string
  description: string
  impact: ImpactLevel
  timeframe: string
  requirements: string[]
  riskLevel: ImpactLevel
}

export interface MarketRisk {
  title: string
  description: string
  probability: number // 0-100
  impact: ImpactLevel
  mitigation: string[]
  indicators: string[]
}

export interface CompetitorAnalysis {
  competitor: string
  marketShare: number // percentage
  strengths: string[]
  weaknesses: string[]
  pricing: 'aggressive' | 'competitive' | 'premium'
  focus: string[]
}

export interface MarketInsight {
  title: string
  content: string
  type: 'trend' | 'opportunity' | 'risk' | 'recommendation'
  confidence: number // 0-100
  sources: string[]
  timeRelevance: string
}

export interface PriceComponent {
  name: string
  weight: number // percentage of total index
  value: number
  change: number // percentage change
  drivers: PriceDriver[]
}

export interface PriceDriver {
  factor: string
  impact: number // percentage impact on price
  trend: TrendDirection
  explanation: string
}

export interface MarketForecast {
  timeframe: TimeFrame
  metric: string
  predicted: number
  confidence: number // 0-1
  scenarios: ForecastScenario[]
  assumptions: string[]
}

export interface ForecastScenario {
  name: string
  probability: number // 0-100
  outcome: number
  description: string
  factors: string[]
}

// ==================== AI ECOSYSTEM OPTIMIZATION ====================

export interface EcosystemOptimizer {
  optimizationGoals: OptimizationGoal[]
  constraints: OptimizationConstraint[]
  algorithms: OptimizationAlgorithm[]
  performance: OptimizationMetrics
}

export interface OptimizationGoal {
  type: 'cost' | 'time' | 'sustainability' | 'reliability' | 'quality'
  weight: number // 0-1, sum should equal 1
  target?: number
  constraints?: GoalConstraint[]
}

export interface OptimizationConstraint {
  type: 'hard' | 'soft'
  category: 'budget' | 'time' | 'capacity' | 'compliance' | 'quality'
  value: number
  unit: string
  description: string
}

export interface OptimizationAlgorithm {
  name: string
  type: 'genetic' | 'simulated_annealing' | 'gradient_descent' | 'reinforcement_learning'
  parameters: AlgorithmParameters
  performance: AlgorithmPerformance
}

export interface AlgorithmParameters {
  [key: string]: number | string | boolean
}

export interface AlgorithmPerformance {
  accuracy: number // 0-100
  speed: number // operations per second
  memoryUsage: number // MB
  convergenceRate: number
}

export interface OptimizationMetrics {
  totalOptimizations: number
  averageImprovement: number // percentage
  successRate: number // percentage
  averageComputeTime: number // seconds
}

export interface GoalConstraint {
  parameter: string
  operator: '<' | '>' | '=' | '<=' | '>='
  value: number
  priority: 'low' | 'medium' | 'high'
}

export interface OptimizationResult {
  id: string
  request: OptimizationRequest
  solutions: OptimizedSolution[]
  recommendations: Recommendation[]
  tradeoffs: TradeoffAnalysis[]
  confidence: number
  computationTime: number
}

export interface OptimizationRequest {
  id: string
  type: 'route' | 'capacity' | 'pricing' | 'network' | 'comprehensive'
  parameters: RequestParameters
  constraints: OptimizationConstraint[]
  objectives: OptimizationGoal[]
  timeLimit?: number // seconds
}

export interface RequestParameters {
  [key: string]: any
}

export interface OptimizedSolution {
  id: string
  score: number
  components: SolutionComponent[]
  metrics: SolutionMetrics
  risks: RiskAssessment[]
  sustainability: SustainabilityMetrics
}

export interface SolutionComponent {
  type: string
  provider: string
  parameters: ComponentParameters
  contribution: number // to overall score
}

export interface ComponentParameters {
  [key: string]: any
}

export interface SolutionMetrics {
  cost: Currency
  time: number // minutes
  reliability: number // 0-100
  sustainability: number // 0-100
  quality: number // 0-100
}

export interface RiskAssessment {
  category: string
  level: ImpactLevel
  probability: number // 0-100
  impact: string
  mitigation: string[]
}

export interface Recommendation {
  type: 'optimization' | 'alternative' | 'risk_mitigation' | 'cost_saving'
  title: string
  description: string
  impact: ImpactLevel
  effort: 'low' | 'medium' | 'high'
  timeframe: string
}

export interface TradeoffAnalysis {
  factor1: string
  factor2: string
  relationship: 'positive' | 'negative' | 'neutral'
  strength: number // 0-100
  explanation: string
  examples: TradeoffExample[]
}

export interface TradeoffExample {
  scenario: string
  factor1Change: number
  factor2Change: number
  outcome: string
}

// ==================== SUPPORTING TYPES ====================

export interface APICredentials {
  type: 'api_key' | 'oauth' | 'basic_auth' | 'token'
  credentials: Record<string, string>
  refreshToken?: string
  expiresAt?: Date
}

export interface ProviderCapabilities {
  realTimeTracking: boolean
  onlineBooking: boolean
  documentManagement: boolean
  paymentIntegration: boolean
  multiModal: boolean
  specialCargo: string[]
}

export interface ProviderRatings {
  overall: number // 0-5
  reliability: number
  costEffectiveness: number
  customerService: number
  sustainability: number
  reviewCount: number
  lastUpdated: Date
}

export interface ComplianceRating {
  standard: string
  rating: 'excellent' | 'good' | 'fair' | 'poor'
  certifications: string[]
  lastAudit: Date
  expiryDate?: Date
}

export type TimeFrame = {
  start: Date
  end: Date
  granularity: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
}

export type PriceTrend = 'increasing' | 'decreasing' | 'stable' | 'volatile'
export type TrendDirection = 'up' | 'down' | 'stable'
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical'

export interface PriceRange {
  min: Currency
  max: Currency
  average?: Currency
}

// ==================== ECOSYSTEM CONFIGURATION ====================

export interface EcosystemConfig {
  regions: string[]
  supportedModes: TransportMode[]
  integrations: IntegrationConfig[]
  features: FeatureConfig[]
  limits: SystemLimits
}

export interface IntegrationConfig {
  providerId: string
  enabled: boolean
  priority: number
  fallbacks: string[]
  healthCheck: HealthCheckConfig
}

export interface FeatureConfig {
  name: string
  enabled: boolean
  betaAccess?: boolean
  rolloutPercentage?: number
  dependencies?: string[]
}

export interface SystemLimits {
  maxRequestsPerMinute: number
  maxConcurrentBookings: number
  maxDataRetention: number // days
  maxFileSize: number // MB
}

export interface HealthCheckConfig {
  endpoint: string
  interval: number // seconds
  timeout: number // seconds
  retries: number
  successCriteria: HealthCriteria
}

export interface HealthCriteria {
  statusCode: number
  responseTime: number // milliseconds
  contentPattern?: string
}






