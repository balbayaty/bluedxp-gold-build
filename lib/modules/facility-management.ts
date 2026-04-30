/**
 * Facility Management Module Definition
 * 
 * The world's most comprehensive, advanced, and intelligent Facility Management System
 * Features:
 * - Asset Management (EAM)
 * - Maintenance Management (CMMS)
 * - Space Management (CAFM)
 * - Energy & Sustainability
 * - IoT & Smart Buildings
 * - BIM Integration
 * - Digital Twin
 * - Licensing & Regulatory Compliance (Civil Defense, Abalady, etc.)
 * - CAD/Drawing Management
 * - AI-Powered Predictive Maintenance
 * - 400+ Integration Capability
 */

import { ModuleDefinition } from './registry'

export const facilityManagementModule: ModuleDefinition = {
  id: 'facility-management',
  name: 'Facility Management System',
  description: 'Comprehensive IWMS with Asset, Maintenance, Space, Energy, IoT, BIM, Digital Twin, Licensing, and Regulatory Compliance',
  version: '1.0.0',
  category: 'facility-management',
  standalone: true, // Can work independently
  dependencies: [], // Optional: ['wms', 'qhse'] for enhanced cross-module features
  routes: [
    // Dashboard
    { 
      path: '/facility/dashboard', 
      component: 'app/facility/dashboard/page', 
      title: 'Facility Dashboard', 
      icon: 'ri-dashboard-line',
      requiresAuth: true,
    },
    
    // Asset Management
    { 
      path: '/facility/assets', 
      component: 'app/facility/assets/page', 
      title: 'Asset Management', 
      icon: 'ri-tools-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/assets/:id', 
      component: 'app/facility/assets/[id]/page', 
      title: 'Asset Details', 
      icon: 'ri-tools-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/assets/:id/maintenance', 
      component: 'app/facility/assets/[id]/maintenance/page', 
      title: 'Asset Maintenance', 
      icon: 'ri-wrench-line',
      requiresAuth: true,
    },
    
    // Maintenance Management
    { 
      path: '/facility/maintenance', 
      component: 'app/facility/maintenance/page', 
      title: 'Maintenance Management', 
      icon: 'ri-wrench-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/work-orders', 
      component: 'app/facility/work-orders/page', 
      title: 'Work Orders', 
      icon: 'ri-file-list-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/work-orders/:id', 
      component: 'app/facility/work-orders/[id]/page', 
      title: 'Work Order Details', 
      icon: 'ri-file-list-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/predictive-maintenance', 
      component: 'app/facility/predictive-maintenance/page', 
      title: 'Predictive Maintenance', 
      icon: 'ri-brain-line',
      requiresAuth: true,
    },
    
    // Space Management
    { 
      path: '/facility/spaces', 
      component: 'app/facility/spaces/page', 
      title: 'Space Management', 
      icon: 'ri-layout-grid-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/floor-plans', 
      component: 'app/facility/floor-plans/page', 
      title: 'Floor Plans', 
      icon: 'ri-map-pin-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/move-management', 
      component: 'app/facility/move-management/page', 
      title: 'Move Management', 
      icon: 'ri-arrow-left-right-line',
      requiresAuth: true,
    },
    
    // Energy & Sustainability
    { 
      path: '/facility/energy', 
      component: 'app/facility/energy/page', 
      title: 'Energy Management', 
      icon: 'ri-flashlight-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/sustainability', 
      component: 'app/facility/sustainability/page', 
      title: 'Sustainability & ESG', 
      icon: 'ri-leaf-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/carbon-footprint', 
      component: 'app/facility/carbon-footprint/page', 
      title: 'Carbon Footprint', 
      icon: 'ri-global-line',
      requiresAuth: true,
    },
    
    // Utility Bills Management
    { 
      path: '/facility/utility-bills', 
      component: 'app/facility/utility-bills/page', 
      title: 'Utility Bills', 
      icon: 'ri-file-bill-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/utility-bills/:id', 
      component: 'app/facility/utility-bills/[id]/page', 
      title: 'Bill Details', 
      icon: 'ri-file-bill-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/utility-bills/analytics', 
      component: 'app/facility/utility-bills/analytics/page', 
      title: 'Bill Analytics', 
      icon: 'ri-bar-chart-box-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/utility-bills/comparison', 
      component: 'app/facility/utility-bills/comparison/page', 
      title: 'Bill Comparison', 
      icon: 'ri-compass-3-line',
      requiresAuth: true,
    },
    
    // IoT & Smart Buildings
    { 
      path: '/facility/iot', 
      component: 'app/facility/iot/page', 
      title: 'IoT Devices', 
      icon: 'ri-sensor-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/smart-buildings', 
      component: 'app/facility/smart-buildings/page', 
      title: 'Smart Buildings', 
      icon: 'ri-home-smile-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/building-automation', 
      component: 'app/facility/building-automation/page', 
      title: 'Building Automation', 
      icon: 'ri-settings-3-line',
      requiresAuth: true,
    },
    
    // BIM & Digital Twin
    { 
      path: '/facility/bim', 
      component: 'app/facility/bim/page', 
      title: 'BIM Marketplace', 
      icon: 'ri-3d-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/bim/:id', 
      component: 'app/facility/bim/[id]/page', 
      title: 'BIM Viewer', 
      icon: 'ri-3d-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/digital-twin', 
      component: 'app/facility/digital-twin/page', 
      title: 'Digital Twin', 
      icon: 'ri-magic-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/digital-twin/:id', 
      component: 'app/facility/digital-twin/[id]/page', 
      title: 'Digital Twin Viewer', 
      icon: 'ri-magic-line',
      requiresAuth: true,
    },
    
    // CAD & Drawings
    { 
      path: '/facility/cad', 
      component: 'app/facility/cad/page', 
      title: 'CAD & Drawings', 
      icon: 'ri-file-draw-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/cad/:id', 
      component: 'app/facility/cad/[id]/page', 
      title: 'Drawing Viewer', 
      icon: 'ri-file-draw-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/specifications', 
      component: 'app/facility/specifications/page', 
      title: 'Specifications', 
      icon: 'ri-file-text-line',
      requiresAuth: true,
    },
    
    // Licensing & Regulatory Compliance
    { 
      path: '/facility/licenses', 
      component: 'app/facility/licenses/page', 
      title: 'Licenses & Permits', 
      icon: 'ri-file-paper-2-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/regulatory', 
      component: 'app/facility/regulatory/page', 
      title: 'Regulatory Compliance', 
      icon: 'ri-shield-check-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/civil-defense', 
      component: 'app/facility/civil-defense/page', 
      title: 'Civil Defense', 
      icon: 'ri-fire-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/abalady', 
      component: 'app/facility/abalady/page', 
      title: 'Abalady Integration', 
      icon: 'ri-government-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/compliance-calendar', 
      component: 'app/facility/compliance-calendar/page', 
      title: 'Compliance Calendar', 
      icon: 'ri-calendar-check-line',
      requiresAuth: true,
    },
    
    // Lease & Real Estate
    { 
      path: '/facility/leases', 
      component: 'app/facility/leases/page', 
      title: 'Lease Management', 
      icon: 'ri-file-paper-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/real-estate', 
      component: 'app/facility/real-estate/page', 
      title: 'Real Estate Portfolio', 
      icon: 'ri-building-2-line',
      requiresAuth: true,
    },
    
    // Vendors & Contracts
    { 
      path: '/facility/vendors', 
      component: 'app/facility/vendors/page', 
      title: 'Vendors & Contractors', 
      icon: 'ri-user-star-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/contracts', 
      component: 'app/facility/contracts/page', 
      title: 'Contracts', 
      icon: 'ri-file-contract-line',
      requiresAuth: true,
    },
    
    // Inventory & Spare Parts
    { 
      path: '/facility/inventory', 
      component: 'app/facility/inventory/page', 
      title: 'Spare Parts Inventory', 
      icon: 'ri-stack-line',
      requiresAuth: true,
    },
    
    // Analytics & Reports
    { 
      path: '/facility/analytics', 
      component: 'app/facility/analytics/page', 
      title: 'Analytics', 
      icon: 'ri-bar-chart-line',
      requiresAuth: true,
    },
    { 
      path: '/facility/reports', 
      component: 'app/facility/reports/page', 
      title: 'Reports', 
      icon: 'ri-file-chart-line',
      requiresAuth: true,
    },
  ],
  components: [
    'components/facility/FacilityDashboard',
    'components/facility/AssetManager',
    'components/facility/AssetDetails',
    'components/facility/MaintenanceManager',
    'components/facility/WorkOrderManager',
    'components/facility/PredictiveMaintenance',
    'components/facility/SpaceManager',
    'components/facility/FloorPlanViewer',
    'components/facility/EnergyManager',
    'components/facility/SustainabilityDashboard',
    'components/facility/IoTDeviceManager',
    'components/facility/SmartBuildingDashboard',
    'components/facility/BIMViewer',
    'components/bim/BIM3DViewer',
    'components/bim/MarketplaceTab',
    'components/bim/CollaborationTab',
    'components/bim/AnalysisTab',
    'components/bim/DigitalTwinTab',
    'components/bim/ARVRTab',
    'components/bim/MarketplaceListingModal',
    'components/facility/DigitalTwinViewer',
    'components/facility/CADViewer',
    'components/facility/DrawingManager',
    'components/facility/LicenseManager',
    'components/facility/RegulatoryCompliance',
    'components/facility/CivilDefenseIntegration',
    'components/facility/AbaladyIntegration',
    'components/facility/ComplianceCalendar',
    'components/facility/LeaseManager',
    'components/facility/VendorManager',
    'components/facility/ContractManager',
    'components/facility/InventoryManager',
    'components/facility/FacilityAnalytics',
    'components/facility/FacilityReports',
  ],
  services: [
    'lib/services/facility/asset/assetService',
    'lib/services/facility/asset/assetLifecycleService',
    'lib/services/facility/maintenance/maintenanceService',
    'lib/services/facility/maintenance/predictiveMaintenanceService',
    'lib/services/facility/maintenance/workOrderService',
    'lib/services/facility/space/spaceService',
    'lib/services/facility/space/spaceUtilizationService',
    'lib/services/facility/energy/energyService',
    'lib/services/facility/energy/sustainabilityService',
    'lib/services/facility/iot/facilityIoTService',
    'lib/services/facility/iot/buildingAutomationService',
    'lib/services/facility/bim/bimService',
    'lib/services/facility/bim/bimVisualizationService',
    'lib/services/facility/bim/bimMarketplaceService',
    'lib/services/facility/bim/bimAIAnalysisService',
    'lib/services/facility/bim/bimCollaborationService',
    'lib/services/facility/digitalTwin/digitalTwinService',
    'lib/services/facility/cad/cadDocumentService',
    'lib/services/facility/integration/facilityIntegrationService',
    'lib/services/facility/integration/warehouseIntegrationService',
    'lib/services/facility/cad/drawingService',
    'lib/services/facility/licensing/licenseService',
    'lib/services/facility/licensing/regulatoryService',
    'lib/services/facility/licensing/civilDefenseService',
    'lib/services/facility/licensing/abaladyService',
    'lib/services/facility/lease/leaseService',
    'lib/services/facility/vendor/vendorService',
    'lib/services/facility/compliance/facilityComplianceService',
    'lib/services/facility/analytics/facilityAnalyticsService',
    'lib/services/facility/analytics/reportingService',
  ],
  enabled: true,
  config: {
    // Asset Management
    assetManagement: {
      enabled: true,
      lifecycleTracking: true,
      depreciationCalculation: true,
      warrantyTracking: true,
    },
    // Maintenance Management
    maintenanceManagement: {
      enabled: true,
      preventiveMaintenance: true,
      predictiveMaintenance: true,
      aiPoweredPredictions: true,
    },
    // Space Management
    spaceManagement: {
      enabled: true,
      floorPlanSupport: true,
      moveManagement: true,
      utilizationAnalytics: true,
    },
    // Energy Management
    energyManagement: {
      enabled: true,
      realTimeMonitoring: true,
      carbonFootprintTracking: true,
      sustainabilityReporting: true,
    },
    // IoT Integration
    iotIntegration: {
      enabled: true,
      deviceManagement: true,
      buildingAutomation: true,
      realTimeMonitoring: true,
    },
    // BIM Integration
    bimIntegration: {
      enabled: true,
      modelImport: true,
      visualization: true,
      dataLinking: true,
      marketplace: true,
      collaboration: true,
      aiAnalysis: true,
      digitalTwin: true,
      arVr: true,
    },
    // Digital Twin
    digitalTwin: {
      enabled: true,
      realTimeSync: true,
      simulations: true,
      optimization: true,
    },
    // CAD & Drawings
    cadManagement: {
      enabled: true,
      autocadSupport: true,
      drawingStorage: true,
      specificationManagement: true,
    },
    // Licensing & Regulatory
    licensing: {
      enabled: true,
      licenseTracking: true,
      renewalAlerts: true,
      complianceMonitoring: true,
    },
    // Regulatory Integrations
    regulatoryIntegrations: {
      civilDefense: {
        enabled: true,
        apiIntegration: true,
        autoSubmission: true,
      },
      abalady: {
        enabled: true,
        apiIntegration: true,
        autoSubmission: true,
      },
    },
    // AI & ML
    ai: {
      enabled: true,
      predictiveMaintenance: true,
      energyOptimization: true,
      spaceOptimization: true,
      anomalyDetection: true,
    },
    // Integration Capability
    integrations: {
      targetCount: 400,
      apiFirst: true,
      webhookSupport: true,
      eventDriven: true,
    },
  },
}

