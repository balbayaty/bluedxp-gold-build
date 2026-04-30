/**
 * Customs Module Registration
 * Comprehensive customs and regulatory integration module
 */

import { ModuleDefinition } from './registry'
import { initializeTouchpoints } from '@/lib/services/customs/initializeTouchpoints'

export const customsModule: ModuleDefinition = {
  id: 'customs',
  name: 'Customs & Regulatory Integration',
  description: 'Comprehensive customs and regulatory integration covering all Middle East countries, TIR/ETIR/IRU systems, touchpoint intelligence, and compliance management.',
  version: '1.0.0',
  category: 'integration',
  standalone: true,
  enabled: true,
  dependencies: ['tms', 'wms', 'trade-compliance'],
  routes: [
    {
      path: '/customs/dashboard',
      component: 'app/customs/dashboard/page',
      title: 'Customs Dashboard',
      icon: 'FiGlobe',
      requiresAuth: true,
      roles: ['admin', 'customs-officer', 'logistics-manager'],
    },
    {
      path: '/customs/declarations',
      component: 'app/customs/declarations/page',
      title: 'Declarations',
      icon: 'FiFileText',
      requiresAuth: true,
      roles: ['admin', 'customs-officer', 'logistics-manager'],
    },
    {
      path: '/customs/touchpoints',
      component: 'app/customs/touchpoints/page',
      title: 'Touchpoints',
      icon: 'FiMapPin',
      requiresAuth: true,
      roles: ['admin', 'customs-officer', 'logistics-manager'],
    },
    {
      path: '/customs/tir',
      component: 'app/customs/tir/page',
      title: 'TIR Carnets',
      icon: 'FiTruck',
      requiresAuth: true,
      roles: ['admin', 'customs-officer', 'logistics-manager'],
    },
  ],
  components: [
    'components/customs/CustomsDashboard',
    'components/customs/DeclarationForm',
    'components/customs/DocumentManager',
    'components/customs/TouchpointMap',
  ],
  services: [
    'lib/services/customs/customsOrchestrator',
    'lib/services/customs/tirService',
    'lib/services/customs/touchpointService',
    'lib/services/customs/documentService',
    'lib/services/customs/complianceService',
  ],
  widgets: [
    {
      id: 'customs-declarations-overview',
      name: 'Declarations Overview',
      description: 'Real-time declarations status and metrics',
      component: 'components/customs/widgets/DeclarationsOverview',
      size: 'medium',
    },
    {
      id: 'customs-compliance-score',
      name: 'Compliance Score',
      description: 'Current compliance score and trends',
      component: 'components/customs/widgets/ComplianceScore',
      size: 'small',
    },
    {
      id: 'customs-touchpoint-map',
      name: 'Touchpoint Map',
      description: 'Interactive map of borders and facilities',
      component: 'components/customs/widgets/TouchpointMap',
      size: 'large',
    },
  ],
  apis: [
    {
      endpoint: '/api/customs/declarations',
      method: 'GET',
      description: 'List customs declarations',
      requiresAuth: true,
      roles: ['admin', 'customs-officer', 'logistics-manager'],
    },
    {
      endpoint: '/api/customs/declarations',
      method: 'POST',
      description: 'Create customs declaration',
      requiresAuth: true,
      roles: ['admin', 'customs-officer', 'logistics-manager'],
    },
    {
      endpoint: '/api/customs/documents',
      method: 'POST',
      description: 'Upload document',
      requiresAuth: true,
      roles: ['admin', 'customs-officer', 'logistics-manager'],
    },
    {
      endpoint: '/api/customs/touchpoints',
      method: 'GET',
      description: 'List touchpoints',
      requiresAuth: true,
      roles: ['admin', 'customs-officer', 'logistics-manager'],
    },
    {
      endpoint: '/api/customs/compliance/metrics',
      method: 'GET',
      description: 'Get compliance metrics',
      requiresAuth: true,
      roles: ['admin', 'customs-officer', 'logistics-manager'],
    },
  ],
  settings: [
    {
      key: 'enableRealTimeUpdates',
      value: true,
      type: 'boolean',
      description: 'Enable real-time status updates',
      required: false,
      default: true,
    },
    {
      key: 'autoValidateDocuments',
      value: true,
      type: 'boolean',
      description: 'Automatically validate uploaded documents',
      required: false,
      default: true,
    },
    {
      key: 'enableTIR',
      value: true,
      type: 'boolean',
      description: 'Enable TIR/ETIR integration',
      required: false,
      default: true,
    },
  ],
  featureFlags: {
    'customs-ai-recommendations': true,
    'customs-auto-fill': true,
    'customs-touchpoint-intelligence': true,
    'customs-real-time-tracking': true,
  },
  config: {
    initializeTouchpoints: true,
  },
}

// Initialize touchpoints when module is loaded (server-side only)
if (customsModule.config?.initializeTouchpoints && typeof window === 'undefined') {
  initializeTouchpoints()
  
  // Initialize integrations
  const { initializeAllIntegrations } = require('@/lib/services/customs/integrations')
  initializeAllIntegrations()
  
  // Initialize adapters
  const { initializeAdapters } = require('@/lib/services/customs/initializeAdapters')
  initializeAdapters()
}













