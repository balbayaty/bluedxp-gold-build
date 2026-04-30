/**
 * Digital Signature Module Definition
 * Court-admissible Digital Signature Module for BlueDXP Platform
 * 
 * Supports:
 * - Internal PKI signatures (SES, AES)
 * - Saudi Arabia Qualified Electronic Signatures (QES) via Nafath/emdha
 * - Multi-stakeholder workflows (sequential, parallel, any order)
 * - Complete audit trail with tamper-evident hash chains
 * - Multi-tenant, role-based access control
 * - Mobile-first design for driver/field operations
 * - Bilingual support (English/Arabic)
 * 
 * Compliance:
 * - Saudi Electronic Transactions Law (Royal Decree M/18)
 * - Evidence Law 2022
 * - Vision 2030 alignment
 * 
 * Integration:
 * - ERPNext (document sync, webhooks)
 * - WhatsApp Business API (notifications, OTP)
 * - Mobile apps (driver signatures, POD)
 * - Web portal (admin, customer, supplier portals)
 */

import { ModuleDefinition } from './registry'

export const digitalSignatureModule: ModuleDefinition = {
  id: 'digital-signature',
  name: 'Digital Signature',
  description: 'Court-admissible digital signatures with PKI, Saudi QES (Nafath/emdha), multi-stakeholder workflows, and complete audit trails. Supports staff, customers, suppliers, and drivers.',
  version: '1.0.0',
  category: 'integration',
  standalone: true,
  dependencies: [], // Can work independently
  enabled: true,
  
  routes: [
    // Main Dashboard
    {
      path: '/digital-signatures',
      component: 'app/digital-signatures/page',
      title: 'Digital Signatures',
      icon: 'ri-file-edit-line',
      requiresAuth: true,
    },
    {
      path: '/digital-signatures/dashboard',
      component: 'app/digital-signatures/dashboard/page',
      title: 'Signature Dashboard',
      icon: 'ri-dashboard-line',
      requiresAuth: true,
    },
    
    // Document Management
    {
      path: '/digital-signatures/documents',
      component: 'app/digital-signatures/documents/page',
      title: 'Documents',
      icon: 'ri-file-text-line',
      requiresAuth: true,
    },
    {
      path: '/digital-signatures/documents/[id]',
      component: 'app/digital-signatures/documents/[id]/page',
      title: 'Document Details',
      icon: 'ri-file-text-line',
      requiresAuth: true,
    },
    
    // Workflows
    {
      path: '/digital-signatures/workflows',
      component: 'app/digital-signatures/workflows/page',
      title: 'Signing Workflows',
      icon: 'ri-flow-chart-line',
      requiresAuth: true,
    },
    {
      path: '/digital-signatures/workflows/[id]',
      component: 'app/digital-signatures/workflows/[id]/page',
      title: 'Workflow Details',
      icon: 'ri-flow-chart-line',
      requiresAuth: true,
    },
    {
      path: '/digital-signatures/workflows/create',
      component: 'app/digital-signatures/workflows/create/page',
      title: 'Create Workflow',
      icon: 'ri-add-line',
      requiresAuth: true,
    },
    
    // Signature Requests
    {
      path: '/digital-signatures/requests',
      component: 'app/digital-signatures/requests/page',
      title: 'My Signatures',
      icon: 'ri-file-edit-line',
      requiresAuth: true,
    },
    {
      path: '/digital-signatures/requests/[id]',
      component: 'app/digital-signatures/requests/[id]/page',
      title: 'Sign Document',
      icon: 'ri-file-edit-line',
      requiresAuth: false, // Public access via token
    },
    
    // Certificates
    {
      path: '/digital-signatures/certificates',
      component: 'app/digital-signatures/certificates/page',
      title: 'My Certificates',
      icon: 'ri-shield-keyhole-line',
      requiresAuth: true,
    },
    
    // Audit Trail
    {
      path: '/digital-signatures/audit',
      component: 'app/digital-signatures/audit/page',
      title: 'Audit Trail',
      icon: 'ri-file-list-3-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'QUALITY_MANAGER'],
    },
    
    // Settings
    {
      path: '/digital-signatures/settings',
      component: 'app/digital-signatures/settings/page',
      title: 'Signature Settings',
      icon: 'ri-settings-3-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN'],
    },
    
    // Nafath Integration
    {
      path: '/digital-signatures/nafath',
      component: 'app/digital-signatures/nafath/page',
      title: 'Nafath Verification',
      icon: 'ri-shield-check-line',
      requiresAuth: true,
    },
    
    // emdha Integration
    {
      path: '/digital-signatures/emdha',
      component: 'app/digital-signatures/emdha/page',
      title: 'emdha QES Signing',
      icon: 'ri-shield-star-line',
      requiresAuth: true,
    },
  ],
  
  components: [
    'components/digital-signatures/DocumentUpload',
    'components/digital-signatures/SignatureCanvas',
    'components/digital-signatures/SignatureField',
    'components/digital-signatures/DocumentViewer',
    'components/digital-signatures/WorkflowBuilder',
    'components/digital-signatures/NafathVerification',
    'components/digital-signatures/SigningCeremony',
    'components/digital-signatures/AuditTrail',
    'components/digital-signatures/Dashboard',
  ],
  
  services: [
    'lib/services/digital-signature/pkiService',
    'lib/services/digital-signature/signatureService',
    'lib/services/digital-signature/nafathService',
    'lib/services/digital-signature/emdhaService',
    'lib/services/digital-signature/workflowService',
    'lib/services/digital-signature/documentService',
    'lib/services/digital-signature/auditService',
    'lib/services/digital-signature/certificateService',
    'lib/services/digital-signature/notificationService',
  ],
  
  apis: [
    {
      endpoint: '/api/v1/signatures/documents',
      method: 'POST',
      description: 'Upload document for signing',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'OPERATIONS_MANAGER', 'CUSTOMER_ACCOUNT_MANAGER'],
    },
    {
      endpoint: '/api/v1/signatures/workflows',
      method: 'POST',
      description: 'Create signing workflow',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'OPERATIONS_MANAGER', 'CUSTOMER_ACCOUNT_MANAGER'],
    },
    {
      endpoint: '/api/v1/signatures/requests/{id}/sign',
      method: 'POST',
      description: 'Sign document',
      requiresAuth: false, // Public via token
    },
    {
      endpoint: '/api/v1/signatures/nafath/initiate',
      method: 'POST',
      description: 'Initiate Nafath verification',
      requiresAuth: true,
    },
    {
      endpoint: '/api/v1/signatures/emdha/initiate',
      method: 'POST',
      description: 'Initiate emdha QES signing',
      requiresAuth: true,
    },
    {
      endpoint: '/api/v1/signatures/verify/{signatureId}',
      method: 'GET',
      description: 'Verify signature',
      requiresAuth: true,
    },
  ],
  
  settings: [
    {
      key: 'nafath.enabled',
      value: false,
      type: 'boolean',
      description: 'Enable Nafath QES integration',
      required: false,
      default: false,
    },
    {
      key: 'emdha.enabled',
      value: false,
      type: 'boolean',
      description: 'Enable emdha QES integration',
      required: false,
      default: false,
    },
    {
      key: 'pki.rootCaName',
      value: 'BlueDXP Root CA',
      type: 'string',
      description: 'Root Certificate Authority name',
      required: true,
      default: 'BlueDXP Root CA',
    },
    {
      key: 'storage.bucket',
      value: 'documents',
      type: 'string',
      description: 'Document storage bucket',
      required: true,
      default: 'documents',
    },
    {
      key: 'notifications.emailEnabled',
      value: true,
      type: 'boolean',
      description: 'Enable email notifications',
      required: false,
      default: true,
    },
    {
      key: 'notifications.whatsappEnabled',
      value: false,
      type: 'boolean',
      description: 'Enable WhatsApp notifications',
      required: false,
      default: false,
    },
  ],
  
  featureFlags: {
    nafathIntegration: false,
    emdhaIntegration: false,
    bulkSigning: true,
    mobileApp: true,
    erpnextIntegration: false,
    whatsappNotifications: false,
  },
  
  config: {
    autoInitialize: true,
    enablePKI: true,
    enableNafath: false,
    enableEmdha: false,
    enableAuditTrail: true,
    enableMobileApp: true,
    enableERPNextIntegration: false,
    enableWhatsAppNotifications: false,
  },
}

/**
 * Initialize Digital Signature Module
 */
export async function initializeDigitalSignatureModule(tenantId: string): Promise<void> {
  console.log('🔐 Initializing Digital Signature Module...')
  
  try {
    // Initialize logger
    const { logger } = await import('@/lib/services/digital-signature/logger')
    logger.info('Initializing Digital Signature Module', { tenantId })
    
    // Initialize PKI (Root CA if not exists)
    try {
      const { pkiService } = await import('@/lib/services/digital-signature/pkiService')
      await pkiService.initializeRootCAIfNeeded({
        name: 'BlueDXP Root CA',
        subjectDN: `CN=BlueDXP Root CA, O=Flex Logistics Services, C=SA`,
        keySize: 4096,
        validityYears: 20,
      }, tenantId)
      logger.info('PKI initialized', { tenantId })
    } catch (error) {
      logger.warn('PKI initialization skipped (node-forge may not be installed)', { error: error instanceof Error ? error.message : String(error) })
    }
    
    // Initialize event bus subscriptions
    const { eventBus } = await import('@/lib/services/event-store')
    
    // Subscribe to document events
    eventBus.subscribe('digital-signature.document.uploaded', async (event) => {
      logger.info('Document uploaded event received', { documentId: event.payload?.documentId })
    })
    
    // Subscribe to signature events
    eventBus.subscribe('digital-signature.signature.completed', async (event) => {
      logger.info('Signature completed event received', { signatureId: event.payload?.signatureId })
    })
    
    // Subscribe to workflow events
    eventBus.subscribe('digital-signature.workflow.completed', async (event) => {
      logger.info('Workflow completed event received', { workflowId: event.payload?.workflowId })
    })
    
    logger.info('Digital Signature Module initialized successfully', { tenantId })
    console.log('✅ Digital Signature Module initialized')
  } catch (error) {
    console.error('❌ Error initializing Digital Signature Module:', error)
    // Don't throw - allow module to work even if initialization has issues
    // Services will initialize on first use
  }
}





