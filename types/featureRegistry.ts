/**
 * Feature Registry Types
 * Comprehensive type definitions for WMS feature tracking,
 * requirements, and readiness assessment
 */

// Feature implementation status levels
export type FeatureStatus = 
  | 'MOCK'        // Using mock/demo data only
  | 'DEMO'        // Demo mode - shows functionality but not production-ready
  | 'PARTIAL'     // Partially implemented - some functionality working
  | 'READY'       // Ready to use with configuration
  | 'PRODUCTION'  // Fully production-ready

// Data source types
export type DataSource = 
  | 'MANUAL_ENTRY'
  | 'ERP_IMPORT'
  | 'IOT_SENSOR'
  | 'BARCODE_SCAN'
  | 'RFID_READ'
  | 'API_INTEGRATION'
  | 'FILE_UPLOAD'
  | 'CAMERA_VISION'
  | 'GPS_TRACKING'
  | 'WEIGHT_SCALE'
  | 'TEMPERATURE_SENSOR'

// Integration types
export type IntegrationType = 
  | 'API'
  | 'WEBHOOK'
  | 'DATABASE'
  | 'FILE'
  | 'IOT'
  | 'MQTT'
  | 'WEBSOCKET'
  | 'EDI'
  | 'FTP'

/**
 * Data requirement definition
 */
export interface DataRequirement {
  id: string
  item: string
  description: string
  source: DataSource
  required: boolean
  currentStatus: 'AVAILABLE' | 'PARTIAL' | 'MISSING'
  mockAvailable: boolean
  documentation?: string
}

/**
 * Integration requirement definition
 */
export interface IntegrationRequirement {
  id: string
  item: string
  description: string
  type: IntegrationType
  required: boolean
  currentStatus: 'CONNECTED' | 'CONFIGURED' | 'PENDING' | 'NOT_AVAILABLE'
  endpoint?: string
  documentation?: string
}

/**
 * Hardware requirement definition
 */
export interface HardwareRequirement {
  id: string
  item: string
  description: string
  alternatives?: string[]
  required: boolean
  estimatedCost?: string
  vendors?: string[]
}

/**
 * Configuration step definition
 */
export interface ConfigurationStep {
  step: number
  action: string
  where: string
  estimatedTime: string
  complexity: 'EASY' | 'MEDIUM' | 'COMPLEX'
  documentation?: string
}

/**
 * System benchmark data
 */
export interface SystemBenchmark {
  hasFeature: boolean
  maturityLevel: 'BASIC' | 'STANDARD' | 'ADVANCED' | 'WORLD_CLASS'
  notes: string
  limitations?: string[]
}

/**
 * Feature metrics for decision making
 */
export interface FeatureMetrics {
  weight: number              // Business importance (1-10)
  probability: number         // Probability of success with current setup (0-100%)
  ease: number                // Ease of implementation (1-10, 10=easiest)
  estimatedEffort: string     // Time estimate
  roi: number                 // Return on investment score (1-10)
  dependencies: string[]      // Other features this depends on
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  maintenanceEffort: 'LOW' | 'MEDIUM' | 'HIGH'
}

/**
 * Complete WMS Feature definition
 */
export interface WMSFeature {
  id: string
  name: string
  description: string
  category: 'INBOUND' | 'OUTBOUND' | 'INVENTORY' | 'PICKING' | 'PUTAWAY' | 'SHIPPING' | 'ANALYTICS' | 'INTEGRATION' | 'OPTIMIZATION' | 'QUALITY'
  status: FeatureStatus
  
  // Requirements breakdown
  requirements: {
    data: DataRequirement[]
    integrations: IntegrationRequirement[]
    hardware: HardwareRequirement[]
    configuration: ConfigurationStep[]
  }
  
  // Decision metrics
  metrics: FeatureMetrics
  
  // Industry benchmark comparison
  benchmark: {
    sap: SystemBenchmark
    oracle: SystemBenchmark
    manhattan: SystemBenchmark
    blueYonder: SystemBenchmark
    korber: SystemBenchmark
  }
  
  // Additional context
  examples: string[]
  benefits: string[]
  limitations: string[]
  documentation?: string
  videoTutorial?: string
  
  // Version tracking
  version: string
  lastUpdated: string
}

/**
 * Feature category metadata
 */
export interface FeatureCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  features: string[]
}

/**
 * Feature readiness assessment result
 */
export interface FeatureReadinessAssessment {
  featureId: string
  overallScore: number        // 0-100
  dataReadiness: number       // 0-100
  integrationReadiness: number // 0-100
  configurationReadiness: number // 0-100
  hardwareReadiness: number   // 0-100
  missingRequirements: string[]
  recommendations: string[]
  estimatedTimeToProduction: string
}

/**
 * Status configuration for UI display
 */
export const FEATURE_STATUS_CONFIG: Record<FeatureStatus, {
  color: string
  bgColor: string
  borderColor: string
  icon: string
  label: string
  description: string
}> = {
  MOCK: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    icon: 'ri-flask-line',
    label: 'Mock Data',
    description: 'Using simulated demo data - not connected to real systems'
  },
  DEMO: {
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    icon: 'ri-presentation-line',
    label: 'Demo Mode',
    description: 'Functional demo - shows capabilities but requires setup for production'
  },
  PARTIAL: {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    icon: 'ri-tools-line',
    label: 'Partially Ready',
    description: 'Some features working - additional configuration needed'
  },
  READY: {
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30',
    icon: 'ri-checkbox-circle-line',
    label: 'Ready',
    description: 'Ready to use with proper configuration'
  },
  PRODUCTION: {
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    icon: 'ri-verified-badge-line',
    label: 'Production',
    description: 'Fully production-ready and tested'
  }
}

/**
 * Calculate feature readiness score
 */
export function calculateFeatureReadiness(feature: WMSFeature): FeatureReadinessAssessment {
  const { requirements } = feature
  
  // Calculate data readiness
  const dataItems = requirements.data.filter(d => d.required)
  const dataReady = dataItems.filter(d => d.currentStatus === 'AVAILABLE').length
  const dataReadiness = dataItems.length > 0 ? (dataReady / dataItems.length) * 100 : 100
  
  // Calculate integration readiness
  const integrationItems = requirements.integrations.filter(i => i.required)
  const integrationReady = integrationItems.filter(i => i.currentStatus === 'CONNECTED').length
  const integrationReadiness = integrationItems.length > 0 ? (integrationReady / integrationItems.length) * 100 : 100
  
  // Configuration is assumed partially complete for PARTIAL/READY status
  const configReadiness = feature.status === 'PRODUCTION' ? 100 :
    feature.status === 'READY' ? 80 :
    feature.status === 'PARTIAL' ? 50 :
    feature.status === 'DEMO' ? 30 : 10
  
  // Hardware is optional in most cases
  const hardwareItems = requirements.hardware.filter(h => h.required)
  const hardwareReadiness = hardwareItems.length > 0 ? 50 : 100 // Assume 50% if required
  
  // Calculate overall score
  const overallScore = (
    dataReadiness * 0.3 +
    integrationReadiness * 0.3 +
    configReadiness * 0.25 +
    hardwareReadiness * 0.15
  )
  
  // Find missing requirements
  const missingRequirements: string[] = []
  requirements.data.filter(d => d.required && d.currentStatus !== 'AVAILABLE')
    .forEach(d => missingRequirements.push(`Data: ${d.item}`))
  requirements.integrations.filter(i => i.required && i.currentStatus !== 'CONNECTED')
    .forEach(i => missingRequirements.push(`Integration: ${i.item}`))
  requirements.hardware.filter(h => h.required)
    .forEach(h => missingRequirements.push(`Hardware: ${h.item}`))
  
  // Generate recommendations
  const recommendations: string[] = []
  if (dataReadiness < 80) {
    recommendations.push('Complete data requirements configuration')
  }
  if (integrationReadiness < 80) {
    recommendations.push('Connect required integrations')
  }
  if (configReadiness < 80) {
    recommendations.push('Complete feature configuration steps')
  }
  
  // Estimate time to production
  let timeToProduction = 'Unknown'
  if (overallScore >= 90) timeToProduction = '1-2 days'
  else if (overallScore >= 70) timeToProduction = '1-2 weeks'
  else if (overallScore >= 50) timeToProduction = '2-4 weeks'
  else if (overallScore >= 30) timeToProduction = '1-2 months'
  else timeToProduction = '3+ months'
  
  return {
    featureId: feature.id,
    overallScore: Math.round(overallScore),
    dataReadiness: Math.round(dataReadiness),
    integrationReadiness: Math.round(integrationReadiness),
    configurationReadiness: Math.round(configReadiness),
    hardwareReadiness: Math.round(hardwareReadiness),
    missingRequirements,
    recommendations,
    estimatedTimeToProduction: timeToProduction
  }
}

