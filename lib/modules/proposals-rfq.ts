/**
 * Proposals & RFQ Module Definition
 * World-class proposal and quotation management system
 */

import { ModuleDefinition } from './registry'

export const proposalsRfqModule: ModuleDefinition = {
  id: 'proposals-rfq',
  name: 'Proposals & RFQ',
  description: 'Comprehensive proposal generation, RFQ management, and intelligent RFI processing covering all logistics services including warehousing, transportation, customs clearance, and supply chain. Features automated RFI → RFQ → Proposal pipeline with intelligent analysis and throughput tracking.',
  version: '2.0.0',
  category: 'tms',
  standalone: true,
  enabled: true,
  dependencies: [],
  components: [
    'components/proposals/ProposalsDashboard',
    'components/proposals/RFQManager',
    'components/proposals/ProposalBuilder',
    'components/proposals/ServiceCatalog',
    'components/proposals/JourneyAnalysis',
    'components/proposals/TrainSchedules'
  ],
  services: [
    'lib/services/proposals/RFIService',
    'lib/services/proposals/RFQService',
    'lib/services/proposals/ProposalGenerator',
    'lib/services/proposals/enhancedProposalService',
    'lib/services/proposals/enhancedExportService',
    'lib/services/proposals/proposalApprovalService',
    'lib/services/proposals/proposalBenchmarkingService',
    'lib/services/proposals/proposalLearningService',
    'lib/services/proposals/proposalCollaborationService',
    'lib/services/proposals/proposalTrackingService',
    'lib/services/proposals/contentBlockLibrary',
    'lib/services/proposals/proposalABTestingService',
    'lib/services/proposals/proposalFollowUpService',
    'lib/services/proposals/proposalRichMediaService',
    'lib/services/proposals/proposalInteractiveService',
    'lib/services/proposals/proposalSignatureService',
    'lib/services/proposals/templateMarketplaceService',
    'lib/services/proposals/proposalTranslationService',
    'lib/services/proposals/ServiceCatalogService',
    'lib/services/proposals/JourneyAnalysisService',
    'lib/services/proposals/initialize'
  ],
  
  routes: [
    // Main Dashboard
    { path: '/proposals', component: 'app/proposals/page', title: 'Proposals Dashboard', icon: 'ri-dashboard-3-line' },
    
    // RFI Management (NEW - Pre-Proposal & RFQ)
    { path: '/proposals/rfi', component: 'app/proposals/rfi/page', title: 'RFI Portal', icon: 'ri-file-search-line' },
    { path: '/proposals/rfi/new/wizard', component: 'app/proposals/rfi/new/wizard/page', title: 'New RFI', icon: 'ri-file-add-line' },
    { path: '/proposals/rfi/new', component: 'app/proposals/rfi/new/page', title: 'New RFI (Advanced)', icon: 'ri-settings-3-line' },
    { path: '/proposals/rfi/[id]', component: 'app/proposals/rfi/[id]/page', title: 'RFI Details', icon: 'ri-file-search-line' },
    { path: '/proposals/rfi/analytics', component: 'app/proposals/rfi/analytics/page', title: 'RFI Analytics', icon: 'ri-bar-chart-box-line' },
    
    // RFQ Management
    { path: '/proposals/rfq', component: 'app/proposals/rfq/page', title: 'RFQ Management', icon: 'ri-questionnaire-line' },
    { path: '/proposals/rfq/new', component: 'app/proposals/rfq/new/page', title: 'New RFQ', icon: 'ri-add-circle-line' },
    
    // Service Catalog
    { path: '/proposals/services', component: 'app/proposals/services/page', title: 'Service Catalog', icon: 'ri-service-line' },
    { path: '/proposals/rate-cards', component: 'app/proposals/rate-cards/page', title: 'Rate Cards', icon: 'ri-price-tag-3-line' },
    
    // Analytics & Reports
    { path: '/proposals/analytics', component: 'app/proposals/analytics/page', title: 'Analytics', icon: 'ri-bar-chart-box-line' },
    
    // Journey Analysis
    { path: '/proposals/journey', component: 'app/proposals/journey/page', title: 'Journey Analysis', icon: 'ri-route-line' },
    
    // Train Schedules
    { path: '/proposals/train-schedules', component: 'app/proposals/train-schedules/page', title: 'Train Schedules', icon: 'ri-train-line' },
    
    // Proposal Creation & Templates
    { path: '/proposals/new', component: 'app/proposals/new/page', title: 'Create Proposal (Legacy - Redirects)', icon: 'ri-file-add-line' },
    { path: '/proposals/universal/new', component: 'app/proposals/universal/new/page', title: 'Create Proposal', icon: 'ri-magic-line', badge: 'AI' },
    { path: '/proposals/templates', component: 'app/proposals/templates/page', title: 'Templates', icon: 'ri-layout-4-line' },
    
    // Advanced Features
    { path: '/proposals/compare', component: 'app/proposals/compare/page', title: 'Compare Proposals', icon: 'ri-file-compare-line' },
    { path: '/proposals/analytics/enhanced', component: 'app/proposals/analytics/enhanced/page', title: 'Enhanced Analytics', icon: 'ri-bar-chart-box-line' },
    { path: '/proposals/marketplace', component: 'app/proposals/marketplace/page', title: 'Template Marketplace', icon: 'ri-store-line' },
    { path: '/proposals/[id]/enhanced', component: 'app/proposals/[id]/enhanced/page', title: 'Proposal Details', icon: 'ri-file-paper-2-line' },
    
    // Client Portal
    { path: '/client/proposals/[id]', component: 'app/client/proposals/[id]/page', title: 'View Proposal', icon: 'ri-eye-line', clientOnly: true },
    { path: '/client/proposals/[id]/sign', component: 'app/client/proposals/[id]/sign/page', title: 'Sign Proposal', icon: 'ri-pen-nib-line', clientOnly: true },
  ],

  permissions: [
    'proposals:view',
    'proposals:create',
    'proposals:edit',
    'proposals:delete',
    'proposals:approve',
    'proposals:send',
    'rfq:view',
    'rfq:create',
    'rfq:respond',
    'rfq:assign',
    'services:view',
    'services:manage',
    'rates:view',
    'rates:manage',
    'analytics:view',
    'reports:generate',
    'settings:manage'
  ],

  dependencies: ['wms', 'tms', 'crm', 'compliance', 'finance', 'procurement', 'marketplace'],

  features: [
    // Core Features
    'rfi_management',
    'rfi_intelligent_analysis',
    'rfi_automation',
    'rfi_to_rfq_pipeline',
    'rfi_to_proposal_pipeline',
    'throughput_tracking',
    'rfq_management',
    'proposal_generation',
    'service_catalog',
    'rate_management',
    'template_builder',
    'digital_signatures',
    
    // Advanced Features
    'journey_analysis',
    'touchpoint_tracking',
    'bottleneck_detection',
    'optimization_recommendations',
    
    // Transport Features
    'train_schedules',
    'rail_network_management',
    'multimodal_routing',
    'cross_border_logistics',
    
    // Analytics & Intelligence
    'proposal_analytics',
    'conversion_tracking',
    'pipeline_management',
    'revenue_forecasting',
    'engagement_tracking',
    'section_analytics',
    'predictive_win_rate',
    'ab_testing',
    'benchmarking',
    'self_learning',
    
    // Collaboration & Workflow
    'real_time_collaboration',
    'comments_mentions',
    'version_control',
    'diff_comparison',
    'approval_workflows',
    'automated_follow_ups',
    
    // Content Management
    'content_block_library',
    'reusable_content',
    'content_approval',
    'content_search',
    
    // Integration
    'erp_integration',
    'crm_integration',
    'document_management',
    'email_integration',
    'esignature_integration',
    
    // Compliance & Security
    'audit_trail',
    'proposal_tracking',
    'engagement_heatmaps',
    'client_portal',
    'rich_media',
    'video_embedding',
    '3d_models',
    'interactive_charts',
    'interactive_calculators',
    'interactive_forms',
    'dynamic_pricing',
    'proposal_comparison',
    'predictive_analytics',
    'enhanced_analytics_dashboard',
    'template_marketplace',
    'template_sharing',
    'template_ratings',
    'multi_language',
    'auto_translation',
    'rtl_support'
  ],

  config: {
    defaultCurrency: 'SAR',
    supportedCurrencies: ['SAR', 'AED', 'KWD', 'USD', 'EUR', 'GBP'],
    proposalValidityDays: 30,
    rfqResponseDeadlineDays: 7,
    autoNumberingEnabled: true,
    proposalNumberPrefix: 'PROP',
    rfqNumberPrefix: 'RFQ',
    defaultPaymentTerms: 30,
    enableDigitalSignatures: true,
    enableDocumentTracking: true,
    maxAttachmentSize: 25 * 1024 * 1024, // 25MB
    supportedExportFormats: ['PDF', 'DOCX', 'XLSX', 'HTML']
  },

  integrations: [
    {
      name: 'Zoho CRM',
      type: 'crm',
      enabled: true,
      config: {
        syncCustomers: true,
        syncDeals: true,
        autoCreateDeal: true
      }
    },
    {
      name: 'ERPNext',
      type: 'erp',
      enabled: true,
      config: {
        syncQuotations: true,
        syncSalesOrders: true
      }
    },
    {
      name: 'DocuSign',
      type: 'signature',
      enabled: false,
      config: {
        enableEmbeddedSigning: true
      }
    }
  ]
}

// Service Categories for the Catalog
export const SERVICE_CATEGORIES = {
  WAREHOUSING: {
    name: 'Warehousing',
    icon: 'ri-building-4-line',
    color: '#6366F1',
    subCategories: [
      { id: 'STORAGE', name: 'Storage Services' },
      { id: 'HANDLING', name: 'Handling Services' },
      { id: 'PICK_PACK', name: 'Pick & Pack' },
      { id: 'INVENTORY_MANAGEMENT', name: 'Inventory Management' },
      { id: 'FULFILLMENT', name: 'Fulfillment' },
      { id: 'BONDED_WAREHOUSE', name: 'Bonded Warehouse' },
      { id: 'COLD_STORAGE', name: 'Cold Storage' },
      { id: 'HAZMAT_STORAGE', name: 'Hazmat Storage' }
    ]
  },
  TRANSPORTATION: {
    name: 'Transportation',
    icon: 'ri-truck-line',
    color: '#10B981',
    subCategories: [
      { id: 'FTL', name: 'Full Truck Load' },
      { id: 'LTL', name: 'Less Than Truck Load' },
      { id: 'LAST_MILE', name: 'Last Mile Delivery' },
      { id: 'CROSS_DOCK', name: 'Cross Docking' },
      { id: 'DEDICATED_FLEET', name: 'Dedicated Fleet' },
      { id: 'EXPRESS', name: 'Express Delivery' }
    ]
  },
  CUSTOMS_CLEARANCE: {
    name: 'Customs Clearance',
    icon: 'ri-shield-check-line',
    color: '#F59E0B',
    subCategories: [
      { id: 'IMPORT_CLEARANCE', name: 'Import Clearance' },
      { id: 'EXPORT_CLEARANCE', name: 'Export Clearance' },
      { id: 'TRANSIT', name: 'Transit Clearance' },
      { id: 'TEMPORARY_IMPORT', name: 'Temporary Import' },
      { id: 'DUTY_OPTIMIZATION', name: 'Duty Optimization' },
      { id: 'COMPLIANCE_REVIEW', name: 'Compliance Review' }
    ]
  },
  FREIGHT_FORWARDING: {
    name: 'Freight Forwarding',
    icon: 'ri-ship-line',
    color: '#3B82F6',
    subCategories: [
      { id: 'FCL', name: 'Full Container Load' },
      { id: 'LCL', name: 'Less Container Load' },
      { id: 'BREAKBULK', name: 'Breakbulk' },
      { id: 'RORO', name: 'Roll-on/Roll-off' },
      { id: 'AIR_CARGO', name: 'Air Cargo' },
      { id: 'CHARTER', name: 'Charter Services' }
    ]
  },
  RAIL_FREIGHT: {
    name: 'Rail Freight',
    icon: 'ri-train-line',
    color: '#8B5CF6',
    subCategories: [
      { id: 'CONTAINER_RAIL', name: 'Container by Rail' },
      { id: 'BULK_RAIL', name: 'Bulk Cargo Rail' },
      { id: 'INTERMODAL', name: 'Intermodal' },
      { id: 'CROSS_BORDER_RAIL', name: 'Cross-Border Rail' }
    ]
  },
  VALUE_ADDED: {
    name: 'Value Added Services',
    icon: 'ri-star-line',
    color: '#EC4899',
    subCategories: [
      { id: 'LABELING', name: 'Labeling' },
      { id: 'KITTING', name: 'Kitting' },
      { id: 'ASSEMBLY', name: 'Assembly' },
      { id: 'PACKAGING', name: 'Packaging' },
      { id: 'QUALITY_INSPECTION', name: 'Quality Inspection' }
    ]
  }
}

// Default Proposal Templates
export const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-warehousing',
    name: 'Warehousing Services Proposal',
    category: 'WAREHOUSING',
    sections: ['cover', 'executive_summary', 'company_profile', 'services', 'pricing', 'sla', 'terms']
  },
  {
    id: 'tpl-transportation',
    name: 'Transportation Services Proposal',
    category: 'TRANSPORTATION',
    sections: ['cover', 'executive_summary', 'routes', 'fleet', 'pricing', 'sla', 'terms']
  },
  {
    id: 'tpl-customs',
    name: 'Customs Clearance Proposal',
    category: 'CUSTOMS_CLEARANCE',
    sections: ['cover', 'executive_summary', 'services', 'compliance', 'pricing', 'terms']
  },
  {
    id: 'tpl-multimodal',
    name: 'Multimodal Logistics Proposal',
    category: 'MULTIMODAL',
    sections: ['cover', 'executive_summary', 'journey_analysis', 'services', 'routing', 'pricing', 'sla', 'terms']
  },
  {
    id: 'tpl-complete',
    name: 'Complete Supply Chain Proposal',
    category: 'SUPPLY_CHAIN',
    sections: ['cover', 'executive_summary', 'company_profile', 'services', 'implementation', 'pricing', 'value_proposition', 'case_studies', 'terms']
  }
]


