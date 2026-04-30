/**
 * Journey Analysis Types
 * Comprehensive logistics journey tracking and optimization
 */

// Touchpoint Categories
export type TouchpointCategory = 'Origin' | 'Transport' | 'Customs' | 'Destination'

// Journey Touchpoint
export interface JourneyTouchpoint {
  id: number
  name: string
  avgHours: number
  percentage: number
  category: TouchpointCategory
  minTime: number
  maxTime: number
  stdDev: number
  operationalHours: string
  description: string
  keyIssues: string
  recommendations: string
  bottleneckRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  optimizationPotential: number
}

// Journey Analysis
export interface JourneyAnalysis {
  id: string
  name: string
  routeId: string
  totalJourneyTime: number
  touchpoints: JourneyTouchpoint[]
  categoryBreakdown: CategoryBreakdown[]
  bottlenecks: BottleneckAnalysis[]
  optimizationOpportunities: OptimizationOpportunity[]
  co2Emissions: EmissionsAnalysis
  lastUpdated: string
}

export interface CategoryBreakdown {
  category: TouchpointCategory
  totalHours: number
  percentage: number
  touchpointCount: number
  color: string
}

export interface BottleneckAnalysis {
  touchpointId: number
  name: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  rootCause: string
  impact: string
  recommendation: string
  estimatedSavings: number
  implementationCost: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface OptimizationOpportunity {
  id: string
  title: string
  description: string
  category: 'QUICK_WIN' | 'MEDIUM_TERM' | 'LONG_TERM'
  estimatedSavings: number
  implementationCost: 'LOW' | 'MEDIUM' | 'HIGH'
  timeframe: string
  priority: number
  dependencies?: string[]
  roi?: number
}

export interface EmissionsAnalysis {
  totalEmissions: number
  byCategory: { category: string; emissions: number; percentage: number }[]
  idleEmissions: number
  transitEmissions: number
  reductionPotential: number
  greenInitiatives: GreenInitiative[]
}

export interface GreenInitiative {
  name: string
  description: string
  co2Reduction: number
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'
}

// ---------------------------------------------------------------------------
// DEMO DATASET (VIEW-ONLY)
// ---------------------------------------------------------------------------
// NOTE: This is a static example lane dataset (Saudi → Kuwait) for dashboards/demos.
// The production Journey Analysis engine is lane-agnostic and should generate touchpoints
// dynamically from origin/destination/mode (see `lib/services/transportation/journeyAnalysisService.ts`).
// Keep this data for showcase purposes only.
export const SAUDI_KUWAIT_TOUCHPOINTS: JourneyTouchpoint[] = [
  {
    id: 1,
    name: 'Waiting outside Plant',
    avgHours: 1.89,
    percentage: 1.51,
    category: 'Origin',
    minTime: 0.5,
    maxTime: 3.2,
    stdDev: 0.8,
    operationalHours: '24/7',
    description: 'Initial waiting time before truck enters plant for loading',
    keyIssues: 'Queue management and entry processing constraints',
    recommendations: 'Implement appointment system and expedited entry lanes',
    bottleneckRisk: 'LOW',
    optimizationPotential: 0.5
  },
  {
    id: 2,
    name: 'Truck Loading Time',
    avgHours: 6.54,
    percentage: 5.22,
    category: 'Origin',
    minTime: 5.1,
    maxTime: 8.3,
    stdDev: 0.9,
    operationalHours: '24/7',
    description: 'Time required to load cargo onto truck at shipper plant',
    keyIssues: 'Standard loading protocols and equipment limitations',
    recommendations: 'Optimize loading procedures and evaluate equipment upgrades',
    bottleneckRisk: 'MEDIUM',
    optimizationPotential: 1.0
  },
  {
    id: 3,
    name: 'Documentation waiting',
    avgHours: 5.28,
    percentage: 4.21,
    category: 'Origin',
    minTime: 3.2,
    maxTime: 7.8,
    stdDev: 1.3,
    operationalHours: '8am-11pm (Sat-Thu)',
    description: 'Time spent waiting for documentation processing before departure',
    keyIssues: 'Limited processing hours compared to 24/7 loading',
    recommendations: 'Implement digital documentation and pre-filing protocols',
    bottleneckRisk: 'MEDIUM',
    optimizationPotential: 2.5
  },
  {
    id: 4,
    name: 'Transit to Saudi Customs',
    avgHours: 11.05,
    percentage: 8.82,
    category: 'Transport',
    minTime: 9.5,
    maxTime: 13.2,
    stdDev: 1.1,
    operationalHours: 'N/A (transit)',
    description: 'Transit time from loading plant to Saudi customs checkpoint',
    keyIssues: 'Long distance and potential traffic congestion',
    recommendations: 'Optimize route planning and driver scheduling',
    bottleneckRisk: 'LOW',
    optimizationPotential: 0.5
  },
  {
    id: 5,
    name: 'Saudi custom clearance',
    avgHours: 7.21,
    percentage: 5.75,
    category: 'Customs',
    minTime: 5.8,
    maxTime: 9.7,
    stdDev: 1.2,
    operationalHours: '24/7',
    description: 'Time required for customs clearance at Saudi border',
    keyIssues: 'Thorough inspection processes for chemical shipments',
    recommendations: 'Establish trusted shipper program for expedited clearance',
    bottleneckRisk: 'MEDIUM',
    optimizationPotential: 2.0
  },
  {
    id: 6,
    name: 'Kuwait custom clearance',
    avgHours: 55.43,
    percentage: 44.22,
    category: 'Customs',
    minTime: 36.5,
    maxTime: 82.3,
    stdDev: 12.7,
    operationalHours: '8am-1pm (Sat-Thu)',
    description: 'Time required for customs clearance at Kuwait border',
    keyIssues: 'Extremely limited operational hours (only 5 hours daily, 6 days per week)',
    recommendations: 'Engage with Kuwait authorities for extended processing options',
    bottleneckRisk: 'CRITICAL',
    optimizationPotential: 24.5
  },
  {
    id: 7,
    name: 'Transit to warehouse',
    avgHours: 2.37,
    percentage: 1.89,
    category: 'Transport',
    minTime: 1.8,
    maxTime: 3.1,
    stdDev: 0.4,
    operationalHours: 'N/A (transit)',
    description: 'Transit time from Kuwait customs to consignee warehouse',
    keyIssues: 'Limited issues, relatively short transit time',
    recommendations: 'Maintain current routing protocols',
    bottleneckRisk: 'LOW',
    optimizationPotential: 0.2
  },
  {
    id: 8,
    name: 'Waiting outside working hours',
    avgHours: 7.94,
    percentage: 6.33,
    category: 'Destination',
    minTime: 0.0,
    maxTime: 30.0,
    stdDev: 9.1,
    operationalHours: '5am-4pm (Sat-Thu)',
    description: 'Time trucks spend waiting due to arrival outside warehouse operational hours',
    keyIssues: 'Nearly half of arrivals occur outside working hours',
    recommendations: 'Schedule arrivals between 5-8am for same-day processing',
    bottleneckRisk: 'HIGH',
    optimizationPotential: 7.0
  },
  {
    id: 9,
    name: 'Actual offloading time',
    avgHours: 8.83,
    percentage: 7.04,
    category: 'Destination',
    minTime: 6.18,
    maxTime: 17.77,
    stdDev: 2.66,
    operationalHours: '5am-4pm (Sat-Thu)',
    description: 'Actual time required for offloading cargo at the warehouse',
    keyIssues: 'Wide variation in processing times (6.18-17.77 hours)',
    recommendations: 'Standardize offloading procedures to match best performers',
    bottleneckRisk: 'MEDIUM',
    optimizationPotential: 3.0
  }
]

// Category Colors
export const CATEGORY_COLORS: Record<TouchpointCategory, string> = {
  Origin: '#6366F1',
  Transport: '#10B981',
  Customs: '#F59E0B',
  Destination: '#F97316'
}

// Calculate journey summary from touchpoints
export function calculateJourneySummary(touchpoints: JourneyTouchpoint[]) {
  const totalTime = touchpoints.reduce((sum, tp) => sum + tp.avgHours, 0)
  const byCategory = touchpoints.reduce((acc, tp) => {
    if (!acc[tp.category]) {
      acc[tp.category] = { hours: 0, count: 0 }
    }
    acc[tp.category].hours += tp.avgHours
    acc[tp.category].count += 1
    return acc
  }, {} as Record<string, { hours: number; count: number }>)

  return {
    totalTime,
    byCategory: Object.entries(byCategory).map(([category, data]) => ({
      category,
      hours: data.hours,
      percentage: (data.hours / totalTime) * 100,
      count: data.count
    })),
    optimizationPotential: touchpoints.reduce((sum, tp) => sum + tp.optimizationPotential, 0),
    criticalBottlenecks: touchpoints.filter(tp => tp.bottleneckRisk === 'CRITICAL').length
  }
}


