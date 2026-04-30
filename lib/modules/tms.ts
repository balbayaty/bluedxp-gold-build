/**
 * Global Transportation & Logistics Management System (GTLS) Module
 * 
 * Comprehensive transportation management with multi-modal support,
 * customs integration, broker management, and enterprise document integration
 */

import type { ModuleDefinition } from './registry'

const secureRoute = <T extends { requiresAuth?: boolean }>(route: T): T => {
  return { ...route, requiresAuth: route.requiresAuth ?? true }
}

export const tmsModule: ModuleDefinition = {
  id: 'tms',
  name: 'Global Transportation & Logistics Management System',
  description: 'Comprehensive transportation management covering all modes, customs, brokers, and enterprise integrations',
  version: '1.0.0',
  category: 'tms',
  standalone: true, // Can work independently
  dependencies: ['wms'], // Depends on WMS for warehouse operations
  enabled: true,
  
  routes: [
    // Existing routes (preserved)
    secureRoute({ path: '/shipments', component: 'app/shipments/page', title: 'Shipments', icon: 'ri-truck-line' }),
    secureRoute({ path: '/tracking', component: 'app/tracking/page', title: 'Tracking', icon: 'ri-map-pin-line' }),
    secureRoute({ path: '/routes', component: 'app/routes/page', title: 'Routes', icon: 'ri-road-map-line' }),
    secureRoute({ path: '/pod', component: 'app/pod/page', title: 'Proof of Delivery', icon: 'ri-file-check-line' }),
    secureRoute({ path: '/freight', component: 'app/freight/page', title: 'Freight Management', icon: 'ri-money-dollar-circle-line' }),
    secureRoute({ path: '/carriers', component: 'app/carriers/page', title: 'Carriers', icon: 'ri-truck-fill' }),
    secureRoute({ path: '/load-planning', component: 'app/load-planning/page', title: 'Load Planning', icon: 'ri-stack-line' }),
    secureRoute({ path: '/load-design', component: 'app/load-design/page', title: 'Advanced Load Design', icon: 'ri-magic-line' }),
    secureRoute({ path: '/load-design/analytics', component: 'app/load-design/analytics/page', title: 'Load Analytics', icon: 'ri-bar-chart-box-line' }),
    
    // Comprehensive Transportation Routes
    secureRoute({ path: '/transportation', component: 'app/transportation/page', title: 'Transportation Dashboard', icon: 'ri-dashboard-3-line' }),
    secureRoute({ path: '/transportation/dashboard', component: 'app/transportation/dashboard/page', title: 'Intelligence Hub', icon: 'ri-dashboard-3-line' }),
    secureRoute({ path: '/transportation/route-comparison', component: 'app/transportation/route-comparison/page', title: 'Route Comparison', icon: 'ri-map-pin-line' }),
    secureRoute({ path: '/transportation/pricing', component: 'app/transportation/pricing/page', title: 'Pricing Intelligence', icon: 'ri-money-dollar-circle-line' }),
    secureRoute({ path: '/transportation/emissions', component: 'app/transportation/emissions/page', title: 'CO2 Emissions', icon: 'ri-leaf-line' }),
    secureRoute({ path: '/transportation/load-matching', component: 'app/transportation/load-matching/page', title: 'Load Matching', icon: 'ri-exchange-line' }),
    secureRoute({ path: '/transportation/iot', component: 'app/transportation/iot/page', title: 'IoT Monitoring', icon: 'ri-radar-line' }),
    secureRoute({ path: '/transportation/audit', component: 'app/transportation/audit/page', title: 'Freight Audit', icon: 'ri-file-check-line' }),
    secureRoute({ path: '/transportation/compliance', component: 'app/transportation/compliance/page', title: 'Compliance', icon: 'ri-shield-check-line' }),
    secureRoute({ path: '/transportation/blockchain', component: 'app/transportation/blockchain/page', title: 'Blockchain', icon: 'ri-links-line' }),
    secureRoute({ path: '/transportation/fleet', component: 'app/transportation/fleet/page', title: 'Fleet Management', icon: 'ri-truck-line' }),
    secureRoute({ path: '/transportation/realtime', component: 'app/transportation/realtime/page', title: 'Real-Time Updates', icon: 'ri-time-line' }),
    secureRoute({ path: '/transportation/scenario-simulation', component: 'app/transportation/scenario-simulation/page', title: 'Scenario Simulation', icon: 'ri-bar-chart-box-line' }),
    secureRoute({ path: '/transportation/network-modeling', component: 'app/transportation/network-modeling/page', title: 'Network Modeling', icon: 'ri-node-tree' }),
    secureRoute({ path: '/transportation/load-building', component: 'app/transportation/load-building/page', title: 'Load Building', icon: 'ri-stack-line' }),
    secureRoute({ path: '/transportation/carrier-portal', component: 'app/transportation/carrier-portal/page', title: 'Carrier Portal', icon: 'ri-user-star-line' }),
    secureRoute({ path: '/transportation/last-mile', component: 'app/transportation/last-mile/page', title: 'Last-Mile Optimization', icon: 'ri-map-pin-3-line' }),
    secureRoute({ path: '/transportation/digital-twins', component: 'app/transportation/digital-twins/page', title: 'Digital Twins', icon: 'ri-cpu-line' }),
    secureRoute({ path: '/transportation/edge-computing', component: 'app/transportation/edge-computing/page', title: 'Edge Computing', icon: 'ri-server-line' }),
    secureRoute({ path: '/transportation/multi-enterprise', component: 'app/transportation/multi-enterprise/page', title: 'Multi-Enterprise Network', icon: 'ri-network-line' }),
    secureRoute({ path: '/transportation/customs', component: 'app/transportation/customs/page', title: 'Customs Management', icon: 'ri-passport-line' }),
    secureRoute({ path: '/transportation/customs/declarations', component: 'app/transportation/customs/declarations/page', title: 'Customs Declarations', icon: 'ri-file-text-line' }),
    secureRoute({ path: '/transportation/customs/brokers', component: 'app/transportation/customs/brokers/page', title: 'Customs Brokers', icon: 'ri-user-star-line' }),
    secureRoute({ path: '/transportation/customs/authorities', component: 'app/transportation/customs/authorities/page', title: 'Customs Authorities', icon: 'ri-government-line' }),
    secureRoute({ path: '/transportation/multimodal', component: 'app/transportation/multimodal/page', title: 'Multi-Modal Transport', icon: 'ri-ship-line' }),
    secureRoute({ path: '/transportation/sea', component: 'app/transportation/sea/page', title: 'Sea Freight', icon: 'ri-ship-2-line' }),
    secureRoute({ path: '/transportation/air', component: 'app/transportation/air/page', title: 'Air Freight', icon: 'ri-flight-takeoff-line' }),
    secureRoute({ path: '/transportation/rail', component: 'app/transportation/rail/page', title: 'Rail Freight', icon: 'ri-train-line' }),
    secureRoute({ path: '/transportation/documents', component: 'app/transportation/documents/page', title: 'Transport Documents', icon: 'ri-file-list-3-line' }),
    secureRoute({ path: '/transportation/documents/enterprise', component: 'app/transportation/documents/enterprise/page', title: 'Enterprise Documents', icon: 'ri-folder-2-line' }),
    secureRoute({ path: '/transportation/ports', component: 'app/transportation/ports/page', title: 'Ports & Terminals', icon: 'ri-anchor-line' }),
    secureRoute({ path: '/transportation/insurance', component: 'app/transportation/insurance/page', title: 'Insurance', icon: 'ri-shield-check-line' }),
    secureRoute({ path: '/transportation/analytics', component: 'app/transportation/analytics/page', title: 'Transportation Analytics', icon: 'ri-bar-chart-box-line' }),
    secureRoute({ path: '/transportation/analytics/scenario', component: 'app/transportation/analytics/scenario/page', title: 'Scenario Analytics', icon: 'ri-bar-chart-box-line' }),
    secureRoute({ path: '/transportation/analytics/load-building', component: 'app/transportation/analytics/load-building/page', title: 'Load Building Analytics', icon: 'ri-bar-chart-box-line' }),
    secureRoute({ path: '/transportation/analytics/network', component: 'app/transportation/analytics/network/page', title: 'Network Analytics', icon: 'ri-bar-chart-box-line' }),
    secureRoute({ path: '/transportation/analytics/last-mile', component: 'app/transportation/analytics/last-mile/page', title: 'Last-Mile Analytics', icon: 'ri-bar-chart-box-line' }),
    secureRoute({ path: '/transportation/analytics/digital-twins', component: 'app/transportation/analytics/digital-twins/page', title: 'Digital Twins Analytics', icon: 'ri-bar-chart-box-line' }),
    secureRoute({ path: '/transportation/journey-analysis', component: 'app/transportation/journey-analysis/page', title: 'Journey Analysis', icon: 'ri-route-line' }),
    secureRoute({ path: '/transportation/intelligent-routing', component: 'app/transportation/intelligent-routing/page', title: 'Intelligent Routing', icon: 'ri-route-line' }),
    secureRoute({ path: '/transportation/exports', component: 'app/transportation/exports/page', title: 'Exports & Reports', icon: 'ri-file-text-line' }),
    secureRoute({ path: '/transportation/customization', component: 'app/transportation/customization/page', title: 'Customization', icon: 'ri-settings-3-line' }),
    secureRoute({ path: '/transportation/collaboration', component: 'app/transportation/collaboration/page', title: 'Collaboration', icon: 'ri-user-star-line' }),
    // Advanced Analytics (Migrated from flex-logistics-dashboard, sustainability-dashboard)
    secureRoute({ path: '/transportation/analytics/monte-carlo', component: 'app/transportation/analytics/monte-carlo/page', title: 'Monte Carlo Simulation', icon: 'ri-bar-chart-box-line' }),
    secureRoute({ path: '/transportation/analytics/bottleneck', component: 'app/transportation/analytics/bottleneck/page', title: 'Bottleneck Analysis', icon: 'ri-alert-line' }),
    secureRoute({ path: '/transportation/analytics/optimization', component: 'app/transportation/analytics/optimization/page', title: 'Optimization Center', icon: 'ri-settings-3-line' }),
    secureRoute({ path: '/transportation/analytics/sustainability', component: 'app/transportation/analytics/sustainability/page', title: 'Sustainability Command Center', icon: 'ri-leaf-line' }),
    secureRoute({ path: '/transportation/analytics/touchpoint-explorer', component: 'app/transportation/analytics/touchpoint-explorer/page', title: 'Touchpoint Explorer', icon: 'ri-search-line' }),
    secureRoute({ path: '/transportation/route-optimization', component: 'app/transportation/route-optimization/page', title: 'Route Optimization Dashboard', icon: 'ri-route-line' }),
    secureRoute({ path: '/transportation/integration', component: 'app/transportation/integration/page', title: 'Integration Settings', icon: 'ri-plug-line' }),
    secureRoute({ path: '/transportation/integration/zoho', component: 'app/transportation/integration/zoho/page', title: 'Zoho Integration', icon: 'ri-plug-line' }),
    secureRoute({ path: '/transportation/control-tower', component: 'app/transportation/control-tower/page', title: 'Control Tower', icon: 'ri-radar-line' }),
    secureRoute({ path: '/transportation/incidents', component: 'app/transportation/incidents/page', title: 'Incidents', icon: 'ri-alarm-warning-line' }),
    secureRoute({ path: '/transportation/quotes', component: 'app/transportation/quotes/page', title: 'Quotes', icon: 'ri-file-list-2-line' }),
    secureRoute({ path: '/transportation/payments', component: 'app/transportation/payments/page', title: 'Payments', icon: 'ri-bank-card-line' }),
    secureRoute({ path: '/transportation/proposals', component: 'app/transportation/proposals/page', title: 'Proposals & Reports', icon: 'ri-file-paper-2-line' }),
    secureRoute({ path: '/transportation/quantum', component: 'app/transportation/quantum/page', title: 'Quantum Logistics', icon: 'ri-atom-line' }),
    secureRoute({ path: '/transportation/psychology', component: 'app/transportation/psychology/page', title: 'Cargo Psychology', icon: 'ri-brain-line' }),
    secureRoute({ path: '/transportation/corridors', component: 'app/transportation/corridors/page', title: 'Corridor Intelligence', icon: 'ri-road-map-line' }),
    secureRoute({ path: '/transportation/geofences', component: 'app/transportation/geofences/page', title: 'Geofencing', icon: 'ri-map-pin-range-line' }),
    secureRoute({ path: '/transportation/cockpit', component: 'app/transportation/cockpit/page', title: 'Intelligence Cockpit', icon: 'ri-dashboard-3-fill' }),
    secureRoute({ path: '/transportation/accidents', component: 'app/transportation/accidents/page', title: 'Accident & Risk Mitigation', icon: 'ri-shield-flash-line' }),
    secureRoute({ path: '/transportation/capabilities', component: 'app/transportation/capabilities/page', title: 'Capabilities', icon: 'ri-tools-line' }),
    
    // Enhanced TMS Routes
    secureRoute({ path: '/tms', component: 'app/tms/page', title: 'TMS Dashboard', icon: 'ri-dashboard-3-line' }),
    secureRoute({ path: '/tms/jobs', component: 'app/tms/jobs/page', title: 'Transport Jobs', icon: 'ri-file-list-3-line' }),
    secureRoute({ path: '/tms/jobs/import', component: 'app/tms/jobs/import/page', title: 'Import CSV', icon: 'ri-upload-cloud-2-line' }),
    secureRoute({ path: '/tms/jobs/:id', component: 'app/tms/jobs/[id]/page', title: 'Job Details', icon: 'ri-file-text-line' }),
    secureRoute({ path: '/tms/lanes', component: 'app/tms/lanes/page', title: 'Lane Management', icon: 'ri-road-map-line' }),
    secureRoute({ path: '/tms/analytics', component: 'app/tms/analytics/page', title: 'TMS Analytics', icon: 'ri-bar-chart-box-line' }),
    secureRoute({ path: '/tms/detention', component: 'app/tms/detention/page', title: 'Detention Tracking', icon: 'ri-time-line' }),
    secureRoute({ path: '/tms/regulatory', component: 'app/tms/regulatory/page', title: 'Regulatory Integration', icon: 'ri-government-line' }),
    
    // NEW: Enhanced TMS Routes (Mind-Blowing UI)
    secureRoute({ path: '/transportation/control-tower-v2', component: 'app/transportation/control-tower-v2/page', title: 'Control Tower V2', icon: 'ri-radar-fill' }),
    secureRoute({ path: '/transportation/wizards/air-freight-booking', component: 'app/transportation/wizards/air-freight-booking/page', title: 'Air Freight Wizard', icon: 'ri-flight-takeoff-fill' }),
    secureRoute({ path: '/transportation/wizards/sea-freight-booking', component: 'app/transportation/wizards/sea-freight-booking/page', title: 'Sea Freight Wizard', icon: 'ri-ship-fill' }),
  ],
  
  components: [
    'components/transportation/ShipmentCard.tsx',
    'components/transportation/CustomsStatusBadge.tsx',
    'components/transportation/BrokerSelector.tsx',
    'components/transportation/MultiModalSelector.tsx',
    'components/transportation/DocumentUploader.tsx',
    'components/transportation/CarrierPerformance.tsx',
    'components/transportation/RouteComparisonPanel.tsx',
    'components/transportation/PricingIntelligencePanel.tsx',
    'components/transportation/CO2EmissionsTracker.tsx',
    'components/transportation/LoadMatchingPanel.tsx',
    'components/transportation/IoTMonitoringPanel.tsx',
    'components/transportation/FreightAuditPanel.tsx',
    'components/transportation/ComplianceStatusPanel.tsx',
    'components/transportation/TransportationDashboard.tsx',
    'components/transportation/GraphicalPlanningInterface.tsx',
    // Advanced Analytics Components (Migrated)
    'components/analytics/MonteCarloSimulation',
    'components/analytics/BottleneckAnalysis',
    'components/analytics/OptimizationCenter',
    'components/analytics/SustainabilityCommandCenter',
    'components/analytics/TouchpointExplorer',
    'components/transportation/RouteOptimizationDashboard',
    // Quantum State Components
    'components/quantum-state/QuantumStateIndicator.tsx',
    // Cargo Psychology Components
    'components/cargo-psychology/PsychologyStateIndicator.tsx',
    // Arabic NLP Components
    'components/arabic-nlp/ArabicNLPAnalysisCard.tsx',
  ],
  
  services: [
    'lib/adapters/transportation',
    'lib/services/transportation',
    'lib/services/transportation/shipmentService.ts',
    'lib/services/transportation/customsService.ts',
    'lib/services/transportation/brokerService.ts',
    'lib/services/transportation/documentService.ts',
    'lib/services/transportation/initialize.ts',
    'lib/adapters/government/elmRabetAdapter.ts',
    'lib/services/transportation/scenarioSimulationService.ts',
    'lib/services/transportation/networkModelingService.ts',
    'lib/services/transportation/advancedLoadBuildingService.ts',
    'lib/services/transportation/carrierCollaborationService.ts',
    'lib/services/transportation/lastMileOptimizationService.ts',
    'lib/services/transportation/digitalTwinsService.ts',
    'lib/services/transportation/edgeComputingService.ts',
    'lib/services/transportation/multiEnterpriseNetworkService.ts',
    
    // NEW: Mode-Specific Services (Complete Business Logic)
    'lib/services/transportation/modes/airFreightService.ts',
    'lib/services/transportation/modes/seaFreightService.ts',
    'lib/services/transportation/modes/multimodalOrchestrator.ts',
    
    // NEW: Cross-Border Services (Enterprise-Grade Customs Automation)
    'lib/services/transportation/cross-border/crossBorderOrchestrationEngine.ts',
    
    // NEW: State Machine (50+ Automations)
    'lib/services/transportation/stateMachine/shipmentStateMachine.ts',
    
    // Advanced Analytics Services (Migrated from flex-logistics-dashboard, sustainability-dashboard)
    'lib/services/analytics/monteCarloSimulationService',
    'lib/services/analytics/bottleneckAnalysisService',
    'lib/services/analytics/optimizationCenterService',
    'lib/services/analytics/sustainabilityCommandCenterService',
    'lib/services/analytics/touchpointExplorerService',
    // Schrödinger's Truck Quantum Logistics Service
    'lib/services/schrodingers-truck',
    // Cargo Psychology Service
    'lib/services/cargo-psychology',
    // Arabic-Native NLP Service
    'lib/services/nlp/arabic-nlp',
  ],
  
  config: {
    // Integration settings
    integrations: {
      standalone: {
        enabled: true,
        type: 'standalone',
      },
      zoho: {
        enabled: false,
        type: 'zoho',
        apiUrl: process.env.ZOHO_API_URL,
        clientId: process.env.ZOHO_CLIENT_ID,
        clientSecret: process.env.ZOHO_CLIENT_SECRET,
        refreshToken: process.env.ZOHO_REFRESH_TOKEN,
        organizationId: process.env.ZOHO_ORGANIZATION_ID,
      },
      // Add more integrations as needed
    },
    
    // Customs settings
    customs: {
      defaultBroker: null,
      autoAssignBroker: false,
      clearanceSLA: 72, // hours
      documentRetentionDays: 365,
    },
    
    // Document management
    documents: {
      enterpriseIntegration: {
        enabled: false,
        provider: 'sharepoint', // sharepoint, documentum, filenet, etc.
        apiUrl: process.env.DOCUMENT_API_URL,
        apiKey: process.env.DOCUMENT_API_KEY,
      },
    },
    
    // Tracking settings
    tracking: {
      updateInterval: 30000, // 30 seconds
      enableRealTime: true,
    },
  },
}


