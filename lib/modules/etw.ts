/**
 * Flex Smart e-Waybill (ETW) Module
 * 
 * Production-grade, evidence-grade e-Waybill system for:
 * - Local (within city) transport
 * - Inter-city domestic (KSA)
 * - Cross-border shipments
 * - Multimodal legs (Road/Sea/Rail/Air combinations)
 * - Compliance and permits workflow
 * - Risk & congestion intelligence and ETA/detention exposure
 * - Evidence-grade chain-of-custody event timeline
 * - World-class QR verification system
 */

import type { ModuleDefinition } from './registry'

const secureRoute = <T extends { requiresAuth?: boolean }>(route: T): T => {
  return { ...route, requiresAuth: route.requiresAuth ?? true }
}

export const etwModule: ModuleDefinition = {
  id: 'etw',
  name: 'Flex Smart e-Waybill (ETW)',
  description: 'Production-grade e-Waybill system with evidence-grade chain-of-custody, intelligence service, and world-class QR verification',
  version: '1.0.0',
  category: 'transportation',
  standalone: true,
  dependencies: ['tms', 'msds', 'compliance'], // Depends on TMS, MSDS (Hazalyze), and Compliance modules
  enabled: true,
  
  routes: [
    // Main ETW routes
    secureRoute({ 
      path: '/etw', 
      component: 'app/etw/page', 
      title: 'e-Waybills', 
      icon: 'ri-file-paper-2-line',
      roles: ['SYSTEM_ADMIN', 'TRANSPORT_GENERAL_MANAGER', 'OPERATIONS_MANAGER', 'CUSTOMER_ACCOUNT_MANAGER', 'CUSTOMER_USER', 'CUSTOMER_ADMIN', 'QUALITY_MANAGER']
    }),
    secureRoute({ 
      path: '/etw/create', 
      component: 'app/etw/create/page', 
      title: 'Create e-Waybill', 
      icon: 'ri-add-circle-line',
      roles: ['SYSTEM_ADMIN', 'TRANSPORT_GENERAL_MANAGER', 'OPERATIONS_MANAGER']
    }),
    secureRoute({ 
      path: '/etw/[id]', 
      component: 'app/etw/[id]/page', 
      title: 'e-Waybill Details', 
      icon: 'ri-file-text-line',
      roles: ['SYSTEM_ADMIN', 'TRANSPORT_GENERAL_MANAGER', 'OPERATIONS_MANAGER', 'CUSTOMER_ACCOUNT_MANAGER', 'CUSTOMER_USER', 'CUSTOMER_ADMIN', 'QUALITY_MANAGER']
    }),
    secureRoute({ 
      path: '/etw/[id]/edit', 
      component: 'app/etw/[id]/edit/page', 
      title: 'Edit e-Waybill', 
      icon: 'ri-edit-line',
      roles: ['SYSTEM_ADMIN', 'TRANSPORT_GENERAL_MANAGER', 'OPERATIONS_MANAGER']
    }),
    
    // Verification route (public, but secured by token)
    { 
      path: '/v/[token]', 
      component: 'app/etw/verify/[token]/page', 
      title: 'e-Waybill Verification', 
      icon: 'ri-shield-check-line',
      requiresAuth: false // Public verification endpoint
    },
    
    // Print view
    secureRoute({ 
      path: '/etw/[id]/print', 
      component: 'app/etw/[id]/print/page', 
      title: 'Print e-Waybill', 
      icon: 'ri-printer-line',
      roles: ['SYSTEM_ADMIN', 'TRANSPORT_GENERAL_MANAGER', 'OPERATIONS_MANAGER', 'CUSTOMER_ACCOUNT_MANAGER', 'CUSTOMER_USER', 'CUSTOMER_ADMIN']
    }),
  ],
  
  components: [
    'components/etw/ETWList.tsx',
    'components/etw/ETWForm.tsx',
    'components/etw/ETWView.tsx',
    'components/etw/ETWTimeline.tsx',
    'components/etw/ETWRiskPanel.tsx',
    'components/etw/ETWPermitsPanel.tsx',
    'components/etw/ETWVerificationBlock.tsx',
    'components/etw/ETWPrintView.tsx',
    'components/etw/ETWCustomerView.tsx',
    'components/etw/ETWIntelligencePanel.tsx',
    'components/etw/ETWDeliveryAcknowledgment.tsx',
    'components/etw/ETWAttachments.tsx',
  ],
  
  services: [
    'lib/services/etw/etwService.ts',
    'lib/services/etw/rulesEngine.ts',
    'lib/services/etw/eventService.ts',
    'lib/services/etw/permitService.ts',
    'lib/services/etw/intelligence/',
    'lib/services/etw/qrVerificationService.ts',
    'lib/services/etw/pdfService.ts',
    'lib/services/etw/integrationService.ts',
  ],
  
  apis: [
    {
      endpoint: '/api/etw',
      method: 'GET',
      description: 'List e-Waybills with filtering',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'TRANSPORT_GENERAL_MANAGER', 'OPERATIONS_MANAGER', 'CUSTOMER_ACCOUNT_MANAGER', 'CUSTOMER_USER', 'CUSTOMER_ADMIN'],
    },
    {
      endpoint: '/api/etw',
      method: 'POST',
      description: 'Create new e-Waybill',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'TRANSPORT_GENERAL_MANAGER', 'OPERATIONS_MANAGER'],
    },
    {
      endpoint: '/api/etw/[id]',
      method: 'GET',
      description: 'Get e-Waybill details',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'TRANSPORT_GENERAL_MANAGER', 'OPERATIONS_MANAGER', 'CUSTOMER_ACCOUNT_MANAGER', 'CUSTOMER_USER', 'CUSTOMER_ADMIN'],
    },
    {
      endpoint: '/api/etw/[id]',
      method: 'PUT',
      description: 'Update e-Waybill',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'TRANSPORT_GENERAL_MANAGER', 'OPERATIONS_MANAGER'],
    },
    {
      endpoint: '/api/etw/[id]/events',
      method: 'GET',
      description: 'Get chain-of-custody events',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'TRANSPORT_GENERAL_MANAGER', 'OPERATIONS_MANAGER', 'CUSTOMER_ACCOUNT_MANAGER', 'CUSTOMER_USER', 'CUSTOMER_ADMIN'],
    },
    {
      endpoint: '/api/etw/[id]/verify',
      method: 'POST',
      description: 'Verify e-Waybill document',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'TRANSPORT_GENERAL_MANAGER', 'OPERATIONS_MANAGER', 'CUSTOMER_ACCOUNT_MANAGER', 'CUSTOMER_USER', 'CUSTOMER_ADMIN'],
    },
    {
      endpoint: '/api/etw/[id]/export/pdf',
      method: 'GET',
      description: 'Export e-Waybill as PDF',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'TRANSPORT_GENERAL_MANAGER', 'OPERATIONS_MANAGER', 'CUSTOMER_ACCOUNT_MANAGER', 'CUSTOMER_USER', 'CUSTOMER_ADMIN'],
    },
    {
      endpoint: '/api/etw/[id]/export/proof-bundle',
      method: 'GET',
      description: 'Export proof bundle (evidence packet)',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'TRANSPORT_GENERAL_MANAGER', 'OPERATIONS_MANAGER'],
    },
    {
      endpoint: '/api/etw/[id]/intelligence',
      method: 'GET',
      description: 'Get intelligence (ETA, detention, congestion)',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'TRANSPORT_GENERAL_MANAGER', 'OPERATIONS_MANAGER', 'CUSTOMER_ACCOUNT_MANAGER', 'CUSTOMER_USER', 'CUSTOMER_ADMIN'],
    },
  ],
  
  settings: [
    {
      key: 'etw.autoGenerateQR',
      value: true,
      type: 'boolean',
      description: 'Automatically generate QR code when ETW is created',
      required: false,
      default: true,
    },
    {
      key: 'etw.qrExpirationDays',
      value: 90,
      type: 'number',
      description: 'QR token expiration in days',
      required: false,
      default: 90,
    },
    {
      key: 'etw.requireMSDSForHazardous',
      value: true,
      type: 'boolean',
      description: 'Require MSDS for hazardous cargo',
      required: false,
      default: true,
    },
    {
      key: 'etw.enableIntelligence',
      value: true,
      type: 'boolean',
      description: 'Enable intelligence service (ETA, detention, congestion)',
      required: false,
      default: true,
    },
    {
      key: 'etw.intelligenceSources',
      value: ['historical', 'real-time', 'predictive'],
      type: 'array',
      description: 'Intelligence data sources to use',
      required: false,
      default: ['historical', 'real-time', 'predictive'],
    },
  ],
  
  featureFlags: {
    'etw.multimodal': true,
    'etw.intelligence': true,
    'etw.qrVerification': true,
    'etw.pdfExport': true,
    'etw.proofBundle': true,
    'etw.whatsappIntegration': false,
    'etw.aiInsights': false, // Future: AI-powered insights
  },
}

/**
 * Initialize ETW Module
 * Sets up event handlers and cross-module integrations
 */
export async function initializeETWModule(tenantId: string): Promise<void> {
  try {
    console.log('🚀 Initializing ETW Module...')

    // Subscribe to ETW events for cross-module integration
    await subscribeToETWEvents(tenantId)
    
    // Subscribe to related module events
    await subscribeToRelatedModuleEvents(tenantId)
    
    console.log('✅ ETW Module initialized successfully')
  } catch (error) {
    console.error('❌ Error initializing ETW Module:', error)
    throw error
  }
}

/**
 * Subscribe to ETW events for cross-module integration
 */
async function subscribeToETWEvents(tenantId: string): Promise<void> {
  const { eventBus } = await import('@/lib/services/event-store')
  
  // ETW created - notify TMS, update intelligence
  eventBus.subscribe('etw.created', async (event: any) => {
    console.log('ETW created:', event.payload?.etwId)
    // Can trigger TMS shipment linking, intelligence updates, etc.
  })
  
  // ETW updated - update related systems
  eventBus.subscribe('etw.updated', async (event: any) => {
    console.log('ETW updated:', event.payload?.etwId)
    // Can trigger SLA/KPI updates, intelligence recalculation, etc.
  })
  
  // ETW status changed - update tracking, notifications
  eventBus.subscribe('etw.status.changed', async (event: any) => {
    console.log('ETW status changed:', event.payload?.etwId, event.payload?.status)
    // Can trigger notifications, SLA tracking, etc.
  })
  
  // ETW delivered - finalize tracking, update KPIs
  eventBus.subscribe('etw.delivered', async (event: any) => {
    console.log('ETW delivered:', event.payload?.etwId)
    // Can trigger final SLA/KPI updates, customer notifications, etc.
  })
  
  // ETW exception - trigger alerts, notifications
  eventBus.subscribe('etw.exception', async (event: any) => {
    console.log('ETW exception:', event.payload?.etwId, event.payload?.exceptionType)
    // Can trigger alerts, notifications, escalation workflows, etc.
  })
  
  // ETW event added - update chain-of-custody
  eventBus.subscribe('etw.event.added', async (event: any) => {
    console.log('ETW event added:', event.payload?.etwId, event.payload?.eventType)
    // Can trigger evidence updates, intelligence recalculation, etc.
  })
}

/**
 * Subscribe to related module events that affect ETW
 */
async function subscribeToRelatedModuleEvents(tenantId: string): Promise<void> {
  const { eventBus } = await import('@/lib/services/event-store')
  
  // TMS shipment events - can auto-link to ETW
  eventBus.subscribe('tms.shipment.created', async (event: any) => {
    console.log('TMS shipment created, can link to ETW:', event.payload?.shipmentId)
    // Can auto-create or link ETW to shipment
  })
  
  // MSDS events - update ETW compliance
  eventBus.subscribe('msds.updated', async (event: any) => {
    console.log('MSDS updated, may affect ETW compliance:', event.payload?.msdsId)
    // Can update ETW compliance flags if MSDS is linked
  })
  
  // Customs events - update ETW status
  eventBus.subscribe('customs.cleared', async (event: any) => {
    console.log('Customs cleared, can update ETW status:', event.payload)
    // Can update ETW status to CUSTOMS_CLEARED
  })
  
  // Geofence events - update ETW location tracking
  eventBus.subscribe('geofence.zone.entry', async (event: any) => {
    console.log('Geofence entry, can update ETW location:', event.payload)
    // Can add location event to ETW timeline
  })
  
  eventBus.subscribe('geofence.zone.exit', async (event: any) => {
    console.log('Geofence exit, can update ETW location:', event.payload)
    // Can add location event to ETW timeline
  })
}
