export interface ISOStats {
    documents?: number
    openNCRs?: number
    activeCAPAs?: number
    upcomingAudits?: number
    complianceScore?: number
    riskScore?: number
    trainingCompliance?: number
    overdueItems?: number
    overallCompliance?: number
    modules?: {
        documents: { total: number; active: number }
        ncr: { total: number; open: number }
        capa: { total: number; open: number }
        audit: { total: number; open: number }
        risk: { total: number; critical: number }
        training: { total: number; overdue: number }
    }
}

export interface TrendData {
    date: string
    value: number
    label: string
}

export interface ComplianceMetric {
    standard: string
    code: string
    score: number
    status: 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT'
    lastAudit?: string
    nextAudit?: string
    findings: number
}

export interface Alert {
    id: string
    type: 'WARNING' | 'ERROR' | 'INFO' | 'SUCCESS'
    title: string
    message: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    actionUrl?: string
    timestamp: Date
}

export interface AIInsight {
    id: string
    type: 'RECOMMENDATION' | 'PREDICTION' | 'ALERT' | 'OPPORTUNITY'
    title: string
    description: string
    confidence: number
    actionUrl?: string
    metadata?: Record<string, unknown>
}
