/**
 * QHSE Module Definition
 * Quality, Health, Safety, and Environment Management Module
 * 
 * Comprehensive QHSE management with incident tracking, inspections,
 * training compliance, environmental metrics, safety performance, and
 * regulatory compliance.
 */

import { ModuleDefinition } from './registry'

export const qhseModule: ModuleDefinition = {
  id: 'qhse',
  name: 'QHSE Management',
  description: 'Comprehensive Quality, Health, Safety, and Environment management with incident tracking, inspections, training compliance, environmental metrics, safety performance, and regulatory compliance',
  version: '1.0.0',
  category: 'qhse',
  standalone: true, // Can work independently
  dependencies: [], // No dependencies, but integrates with ISO-IMS, WMS, TMS
  routes: [
    { 
      path: '/qhse/dashboard', 
      component: 'app/qhse/dashboard/page', 
      title: 'QHSE Dashboard', 
      icon: 'ri-bar-chart-2-line',
      requiresAuth: true,
    },
    { 
      path: '/qhse/comprehensive', 
      component: 'app/qhse/comprehensive/page', 
      title: 'Comprehensive QHSE', 
      icon: 'ri-shield-star-line',
      requiresAuth: true,
    },
    { 
      path: '/qhse/incidents', 
      component: 'app/qhse/incidents/page', 
      title: 'Incident Management', 
      icon: 'ri-error-warning-line',
      requiresAuth: true,
    },
    { 
      path: '/qhse/inspections', 
      component: 'app/qhse/inspections/page', 
      title: 'Inspections & Audits', 
      icon: 'ri-clipboard-line',
      requiresAuth: true,
    },
    { 
      path: '/qhse/training', 
      component: 'app/qhse/training/page', 
      title: 'Training & Compliance', 
      icon: 'ri-graduation-cap-line',
      requiresAuth: true,
    },
    { 
      path: '/qhse/environmental', 
      component: 'app/qhse/environmental/page', 
      title: 'Environmental Metrics', 
      icon: 'ri-leaf-line',
      requiresAuth: true,
    },
    { 
      path: '/qhse/safety-metrics', 
      component: 'app/qhse/safety-metrics/page', 
      title: 'Safety Performance', 
      icon: 'ri-shield-check-line',
      requiresAuth: true,
    },
    { 
      path: '/qhse/regulatory', 
      component: 'app/qhse/regulatory/page', 
      title: 'Regulatory Compliance', 
      icon: 'ri-file-list-3-line',
      requiresAuth: true,
    },
    { 
      path: '/qhse/esg', 
      component: 'app/qhse/esg/page', 
      title: 'ESG Reporting', 
      icon: 'ri-global-line',
      requiresAuth: true,
    },
    { 
      path: '/qhse/analytics', 
      component: 'app/qhse/analytics/page', 
      title: 'QHSE Analytics', 
      icon: 'ri-line-chart-line',
      requiresAuth: true,
    },
    { 
      path: '/qhse/statistics', 
      component: 'app/qhse/statistics/page', 
      title: 'Smart QHSE Statistics Board', 
      icon: 'ri-bar-chart-box-line',
      requiresAuth: true,
    },
    { 
      path: '/qhse/calendar', 
      component: 'app/qhse/calendar/page', 
      title: 'QHSE Calendar', 
      icon: 'ri-calendar-line',
      requiresAuth: true,
    },
    { 
      path: '/qhse/approvals', 
      component: 'app/qhse/approvals/page', 
      title: 'Approvals', 
      icon: 'ri-check-double-line',
      requiresAuth: true,
    },
    { 
      path: '/qhse/bulk', 
      component: 'app/qhse/bulk/page', 
      title: 'Bulk Operations', 
      icon: 'ri-file-list-3-line',
      requiresAuth: true,
    },
    { 
      path: '/qhse/search', 
      component: 'app/qhse/search/page', 
      title: 'Advanced Search', 
      icon: 'ri-search-line',
      requiresAuth: true,
    },
  ],
  components: [
    'components/qhse/QHSEStatusBoard',
    'components/qhse/RealTimeQHSEDashboard',
    'components/qhse/ComprehensiveQHSEDashboard',
    'components/qhse/FoodSafetyDashboard',
    'components/qhse/SmartQHSEStatisticsBoard',
    'components/qhse/QHSERiskHeatmap',
    'components/qhse/QHSEGamificationPanel',
    'components/qhse/QHSEComplianceMap',
    'components/qhse/QHSESmartAlerts',
    'components/qhse/IncidentReportForm',
    'components/qhse/IncidentInvestigation',
    'components/qhse/InspectionChecklist',
    'components/qhse/TrainingCompliance',
    'components/qhse/EnvironmentalMetrics',
    'components/qhse/SafetyMetrics',
    'components/qhse/RegulatoryAuditCalendar',
    'components/qhse/ESGReporting',
    'components/qhse/QHSEAnalytics',
  ],
  services: [
    'lib/services/qhse/incidentService',
    'lib/services/qhse/inspectionService',
    'lib/services/qhse/trainingService',
    'lib/services/qhse/environmentalService',
    'lib/services/qhse/safetyMetricsService',
    'lib/services/qhse/regulatoryComplianceService',
    'lib/services/qhse/intelligentQHSEService',
    'lib/services/qhse/foodSafetyService',
    'lib/services/qhse/pharmaceuticalService',
    'lib/services/qhse/oilGasService',
    'lib/services/qhse/businessContinuityService',
    'lib/services/qhse/standards/comprehensiveStandardsFramework',
    'lib/services/qhse/ai/predictiveAnalyticsService',
    'lib/services/qhse/digitalTwinService',
  ],
  enabled: true,
  config: {
    // QHSE Configuration
    incidentReporting: {
      enabled: true,
      requireApproval: true,
      autoAssignInvestigator: false,
    },
    inspection: {
      enabled: true,
      requireChecklist: true,
      autoSchedule: false,
    },
    training: {
      enabled: true,
      requireCertification: true,
      expiryAlerts: true,
      expiryAlertDays: 30,
    },
    environmental: {
      enabled: true,
      trackCarbonFootprint: true,
      trackWaste: true,
      trackEnergy: true,
    },
    safety: {
      enabled: true,
      calculateTRIR: true,
      calculateLTIFR: true,
      benchmarkComparison: true,
    },
    regulatory: {
      enabled: true,
      oshaCompliance: true,
      riddorCompliance: true,
      isoCompliance: true,
    },
    esg: {
      enabled: true,
      frameworks: ['GRI', 'SASB', 'TCFD'],
    },
    intelligent: {
      enabled: true,
      riskPrediction: true,
      anomalyDetection: true,
      recommendations: true,
      benchmarks: true,
      gamification: true,
      smartAlerts: true,
    },
  },
}

