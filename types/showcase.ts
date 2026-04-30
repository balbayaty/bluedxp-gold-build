export interface SystemStatus {
  id: 'wms' | 'hazalyze' | 'aivision'
  name: string
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED'
  health: number // 0-100
  lastUpdate: Date
  metrics: {
    requests: number
    errors: number
    latency: number
  }
}

export interface ComplianceStandard {
  id: string
  name: string
  code: string // SBC801, NFPA-30, etc.
  category: 'BUILDING' | 'FIRE' | 'CHEMICAL' | 'SAFETY' | 'ENVIRONMENTAL'
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' | 'NOT_APPLICABLE'
  lastCheck: Date
  requirements: string[]
  violations?: string[]
}

export interface StakeholderView {
  id: string
  name: string
  role: string
  icon: string
  description: string
  features: string[]
  metrics: string[]
}

export interface LiveMetric {
  id: string
  label: string
  value: number | string
  unit?: string
  trend: 'up' | 'down' | 'neutral'
  change?: number
  system: 'wms' | 'hazalyze' | 'aivision' | 'all'
}



